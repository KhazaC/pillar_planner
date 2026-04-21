import { v4 as uuidv4 } from 'uuid';
import type { BlockTemplate, AladhanTimings, IqamahSchedule, ResolvedBlock } from '../types';
import {
  blockAnchorOffsetMinutes,
  blockDurationMinutes,
  blockPreAnchorMinutes,
  iqamahConfigForPrayer,
  timeOfDayToDate,
} from '../types';
import { timingsDateFor } from './prayerTimesService';

function anchorTime(
  block: BlockTemplate,
  timings: AladhanTimings,
  iqamah: IqamahSchedule,
  date: Date
): Date | null {
  switch (block.anchor.type) {
    case 'prayerTime': {
      const base = timingsDateFor(timings, block.anchor.prayer, date);
      if (!base) return null;
      return new Date(base.getTime() + blockAnchorOffsetMinutes(block) * 60_000);
    }
    case 'iqamahTime': {
      const config = iqamahConfigForPrayer(iqamah, block.anchor.prayer);
      let base: Date | null = null;
      if (config) {
        if (config.type === 'fixed') {
          base = timeOfDayToDate(config.time, date);
        } else {
          const adhan = timingsDateFor(timings, block.anchor.prayer, date);
          if (adhan) base = new Date(adhan.getTime() + config.offsetMinutes * 60_000);
        }
      }
      if (!base) base = timingsDateFor(timings, block.anchor.prayer, date);
      if (!base) return null;
      return new Date(base.getTime() + blockAnchorOffsetMinutes(block) * 60_000);
    }
    case 'fixedTime': {
      if (block.anchor.hour === 0 && block.anchor.minute === 0) return null;
      const d = new Date(date);
      d.setHours(block.anchor.hour, block.anchor.minute, 0, 0);
      return d;
    }
    case 'filler':
      return null;
  }
}

export function resolveBlocks(
  blocks: BlockTemplate[],
  timings: AladhanTimings,
  iqamah: IqamahSchedule,
  date: Date,
  includeNap: boolean
): ResolvedBlock[] {
  const resolved: ResolvedBlock[] = [];
  let previousEnd: Date | null = null;
  let exertIndex = 1;

  // Pre-compute anchored times for filler lookahead
  const anchoredTimes: { index: number; time: Date }[] = [];
  blocks.forEach((block, index) => {
    const time = anchorTime(block, timings, iqamah, date);
    if (time) anchoredTimes.push({ index, time });
  });

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    // Skip Qaylulah if nap not included
    if (block.name.toLowerCase().includes('qaylulah') && !includeNap) continue;

    const duration = blockDurationMinutes(block);

    switch (block.anchor.type) {
      case 'prayerTime': {
        const base: Date =
          timingsDateFor(timings, block.anchor.prayer, date) ?? previousEnd ?? date;
        const start: Date = new Date(base.getTime() + blockAnchorOffsetMinutes(block) * 60_000);
        const end: Date = new Date(start.getTime() + duration * 60_000);
        resolved.push(makeResolved(block, start, end));
        previousEnd = end;
        break;
      }
      case 'iqamahTime': {
        const config = iqamahConfigForPrayer(iqamah, block.anchor.prayer);
        let iqamahDate: Date | null = null;
        if (config) {
          if (config.type === 'fixed') {
            iqamahDate = timeOfDayToDate(config.time, date);
          } else {
            const adhan = timingsDateFor(timings, block.anchor.prayer, date);
            if (adhan) iqamahDate = new Date(adhan.getTime() + config.offsetMinutes * 60_000);
          }
        }
        if (!iqamahDate) iqamahDate = timingsDateFor(timings, block.anchor.prayer, date);
        if (!iqamahDate) iqamahDate = previousEnd ?? date;

        const adjusted: Date = new Date(iqamahDate.getTime() + blockAnchorOffsetMinutes(block) * 60_000);
        const preAnchor = blockPreAnchorMinutes(block);
        const start: Date = new Date(adjusted.getTime() - preAnchor * 60_000);
        const end: Date = new Date(start.getTime() + duration * 60_000);
        resolved.push(makeResolved(block, start, end));
        previousEnd = end;
        break;
      }
      case 'fixedTime': {
        let start: Date;
        if (block.anchor.hour === 0 && block.anchor.minute === 0) {
          start = previousEnd ?? date;
        } else {
          start = new Date(date);
          start.setHours(block.anchor.hour, block.anchor.minute, 0, 0);
        }
        const end = new Date(start.getTime() + duration * 60_000);
        resolved.push(makeResolved(block, start, end));
        previousEnd = end;
        break;
      }
      case 'filler': {
        if (!previousEnd) continue;
        const fillStart: Date = previousEnd;
        let fillEnd: Date = new Date(fillStart.getTime() + 60 * 60_000);

        for (const at of anchoredTimes) {
          if (at.index <= i) continue;
          const nextBlock = blocks[at.index];
          let nextStart = new Date(at.time);
          if (nextBlock.anchor.type === 'iqamahTime') {
            nextStart = new Date(nextStart.getTime() - blockPreAnchorMinutes(nextBlock) * 60_000);
          }
          if (nextStart > fillStart) {
            fillEnd = nextStart;
            break;
          }
        }

        if (fillEnd <= fillStart) {
          fillEnd = new Date(fillStart.getTime() + 60 * 60_000);
        }

        const fillerDuration = Math.round((fillEnd.getTime() - fillStart.getTime()) / 60_000);
        const namedBlock: BlockTemplate = {
          ...block,
          name: `Exert ${exertIndex}`,
          overallDurationMinutes: fillerDuration,
        };
        exertIndex++;
        resolved.push(makeResolved(namedBlock, fillStart, fillEnd));
        previousEnd = fillEnd;
        break;
      }
    }
  }

  return resolved;
}

function makeResolved(template: BlockTemplate, start: Date, end: Date): ResolvedBlock {
  return {
    id: uuidv4(),
    template,
    startTime: start,
    endTime: end,
    actions: template.actions.map((a) => ({ ...a, isCompleted: false })),
    note: '',
  };
}

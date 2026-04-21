import { v4 as uuidv4 } from 'uuid';

// ─── Enums ───────────────────────────────────────────────

export enum NotificationMode {
  Standard = 'Standard',
  Alarm = 'Alarm',
  Silent = 'Silent',
}

export enum PrayerTime {
  Fajr = 'Fajr',
  Sunrise = 'Sunrise',
  Dhuhr = 'Dhuhr',
  Asr = 'Asr',
  Maghrib = 'Maghrib',
  Isha = 'Isha',
  Jumuah = "Jumu'ah",
}

export function apiPrayer(prayer: PrayerTime): PrayerTime {
  return prayer === PrayerTime.Jumuah ? PrayerTime.Dhuhr : prayer;
}

export enum AnchorPhase {
  PreAnchor = 'pre',
  Anchor = 'anchor',
  PostAnchor = 'post',
  None = 'none',
}

export enum TaskDifficulty {
  VeryLow = 1,
  Low = 2,
  Medium = 3,
  High = 4,
  VeryHigh = 5,
}

export const DIFFICULTY_LABELS: Record<TaskDifficulty, string> = {
  [TaskDifficulty.VeryLow]: 'Very Low',
  [TaskDifficulty.Low]: 'Low',
  [TaskDifficulty.Medium]: 'Medium',
  [TaskDifficulty.High]: 'High',
  [TaskDifficulty.VeryHigh]: 'Very High',
};

export const DIFFICULTY_MULTIPLIERS: Record<TaskDifficulty, number> = {
  [TaskDifficulty.VeryLow]: 0.5,
  [TaskDifficulty.Low]: 1.0,
  [TaskDifficulty.Medium]: 1.5,
  [TaskDifficulty.High]: 2.0,
  [TaskDifficulty.VeryHigh]: 3.0,
};

export function effortScore(durationMinutes: number | null, difficulty: TaskDifficulty): number {
  const duration = Math.max(durationMinutes ?? 5, 1);
  return duration * DIFFICULTY_MULTIPLIERS[difficulty];
}

export enum ProjectCadence {
  Daily = 'Daily',
  EveryOtherDay = 'Every Other Day',
  Weekly = 'Weekly',
  Biweekly = 'Biweekly',
  Monthly = 'Monthly',
}

export const CADENCE_DAYS: Record<ProjectCadence, number> = {
  [ProjectCadence.Daily]: 1,
  [ProjectCadence.EveryOtherDay]: 2,
  [ProjectCadence.Weekly]: 7,
  [ProjectCadence.Biweekly]: 14,
  [ProjectCadence.Monthly]: 30,
};

export enum ProjectPriority {
  Low = 1,
  Medium = 2,
  High = 3,
  Critical = 4,
}

export const PRIORITY_LABELS: Record<ProjectPriority, string> = {
  [ProjectPriority.Low]: 'Low',
  [ProjectPriority.Medium]: 'Medium',
  [ProjectPriority.High]: 'High',
  [ProjectPriority.Critical]: 'Critical',
};

export const PRIORITY_WEIGHTS: Record<ProjectPriority, number> = {
  [ProjectPriority.Low]: 1.0,
  [ProjectPriority.Medium]: 2.0,
  [ProjectPriority.High]: 3.5,
  [ProjectPriority.Critical]: 5.0,
};

export enum ProjectLifecycleStatus {
  Active = 'Active',
  Completed = 'Completed',
  Archived = 'Archived',
  Abandoned = 'Abandoned',
}

export enum AdHocRecurrence {
  OneAndDone = 'One & Done',
  RePlannable = 'Re-plannable',
}

export enum AdHocStatus {
  Active = 'Active',
  Completed = 'Completed',
  Abandoned = 'Abandoned',
}

// ─── Tagged Unions ───────────────────────────────────────

export type BlockAnchor =
  | { type: 'prayerTime'; prayer: PrayerTime; offsetMinutes: number | null }
  | { type: 'iqamahTime'; prayer: PrayerTime; offsetMinutes: number | null }
  | { type: 'fixedTime'; hour: number; minute: number }
  | { type: 'filler' };

export function anchorShortLabel(anchor: BlockAnchor): string {
  switch (anchor.type) {
    case 'prayerTime': {
      if (anchor.offsetMinutes == null) {
        return `@ ${anchor.prayer} (auto)`;
      }
      const sign = anchor.offsetMinutes >= 0 ? '+' : '';
      return anchor.offsetMinutes === 0
        ? `@ ${anchor.prayer}`
        : `@ ${anchor.prayer} ${sign}${anchor.offsetMinutes}m`;
    }
    case 'iqamahTime':
      return anchor.offsetMinutes == null
        ? `Iqamah ${anchor.prayer} (auto)`
        : anchor.offsetMinutes === 0
          ? `Iqamah ${anchor.prayer}`
          : `Iqamah ${anchor.prayer} ${anchor.offsetMinutes >= 0 ? '+' : ''}${anchor.offsetMinutes}m`;
    case 'fixedTime':
      if (anchor.hour === 0 && anchor.minute === 0) return '→ chain';
      return `@ ${String(anchor.hour).padStart(2, '0')}:${String(anchor.minute).padStart(2, '0')}`;
    case 'filler':
      return 'filler';
  }
}

export type IqamahTimeConfig =
  | { type: 'fixed'; time: TimeOfDay }
  | { type: 'relative'; offsetMinutes: number };

export type AdHocTimeWindow =
  | { type: 'anytime' }
  | { type: 'at'; time: TimeOfDay }
  | { type: 'after'; time: TimeOfDay }
  | { type: 'between'; start: TimeOfDay; end: TimeOfDay };

// ─── Value Objects ───────────────────────────────────────

export interface TimeOfDay {
  hour: number; // 0-23
  minute: number; // 0-59
}

export function formatTimeOfDay(t: TimeOfDay): string {
  const h = t.hour % 12 || 12;
  const m = String(t.minute).padStart(2, '0');
  const ampm = t.hour < 12 ? 'AM' : 'PM';
  return `${h}:${m} ${ampm}`;
}

export function timeOfDayToDate(t: TimeOfDay, date: Date): Date {
  const d = new Date(date);
  d.setHours(t.hour, t.minute, 0, 0);
  return d;
}

// ─── Core Entities ───────────────────────────────────────

export interface ActionItem {
  id: string;
  title: string;
  durationMinutes: number | null;
  isCompleted: boolean;
  anchorPhase: AnchorPhase;
  difficulty: TaskDifficulty;
  defaultProjectIDs: string[];
  taskID: string | null;
}

export function createActionItem(partial: Partial<ActionItem> & { title: string }): ActionItem {
  return {
    id: uuidv4(),
    durationMinutes: null,
    isCompleted: false,
    anchorPhase: AnchorPhase.None,
    difficulty: TaskDifficulty.Low,
    defaultProjectIDs: [],
    taskID: null,
    ...partial,
  };
}

export interface BlockTemplate {
  id: string;
  name: string;
  anchor: BlockAnchor;
  actions: ActionItem[];
  overallDurationMinutes: number | null;
  earlyNotificationMinutes: number;
  colorTag: string;
}

export function blockDurationMinutes(block: BlockTemplate): number {
  if (block.anchor.type === 'filler') return 0;
  if (block.overallDurationMinutes != null) return block.overallDurationMinutes;
  const sum = block.actions.reduce((s, a) => s + (a.durationMinutes ?? 0), 0);
  return Math.max(sum, 1);
}

export function blockPreAnchorMinutes(block: BlockTemplate): number {
  return block.actions
    .filter((a) => a.anchorPhase === AnchorPhase.PreAnchor)
    .reduce((s, a) => s + (a.durationMinutes ?? 0), 0);
}

export function blockAnchorOffsetMinutes(block: BlockTemplate): number {
  if (block.anchor.type === 'prayerTime') {
    return block.anchor.offsetMinutes ?? -blockPreAnchorMinutes(block);
  }
  if (block.anchor.type === 'iqamahTime') {
    return block.anchor.offsetMinutes ?? 0;
  }
  return 0;
}

export function createBlockTemplate(
  partial: Partial<BlockTemplate> & { name: string; anchor: BlockAnchor }
): BlockTemplate {
  return {
    id: uuidv4(),
    actions: [],
    overallDurationMinutes: null,
    earlyNotificationMinutes: 0,
    colorTag: 'blue',
    ...partial,
  };
}

export interface RoutineTemplate {
  id: string;
  name: string;
  description: string;
  blockIDs: string[];
  suggestedWeekdays: number[]; // 1=Sun .. 7=Sat
}

export function createRoutineTemplate(
  partial: Partial<RoutineTemplate> & { name: string }
): RoutineTemplate {
  return {
    id: uuidv4(),
    description: '',
    blockIDs: [],
    suggestedWeekdays: [],
    ...partial,
  };
}

export interface IqamahSchedule {
  fajr: IqamahTimeConfig;
  dhuhr: IqamahTimeConfig;
  asr: IqamahTimeConfig;
  maghrib: IqamahTimeConfig;
  isha: IqamahTimeConfig;
  jumuah: IqamahTimeConfig;
}

export const DEFAULT_IQAMAH_SCHEDULE: IqamahSchedule = {
  fajr: { type: 'fixed', time: { hour: 6, minute: 30 } },
  dhuhr: { type: 'fixed', time: { hour: 13, minute: 45 } },
  asr: { type: 'fixed', time: { hour: 17, minute: 15 } },
  maghrib: { type: 'relative', offsetMinutes: 15 },
  isha: { type: 'fixed', time: { hour: 20, minute: 45 } },
  jumuah: { type: 'fixed', time: { hour: 13, minute: 15 } },
};

export function iqamahConfigForPrayer(
  schedule: IqamahSchedule,
  prayer: PrayerTime
): IqamahTimeConfig | null {
  switch (prayer) {
    case PrayerTime.Fajr:
      return schedule.fajr;
    case PrayerTime.Dhuhr:
      return schedule.dhuhr;
    case PrayerTime.Asr:
      return schedule.asr;
    case PrayerTime.Maghrib:
      return schedule.maghrib;
    case PrayerTime.Isha:
      return schedule.isha;
    case PrayerTime.Jumuah:
      return schedule.jumuah;
    case PrayerTime.Sunrise:
      return null;
  }
}

export interface ResolvedBlock {
  id: string;
  template: BlockTemplate;
  startTime: Date;
  endTime: Date;
  actions: ActionItem[];
  note: string;
}

export interface Project {
  id: string;
  name: string;
  category: string;
  priority: ProjectPriority;
  cadence: ProjectCadence;
  isActive: boolean;
  tracksCompletion: boolean;
  exertEligible: boolean;
  status: ProjectLifecycleStatus;
  completionNote: string | null;
  completionDate: string | null; // ISO date
}

export function createProject(partial: Partial<Project> & { name: string }): Project {
  return {
    id: uuidv4(),
    category: '',
    priority: ProjectPriority.Medium,
    cadence: ProjectCadence.Weekly,
    isActive: true,
    tracksCompletion: false,
    exertEligible: true,
    status: ProjectLifecycleStatus.Active,
    completionNote: null,
    completionDate: null,
    ...partial,
  };
}

export interface TaskDefinition {
  id: string;
  title: string;
  defaultDurationMinutes: number | null;
  defaultDifficulty: TaskDifficulty;
  defaultProjectIDs: string[];
  requiresCompletionDetails: boolean;
}

export function createTaskDefinition(
  partial: Partial<TaskDefinition> & { title: string }
): TaskDefinition {
  return {
    id: uuidv4(),
    defaultDurationMinutes: null,
    defaultDifficulty: TaskDifficulty.Low,
    defaultProjectIDs: [],
    requiresCompletionDetails: false,
    ...partial,
  };
}

export interface AdHocTask {
  id: string;
  taskID: string;
  recurrence: AdHocRecurrence;
  status: AdHocStatus;
  createdDate: string; // ISO
  completedDate: string | null;
  abandonedDate: string | null;
  abandonReason: string | null;
  difficulty: TaskDifficulty;
  estimatedMinutes: number | null;
  timeWindow: AdHocTimeWindow;
  timeNote: string | null;
}

export function createAdHocTask(
  partial: Partial<AdHocTask> & { taskID: string }
): AdHocTask {
  return {
    id: uuidv4(),
    recurrence: AdHocRecurrence.RePlannable,
    status: AdHocStatus.Active,
    createdDate: new Date().toISOString(),
    completedDate: null,
    abandonedDate: null,
    abandonReason: null,
    difficulty: TaskDifficulty.Low,
    estimatedMinutes: null,
    timeWindow: { type: 'anytime' },
    timeNote: null,
    ...partial,
  };
}

// ─── API Types ───────────────────────────────────────────

export interface AladhanTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export interface AladhanData {
  timings: AladhanTimings;
}

export interface AladhanResponse {
  code: number;
  status: string;
  data: AladhanData;
}

export function timingsDateFor(
  timings: AladhanTimings,
  prayer: PrayerTime,
  date: Date
): Date | null {
  const key = prayer === PrayerTime.Jumuah ? 'Dhuhr' : prayer;
  const timeStr = timings[key as keyof AladhanTimings];
  if (!timeStr) return null;
  // Handle formats like "05:23" or "05:23 (PKT)"
  const clean = timeStr.split(' ')[0];
  const [h, m] = clean.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

// ─── Persistence Log Types ───────────────────────────────

export interface DayLog {
  id: string;
  date: string; // ISO date (date only)
  routineId: string | null;
  routineName: string | null;
  city: string | null;
  earnedScore: number;
  possibleScore: number;
  shortTermLoad: number;
  longTermLoad: number;
  blockLogs: BlockLog[];
}

export interface BlockLog {
  id: string;
  blockId: string;
  name: string;
  startTime: string;
  endTime: string;
  note: string;
  orderIndex: number;
  projectIDs: string[];
  actionLogs: ActionLog[];
}

export interface ActionLog {
  id: string;
  title: string;
  isCompleted: boolean;
  durationMinutes: number;
  orderIndex: number;
  anchorPhase: string;
  difficulty: number;
  effortScore: number;
  projectIDs: string[];
  actualDifficulty: number;
  actualDurationMinutes: number;
  taskDefinitionID: string | null;
}

export interface AdHocLog {
  id: string;
  adHocTaskID: string;
  taskDefinitionID: string | null;
  date: string;
  isCompleted: boolean;
  isSkipped: boolean;
  effortScore: number;
  actualDifficulty: number;
  actualDurationMinutes: number;
}

export interface ProjectLog {
  id: string;
  projectId: string;
  date: string;
  minutesSpent: number;
  blockLogId: string | null;
  actionLogId: string | null;
  percentage: number;
}

export interface DayProjectTag {
  id: string;
  projectId: string;
  date: string;
  percentage: number;
}

// ─── Color Map ───────────────────────────────────────────

export const COLOR_MAP: Record<string, string> = {
  indigo: '#5856D6',
  orange: '#FF9500',
  yellow: '#FFCC00',
  pink: '#FF2D55',
  purple: '#AF52DE',
  blue: '#007AFF',
  red: '#FF3B30',
  teal: '#5AC8FA',
  gray: '#8E8E93',
  green: '#34C759',
};

export const VALID_COLORS = Object.keys(COLOR_MAP);

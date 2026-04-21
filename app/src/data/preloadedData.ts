import quickStartBundle from './quickStartBundle.json';
import type { BlockTemplate, RoutineTemplate } from '../types';

export const defaultBlocks = quickStartBundle.blocks as BlockTemplate[];

export function defaultRoutines(): RoutineTemplate[] {
  return quickStartBundle.routines as RoutineTemplate[];
}

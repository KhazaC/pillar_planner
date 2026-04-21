import type { BlockTemplate, RoutineTemplate, Project, TaskDefinition, AdHocTask, IqamahSchedule } from '../types';
import {
  NotificationMode,
  DEFAULT_IQAMAH_SCHEDULE,
} from '../types';

const KEYS = {
  blockTemplates: 'sigh_blockTemplates',
  routineTemplates: 'sigh_routineTemplates',
  projects: 'sigh_projects',
  taskDefinitions: 'sigh_taskDefinitions',
  adHocTasks: 'sigh_adHocTasks',
  iqamahSchedule: 'sigh_iqamahSchedule',
  city: 'sigh_city',
  notificationMode: 'sigh_notificationMode',
  includeNap: 'sigh_includeNap',
  selectedRoutineId: 'sigh_selectedRoutineId',
  taskMigrationDone: 'sigh_taskMigrationDone',
} as const;

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJSON<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadBlockTemplates(): BlockTemplate[] {
  return loadJSON<BlockTemplate[]>(KEYS.blockTemplates, []);
}
export function saveBlockTemplates(v: BlockTemplate[]) {
  saveJSON(KEYS.blockTemplates, v);
}

export function loadRoutineTemplates(): RoutineTemplate[] {
  return loadJSON<RoutineTemplate[]>(KEYS.routineTemplates, []);
}
export function saveRoutineTemplates(v: RoutineTemplate[]) {
  saveJSON(KEYS.routineTemplates, v);
}

export function loadProjects(): Project[] {
  return loadJSON<Project[]>(KEYS.projects, []);
}
export function saveProjects(v: Project[]) {
  saveJSON(KEYS.projects, v);
}

export function loadTaskDefinitions(): TaskDefinition[] {
  return loadJSON<TaskDefinition[]>(KEYS.taskDefinitions, []);
}
export function saveTaskDefinitions(v: TaskDefinition[]) {
  saveJSON(KEYS.taskDefinitions, v);
}

export function loadAdHocTasks(): AdHocTask[] {
  return loadJSON<AdHocTask[]>(KEYS.adHocTasks, []);
}
export function saveAdHocTasks(v: AdHocTask[]) {
  saveJSON(KEYS.adHocTasks, v);
}

export function loadIqamahSchedule(): IqamahSchedule {
  return loadJSON<IqamahSchedule>(KEYS.iqamahSchedule, DEFAULT_IQAMAH_SCHEDULE);
}
export function saveIqamahSchedule(v: IqamahSchedule) {
  saveJSON(KEYS.iqamahSchedule, v);
}

export function loadCity(): string {
  return localStorage.getItem(KEYS.city) || 'Houston';
}
export function saveCity(v: string) {
  localStorage.setItem(KEYS.city, v);
}

export function loadNotificationMode(): NotificationMode {
  return (localStorage.getItem(KEYS.notificationMode) as NotificationMode) || NotificationMode.Standard;
}
export function saveNotificationMode(v: NotificationMode) {
  localStorage.setItem(KEYS.notificationMode, v);
}

export function loadIncludeNap(defaultValue: boolean): boolean {
  const raw = localStorage.getItem(KEYS.includeNap);
  if (raw === null) return defaultValue;
  return raw === 'true';
}
export function saveIncludeNap(v: boolean) {
  localStorage.setItem(KEYS.includeNap, String(v));
}

export function loadSelectedRoutineId(): string | null {
  return localStorage.getItem(KEYS.selectedRoutineId);
}
export function saveSelectedRoutineId(v: string) {
  localStorage.setItem(KEYS.selectedRoutineId, v);
}
export function clearSelectedRoutineId() {
  localStorage.removeItem(KEYS.selectedRoutineId);
}

export function isTaskMigrationDone(): boolean {
  return localStorage.getItem(KEYS.taskMigrationDone) === 'true';
}
export function setTaskMigrationDone() {
  localStorage.setItem(KEYS.taskMigrationDone, 'true');
}

// ─── Day Logs (IndexedDB-like, using localStorage for simplicity) ────

const DAY_LOGS_KEY = 'sigh_dayLogs';
const ADHOC_LOGS_KEY = 'sigh_adHocLogs';
const PROJECT_LOGS_KEY = 'sigh_projectLogs';
const DAY_PROJECT_TAGS_KEY = 'sigh_dayProjectTags';

import type { DayLog, AdHocLog, ProjectLog, DayProjectTag } from '../types';

export function loadDayLogs(): DayLog[] {
  return loadJSON<DayLog[]>(DAY_LOGS_KEY, []);
}
export function saveDayLogs(v: DayLog[]) {
  saveJSON(DAY_LOGS_KEY, v);
}

export function loadAdHocLogs(): AdHocLog[] {
  return loadJSON<AdHocLog[]>(ADHOC_LOGS_KEY, []);
}
export function saveAdHocLogs(v: AdHocLog[]) {
  saveJSON(ADHOC_LOGS_KEY, v);
}

export function loadProjectLogs(): ProjectLog[] {
  return loadJSON<ProjectLog[]>(PROJECT_LOGS_KEY, []);
}
export function saveProjectLogs(v: ProjectLog[]) {
  saveJSON(PROJECT_LOGS_KEY, v);
}

export function loadDayProjectTags(): DayProjectTag[] {
  return loadJSON<DayProjectTag[]>(DAY_PROJECT_TAGS_KEY, []);
}
export function saveDayProjectTags(v: DayProjectTag[]) {
  saveJSON(DAY_PROJECT_TAGS_KEY, v);
}

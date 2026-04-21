import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  BlockTemplate,
  RoutineTemplate,
  Project,
  TaskDefinition,
  AdHocTask,
  IqamahSchedule,
  ResolvedBlock,
  DayLog,
  AdHocLog,
} from '../types';
import {
  AnchorPhase,
  NotificationMode,
  AdHocStatus,
  AdHocRecurrence,
  ProjectLifecycleStatus,
  TaskDifficulty,
  DEFAULT_IQAMAH_SCHEDULE,
  effortScore,
  createActionItem,
  createTaskDefinition,
  formatTimeOfDay,
} from '../types';
import * as persistence from '../services/persistence';
import { defaultBlocks, defaultRoutines } from '../data/preloadedData';
import { fetchPrayerTimes } from '../services/prayerTimesService';
import { resolveBlocks } from '../services/blockResolver';
import { startOfDay, format, differenceInDays, subDays } from 'date-fns';

export interface AdHocPlan {
  id: string;
  adHocTaskID: string;
  taskDefID: string | null;
  title: string;
  isCompleted: boolean;
  isSkipped: boolean;
  skipCount: number;
  daysSinceCreated: number;
  timeWindowLabel: string | null;
  effortScore: number;
}

interface AppState {
  // Template data
  blockTemplates: BlockTemplate[];
  routineTemplates: RoutineTemplate[];
  projects: Project[];
  taskDefinitions: TaskDefinition[];
  adHocTasks: AdHocTask[];
  iqamahSchedule: IqamahSchedule;
  city: string;
  notificationMode: NotificationMode;

  // Day view state
  selectedRoutine: RoutineTemplate | null;
  resolvedBlocks: ResolvedBlock[];
  isLoading: boolean;
  errorMessage: string | null;
  includeNap: boolean;
  adHocPlans: AdHocPlan[];
  date: Date;

  // Actions
  initialize: () => void;
  loadDay: () => Promise<void>;
  selectRoutine: (routine: RoutineTemplate) => void;
  toggleAction: (blockIndex: number, actionIndex: number) => void;
  addActionToResolvedBlock: (
    blockIndex: number,
    title: string,
    details?: { durationMinutes?: number | null; difficulty?: TaskDifficulty }
  ) => void;
  removeActionFromResolvedBlock: (blockIndex: number, actionIndex: number) => void;
  moveActionBetweenResolvedBlocks: (
    fromBlockIndex: number,
    actionIndex: number,
    toBlockIndex: number
  ) => void;
  completeActionWithDetails: (
    blockIndex: number,
    actionIndex: number,
    details: { durationMinutes: number | null; difficulty: TaskDifficulty }
  ) => void;
  updateNote: (blockIndex: number, note: string) => void;

  // Block CRUD
  addBlock: (block: BlockTemplate) => void;
  updateBlock: (block: BlockTemplate) => void;
  deleteBlock: (id: string) => void;

  // Routine CRUD
  addRoutine: (routine: RoutineTemplate) => void;
  updateRoutine: (routine: RoutineTemplate) => void;
  deleteRoutine: (id: string) => void;

  // Project CRUD
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  completeProject: (id: string, note: string) => void;
  archiveProject: (id: string, note: string) => void;
  abandonProject: (id: string, note: string) => void;
  reactivateProject: (id: string) => void;

  // Task Def CRUD
  addTaskDefinition: (td: TaskDefinition) => void;
  updateTaskDefinition: (td: TaskDefinition) => void;
  deleteTaskDefinition: (id: string) => void;
  findOrCreateTaskDefinition: (title: string) => TaskDefinition;

  // Ad-hoc CRUD
  addAdHocTask: (task: AdHocTask) => void;
  updateAdHocTask: (task: AdHocTask) => void;
  deleteAdHocTask: (id: string) => void;
  planAdHocForDay: (adHocTask: AdHocTask) => void;
  moveAdHocPlanToBlock: (adHocTaskID: string, blockIndex: number) => void;
  toggleAdHocCompletion: (adHocTaskID: string) => void;
  skipAdHocForDay: (adHocTaskID: string) => void;
  removeAdHocPlan: (adHocTaskID: string) => void;

  // Settings
  setCity: (city: string) => void;
  setIqamahSchedule: (schedule: IqamahSchedule) => void;
  setNotificationMode: (mode: NotificationMode) => void;
  setIncludeNap: (v: boolean) => void;

  // Import/Export
  importBundle: (json: string, mode: 'replace' | 'merge') => void;
  exportBundle: () => string;

  // Helpers
  blocksForRoutine: (routine: RoutineTemplate) => BlockTemplate[];
  suggestedRoutine: () => RoutineTemplate | null;
  activeProjects: () => Project[];
}

export const useStore = create<AppState>((set, get) => ({
  blockTemplates: [],
  routineTemplates: [],
  projects: [],
  taskDefinitions: [],
  adHocTasks: [],
  iqamahSchedule: DEFAULT_IQAMAH_SCHEDULE,
  city: 'Houston',
  notificationMode: NotificationMode.Standard,
  selectedRoutine: null,
  resolvedBlocks: [],
  isLoading: false,
  errorMessage: null,
  includeNap: (() => {
    const month = new Date().getMonth() + 1;
    return month >= 4 && month <= 8;
  })(),
  adHocPlans: [],
  date: new Date(),

  initialize: () => {
    let blocks = persistence.loadBlockTemplates();
    let routines = persistence.loadRoutineTemplates();
    const projects = persistence.loadProjects();
    let taskDefs = persistence.loadTaskDefinitions();
    const adHocTasks = persistence.loadAdHocTasks();
    const iqamah = persistence.loadIqamahSchedule();
    const city = persistence.loadCity();
    const notifMode = persistence.loadNotificationMode();

    if (blocks.length === 0) {
      blocks = defaultBlocks;
      persistence.saveBlockTemplates(blocks);
    }
    if (routines.length === 0) {
      routines = defaultRoutines();
      persistence.saveRoutineTemplates(routines);
    }

    // Generate task definitions from existing block actions if needed.
    if (taskDefs.length === 0) {
      const newDefs: TaskDefinition[] = [];
      const titleMap = new Map<string, string>();
      const updatedBlocks = blocks.map((b) => {
        const actions = b.actions.map((a) => {
          const normalizedTitle = a.title.trim();
          if (!normalizedTitle) return a;

          if (!titleMap.has(normalizedTitle)) {
            const td = createTaskDefinition({
              title: normalizedTitle,
              defaultDurationMinutes: a.durationMinutes,
              defaultDifficulty: a.difficulty,
            });
            newDefs.push(td);
            titleMap.set(normalizedTitle, td.id);
          }

          return { ...a, title: normalizedTitle, taskID: titleMap.get(normalizedTitle) ?? null };
        });
        return { ...b, actions };
      });

      if (newDefs.length > 0) {
        persistence.saveTaskDefinitions(newDefs);
        persistence.saveBlockTemplates(updatedBlocks);
        blocks = updatedBlocks;
        taskDefs = newDefs;
      }
      persistence.setTaskMigrationDone();
    }

    // Backfill missing task links in existing blocks.
    if (taskDefs.length > 0) {
      const taskIdByTitle = new Map(taskDefs.map((td) => [td.title.trim().toLowerCase(), td.id]));
      let changed = false;
      const updatedBlocks = blocks.map((b) => {
        const actions = b.actions.map((a) => {
          if (a.taskID) return a;
          const taskID = taskIdByTitle.get(a.title.trim().toLowerCase()) ?? null;
          if (!taskID) return a;
          changed = true;
          return { ...a, taskID };
        });
        return { ...b, actions };
      });
      if (changed) {
        blocks = updatedBlocks;
        persistence.saveBlockTemplates(updatedBlocks);
      }
    }

    // Backfill newly added task definition fields for older saved data.
    if (taskDefs.some((td) => td.requiresCompletionDetails === undefined)) {
      taskDefs = taskDefs.map((td) => ({
        ...td,
        requiresCompletionDetails: td.requiresCompletionDetails ?? false,
      }));
      persistence.saveTaskDefinitions(taskDefs);
    }

    const month = new Date().getMonth() + 1;
    const defaultIncludeNap = month >= 4 && month <= 8;
    const includeNap = persistence.loadIncludeNap(defaultIncludeNap);
    const selectedRoutineId = persistence.loadSelectedRoutineId();
    const selectedRoutine =
      routines.find((r) => r.id === selectedRoutineId) ||
      (() => {
        const dow = new Date().getDay(); // 0=Sun
        const weekday = dow === 0 ? 1 : dow + 1; // 1=Sun..7=Sat
        return routines.find((r) => r.suggestedWeekdays.includes(weekday)) || routines[0] || null;
      })();

    set({
      blockTemplates: blocks,
      routineTemplates: routines,
      projects,
      taskDefinitions: taskDefs,
      adHocTasks,
      iqamahSchedule: iqamah,
      city,
      notificationMode: notifMode,
      includeNap,
      selectedRoutine,
    });

    if (selectedRoutine) {
      persistence.saveSelectedRoutineId(selectedRoutine.id);
    } else {
      persistence.clearSelectedRoutineId();
    }
  },

  loadDay: async () => {
    const state = get();
    if (!state.selectedRoutine) return;

    set({ isLoading: true, errorMessage: null });

    try {
      const timings = await fetchPrayerTimes(state.city, state.date);
      const blocks = state.blocksForRoutine(state.selectedRoutine);
      const resolved = resolveBlocks(
        blocks,
        timings,
        state.iqamahSchedule,
        state.date,
        state.includeNap
      );

      // Restore saved state from persistence
      const dateKey = format(startOfDay(state.date), 'yyyy-MM-dd');
      const dayLogs = persistence.loadDayLogs();
      const dayLog = dayLogs.find((d) => d.date === dateKey);

      if (dayLog) {
        const blockMap = new Map(dayLog.blockLogs.map((bl) => [bl.orderIndex, bl]));
        const actionMap = new Map<string, { isCompleted: boolean; durationMinutes: number; difficulty: TaskDifficulty }>();
        const loggedActionIDs = new Set<string>();
        const noteMap = new Map<number, string>();
        dayLog.blockLogs.forEach((bl) => {
          if (bl.note) noteMap.set(bl.orderIndex, bl.note);
          bl.actionLogs.forEach((al) => {
            loggedActionIDs.add(al.id);
            actionMap.set(al.id, {
              isCompleted: al.isCompleted,
              durationMinutes: al.actualDurationMinutes || al.durationMinutes,
              difficulty: (al.actualDifficulty as TaskDifficulty) || al.difficulty,
            });
          });
        });

        resolved.forEach((rb, orderIndex) => {
          const note = noteMap.get(orderIndex);
          if (note) rb.note = note;

          const blockLog = blockMap.get(orderIndex);
          if (blockLog) {
            const currentById = new Map(rb.actions.map((a) => [a.id, a]));
            const mergedFromLog = [...blockLog.actionLogs]
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((al) => {
                const existing = currentById.get(al.id);
                if (existing) return existing;
                return createActionItem({
                  id: al.id,
                  title: al.title,
                  isCompleted: al.isCompleted,
                  durationMinutes: (al.actualDurationMinutes || al.durationMinutes) || null,
                  anchorPhase: (al.anchorPhase as AnchorPhase) || AnchorPhase.None,
                  difficulty: (al.actualDifficulty as TaskDifficulty) || al.difficulty,
                  defaultProjectIDs: al.projectIDs || [],
                  taskID: al.taskDefinitionID,
                  adHocTaskID: al.adHocTaskID ?? null,
                });
              });

            const mergedIds = new Set(mergedFromLog.map((a) => a.id));
            const missingCurrent = rb.actions.filter(
              (a) => !mergedIds.has(a.id) && !loggedActionIDs.has(a.id)
            );
            rb.actions = [...mergedFromLog, ...missingCurrent];
          }

          rb.actions.forEach((a) => {
            const saved = actionMap.get(a.id);
            if (!saved) return;
            a.isCompleted = saved.isCompleted;
            a.durationMinutes = saved.durationMinutes || null;
            a.difficulty = saved.difficulty;
          });
        });
      }

      // Save day log
      saveDayLog(state, resolved, dateKey, dayLogs);

      // Load ad-hoc plans
      const plans = loadAdHocPlans(state, dateKey);

      set({ resolvedBlocks: resolved, isLoading: false, adHocPlans: plans });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load prayer times';
      set({ errorMessage: msg, isLoading: false });
    }
  },

  selectRoutine: (routine) => {
    set({ selectedRoutine: routine });
    persistence.saveSelectedRoutineId(routine.id);
  },

  toggleAction: (blockIndex, actionIndex) => {
    const blocks = [...get().resolvedBlocks];
    const block = { ...blocks[blockIndex] };
    const actions = [...block.actions];
    actions[actionIndex] = { ...actions[actionIndex], isCompleted: !actions[actionIndex].isCompleted };
    syncAdHocFromBlockAction(actions[actionIndex], get, set);
    block.actions = actions;
    blocks[blockIndex] = block;
    set({ resolvedBlocks: blocks });

    // Persist
    const dateKey = format(startOfDay(get().date), 'yyyy-MM-dd');
    const dayLogs = persistence.loadDayLogs();
    saveDayLog(get(), blocks, dateKey, dayLogs);
  },

  addActionToResolvedBlock: (blockIndex, title, details) => {
    const normalized = title.trim();
    if (!normalized) return;

    const state = get();
    let taskDefs = state.taskDefinitions;
    let taskDef = taskDefs.find(
      (td) => td.title.trim().toLowerCase() === normalized.toLowerCase()
    );

    if (!taskDef) {
      taskDef = createTaskDefinition({
        title: normalized,
        defaultDurationMinutes: details?.durationMinutes ?? null,
        defaultDifficulty: details?.difficulty ?? TaskDifficulty.Low,
      });
      taskDefs = [...taskDefs, taskDef];
      set({ taskDefinitions: taskDefs });
      persistence.saveTaskDefinitions(taskDefs);
    }

    const durationMinutes =
      details?.durationMinutes !== undefined
        ? details.durationMinutes
        : taskDef.defaultDurationMinutes;
    const difficulty = details?.difficulty ?? taskDef.defaultDifficulty;

    const blocks = [...get().resolvedBlocks];
    const block = { ...blocks[blockIndex] };
    const actions = [
      ...block.actions,
      createActionItem({
        title: taskDef.title,
        taskID: taskDef.id,
        durationMinutes,
        difficulty,
        defaultProjectIDs: taskDef.defaultProjectIDs,
      }),
    ];
    block.actions = actions;
    blocks[blockIndex] = block;
    set({ resolvedBlocks: blocks });

    const dateKey = format(startOfDay(get().date), 'yyyy-MM-dd');
    const dayLogs = persistence.loadDayLogs();
    saveDayLog(get(), blocks, dateKey, dayLogs);
  },

  removeActionFromResolvedBlock: (blockIndex, actionIndex) => {
    const blocks = [...get().resolvedBlocks];
    const block = { ...blocks[blockIndex] };
    block.actions = block.actions.filter((_, i) => i !== actionIndex);
    blocks[blockIndex] = block;
    set({ resolvedBlocks: blocks });

    const dateKey = format(startOfDay(get().date), 'yyyy-MM-dd');
    const dayLogs = persistence.loadDayLogs();
    saveDayLog(get(), blocks, dateKey, dayLogs);
  },

  moveActionBetweenResolvedBlocks: (fromBlockIndex, actionIndex, toBlockIndex) => {
    if (fromBlockIndex === toBlockIndex) return;

    const blocks = [...get().resolvedBlocks];
    const fromBlock = { ...blocks[fromBlockIndex] };
    const toBlock = { ...blocks[toBlockIndex] };
    const fromActions = [...fromBlock.actions];
    const [moved] = fromActions.splice(actionIndex, 1);
    if (!moved) return;

    const toActions = [...toBlock.actions, moved];
    fromBlock.actions = fromActions;
    toBlock.actions = toActions;
    blocks[fromBlockIndex] = fromBlock;
    blocks[toBlockIndex] = toBlock;
    set({ resolvedBlocks: blocks });

    const dateKey = format(startOfDay(get().date), 'yyyy-MM-dd');
    const dayLogs = persistence.loadDayLogs();
    saveDayLog(get(), blocks, dateKey, dayLogs);
  },

  completeActionWithDetails: (blockIndex, actionIndex, details) => {
    const blocks = [...get().resolvedBlocks];
    const block = { ...blocks[blockIndex] };
    const actions = [...block.actions];
    const current = actions[actionIndex];
    actions[actionIndex] = {
      ...current,
      isCompleted: true,
      durationMinutes: details.durationMinutes,
      difficulty: details.difficulty,
    };
    syncAdHocFromBlockAction(actions[actionIndex], get, set);
    block.actions = actions;
    blocks[blockIndex] = block;
    set({ resolvedBlocks: blocks });

    const dateKey = format(startOfDay(get().date), 'yyyy-MM-dd');
    const dayLogs = persistence.loadDayLogs();
    saveDayLog(get(), blocks, dateKey, dayLogs);
  },

  updateNote: (blockIndex, note) => {
    const blocks = [...get().resolvedBlocks];
    blocks[blockIndex] = { ...blocks[blockIndex], note };
    set({ resolvedBlocks: blocks });

    const dateKey = format(startOfDay(get().date), 'yyyy-MM-dd');
    const dayLogs = persistence.loadDayLogs();
    saveDayLog(get(), blocks, dateKey, dayLogs);
  },

  // Block CRUD
  addBlock: (block) => {
    const updated = [...get().blockTemplates, block];
    set({ blockTemplates: updated });
    persistence.saveBlockTemplates(updated);
  },
  updateBlock: (block) => {
    const updated = get().blockTemplates.map((b) => (b.id === block.id ? block : b));
    set({ blockTemplates: updated });
    persistence.saveBlockTemplates(updated);
  },
  deleteBlock: (id) => {
    const blocks = get().blockTemplates.filter((b) => b.id !== id);
    const routines = get().routineTemplates.map((r) => ({
      ...r,
      blockIDs: r.blockIDs.filter((bid) => bid !== id),
    }));
    set({ blockTemplates: blocks, routineTemplates: routines });
    persistence.saveBlockTemplates(blocks);
    persistence.saveRoutineTemplates(routines);
  },

  // Routine CRUD
  addRoutine: (routine) => {
    const updated = [...get().routineTemplates, routine];
    set({ routineTemplates: updated });
    persistence.saveRoutineTemplates(updated);
  },
  updateRoutine: (routine) => {
    const updated = get().routineTemplates.map((r) => (r.id === routine.id ? routine : r));
    set({ routineTemplates: updated });
    persistence.saveRoutineTemplates(updated);
  },
  deleteRoutine: (id) => {
    const updated = get().routineTemplates.filter((r) => r.id !== id);
    const currentSelected = get().selectedRoutine;
    const nextSelected = currentSelected?.id === id ? updated[0] || null : currentSelected;
    set({ routineTemplates: updated, selectedRoutine: nextSelected });
    persistence.saveRoutineTemplates(updated);
    if (nextSelected) {
      persistence.saveSelectedRoutineId(nextSelected.id);
    } else {
      persistence.clearSelectedRoutineId();
    }
  },

  // Project CRUD
  addProject: (project) => {
    const updated = [...get().projects, project];
    set({ projects: updated });
    persistence.saveProjects(updated);
  },
  updateProject: (project) => {
    const updated = get().projects.map((p) => (p.id === project.id ? project : p));
    set({ projects: updated });
    persistence.saveProjects(updated);
  },
  deleteProject: (id) => {
    const updated = get().projects.filter((p) => p.id !== id);
    set({ projects: updated });
    persistence.saveProjects(updated);
  },
  completeProject: (id, note) => {
    const updated = get().projects.map((p) =>
      p.id === id
        ? { ...p, status: ProjectLifecycleStatus.Completed, isActive: false, completionNote: note, completionDate: new Date().toISOString() }
        : p
    );
    set({ projects: updated });
    persistence.saveProjects(updated);
  },
  archiveProject: (id, note) => {
    const updated = get().projects.map((p) =>
      p.id === id
        ? { ...p, status: ProjectLifecycleStatus.Archived, isActive: false, completionNote: note, completionDate: new Date().toISOString() }
        : p
    );
    set({ projects: updated });
    persistence.saveProjects(updated);
  },
  abandonProject: (id, note) => {
    const updated = get().projects.map((p) =>
      p.id === id
        ? { ...p, status: ProjectLifecycleStatus.Abandoned, isActive: false, completionNote: note, completionDate: new Date().toISOString() }
        : p
    );
    set({ projects: updated });
    persistence.saveProjects(updated);
  },
  reactivateProject: (id) => {
    const updated = get().projects.map((p) =>
      p.id === id
        ? { ...p, status: ProjectLifecycleStatus.Active, isActive: true, completionNote: null, completionDate: null }
        : p
    );
    set({ projects: updated });
    persistence.saveProjects(updated);
  },

  // TaskDef CRUD
  addTaskDefinition: (td) => {
    const updated = [...get().taskDefinitions, td];
    set({ taskDefinitions: updated });
    persistence.saveTaskDefinitions(updated);
  },
  updateTaskDefinition: (td) => {
    const updated = get().taskDefinitions.map((t) => (t.id === td.id ? td : t));
    set({ taskDefinitions: updated });
    persistence.saveTaskDefinitions(updated);
  },
  deleteTaskDefinition: (id) => {
    const updated = get().taskDefinitions.filter((t) => t.id !== id);
    set({ taskDefinitions: updated });
    persistence.saveTaskDefinitions(updated);
  },
  findOrCreateTaskDefinition: (title) => {
    const existing = get().taskDefinitions.find((t) => t.title === title);
    if (existing) return existing;
    const td = createTaskDefinition({ title });
    get().addTaskDefinition(td);
    return td;
  },

  // Ad-hoc CRUD
  addAdHocTask: (task) => {
    const updated = [...get().adHocTasks, task];
    set({ adHocTasks: updated });
    persistence.saveAdHocTasks(updated);
  },
  updateAdHocTask: (task) => {
    const updated = get().adHocTasks.map((t) => (t.id === task.id ? task : t));
    set({ adHocTasks: updated });
    persistence.saveAdHocTasks(updated);
  },
  deleteAdHocTask: (id) => {
    const updated = get().adHocTasks.filter((t) => t.id !== id);
    set({ adHocTasks: updated });
    persistence.saveAdHocTasks(updated);
  },
  planAdHocForDay: (adHocTask) => {
    const dateKey = format(startOfDay(get().date), 'yyyy-MM-dd');
    const logs = persistence.loadAdHocLogs();
    const existing = logs.find((l) => l.adHocTaskID === adHocTask.id && l.date === dateKey);
    if (existing) return;

    const log: AdHocLog = {
      id: uuidv4(),
      adHocTaskID: adHocTask.id,
      taskDefinitionID: adHocTask.taskID,
      date: dateKey,
      isCompleted: false,
      isSkipped: false,
      effortScore: effortScore(adHocTask.estimatedMinutes, adHocTask.difficulty),
      actualDifficulty: 0,
      actualDurationMinutes: 0,
    };
    logs.push(log);
    persistence.saveAdHocLogs(logs);

    set({ adHocPlans: loadAdHocPlans(get(), dateKey) });
  },
  moveAdHocPlanToBlock: (adHocTaskID, blockIndex) => {
    const dateKey = format(startOfDay(get().date), 'yyyy-MM-dd');
    const logs = persistence.loadAdHocLogs();
    const log = logs.find((l) => l.adHocTaskID === adHocTaskID && l.date === dateKey);
    if (!log) return;

    const adHocTask = get().adHocTasks.find((t) => t.id === adHocTaskID);
    const taskDef = log.taskDefinitionID
      ? get().taskDefinitions.find((td) => td.id === log.taskDefinitionID)
      : null;

    const blocks = [...get().resolvedBlocks];
    const block = { ...blocks[blockIndex] };
    block.actions = [
      ...block.actions,
      createActionItem({
        title: taskDef?.title || adHocTask?.taskID || 'Ad-hoc Task',
        durationMinutes: adHocTask?.estimatedMinutes ?? taskDef?.defaultDurationMinutes ?? null,
        difficulty: adHocTask?.difficulty ?? taskDef?.defaultDifficulty ?? TaskDifficulty.Low,
        defaultProjectIDs: taskDef?.defaultProjectIDs ?? [],
        taskID: taskDef?.id ?? null,
        adHocTaskID,
      }),
    ];
    blocks[blockIndex] = block;
    set({ resolvedBlocks: blocks });

    // Remove from today's ad-hoc panel; completion now happens via block task.
    persistence.saveAdHocLogs(logs.filter((l) => !(l.adHocTaskID === adHocTaskID && l.date === dateKey)));

    const dayLogs = persistence.loadDayLogs();
    saveDayLog(get(), blocks, dateKey, dayLogs);
    set({ adHocPlans: loadAdHocPlans(get(), dateKey) });
  },
  toggleAdHocCompletion: (adHocTaskID) => {
    const dateKey = format(startOfDay(get().date), 'yyyy-MM-dd');
    const logs = persistence.loadAdHocLogs();
    const log = logs.find((l) => l.adHocTaskID === adHocTaskID && l.date === dateKey);
    if (log) {
      log.isCompleted = !log.isCompleted;
      if (log.isCompleted) log.isSkipped = false;

      // If oneAndDone and completing, also complete the ad-hoc task
      const task = get().adHocTasks.find((t) => t.id === adHocTaskID);
      if (log.isCompleted && task?.recurrence === AdHocRecurrence.OneAndDone) {
        const updatedTasks = get().adHocTasks.map((t) =>
          t.id === adHocTaskID
            ? { ...t, status: AdHocStatus.Completed, completedDate: new Date().toISOString() }
            : t
        );
        set({ adHocTasks: updatedTasks });
        persistence.saveAdHocTasks(updatedTasks);
      }

      persistence.saveAdHocLogs(logs);
      set({ adHocPlans: loadAdHocPlans(get(), dateKey) });
    }
  },
  skipAdHocForDay: (adHocTaskID) => {
    const dateKey = format(startOfDay(get().date), 'yyyy-MM-dd');
    const logs = persistence.loadAdHocLogs();
    const log = logs.find((l) => l.adHocTaskID === adHocTaskID && l.date === dateKey);
    if (log) {
      log.isSkipped = true;
      log.isCompleted = false;
      persistence.saveAdHocLogs(logs);
      set({ adHocPlans: loadAdHocPlans(get(), dateKey) });
    }
  },
  removeAdHocPlan: (adHocTaskID) => {
    const dateKey = format(startOfDay(get().date), 'yyyy-MM-dd');
    const logs = persistence.loadAdHocLogs().filter(
      (l) => !(l.adHocTaskID === adHocTaskID && l.date === dateKey)
    );
    persistence.saveAdHocLogs(logs);
    set({ adHocPlans: loadAdHocPlans(get(), dateKey) });
  },

  // Settings
  setCity: (city) => {
    set({ city });
    persistence.saveCity(city);
  },
  setIqamahSchedule: (schedule) => {
    set({ iqamahSchedule: schedule });
    persistence.saveIqamahSchedule(schedule);
  },
  setNotificationMode: (mode) => {
    set({ notificationMode: mode });
    persistence.saveNotificationMode(mode);
  },
  setIncludeNap: (v) => {
    set({ includeNap: v });
    persistence.saveIncludeNap(v);
  },

  // Import/Export
  importBundle: (json, mode) => {
    try {
      const bundle = JSON.parse(json);
      if (mode === 'replace') {
        // Full replace
        if (bundle.blocks) {
          set({ blockTemplates: bundle.blocks });
          persistence.saveBlockTemplates(bundle.blocks);
        }
        if (bundle.routines) {
          set({ routineTemplates: bundle.routines });
          persistence.saveRoutineTemplates(bundle.routines);
        }
        if (bundle.projects) {
          set({ projects: bundle.projects });
          persistence.saveProjects(bundle.projects);
        }
        if (bundle.taskDefinitions) {
          set({ taskDefinitions: bundle.taskDefinitions });
          persistence.saveTaskDefinitions(bundle.taskDefinitions);
        }
        if (bundle.adHocTasks) {
          set({ adHocTasks: bundle.adHocTasks });
          persistence.saveAdHocTasks(bundle.adHocTasks);
        }
      } else {
        // Merge - add new items by name
        const state = get();
        if (bundle.blocks) {
          const existing = new Set(state.blockTemplates.map((b) => b.name));
          const newBlocks = bundle.blocks.filter((b: BlockTemplate) => !existing.has(b.name));
          const merged = [...state.blockTemplates, ...newBlocks];
          set({ blockTemplates: merged });
          persistence.saveBlockTemplates(merged);
        }
        if (bundle.routines) {
          const existing = new Set(state.routineTemplates.map((r) => r.name));
          const newRoutines = bundle.routines.filter((r: RoutineTemplate) => !existing.has(r.name));
          const merged = [...state.routineTemplates, ...newRoutines];
          set({ routineTemplates: merged });
          persistence.saveRoutineTemplates(merged);
        }
        if (bundle.projects) {
          const existing = new Set(state.projects.map((p) => p.name));
          const newProjects = bundle.projects.filter((p: Project) => !existing.has(p.name));
          const merged = [...state.projects, ...newProjects];
          set({ projects: merged });
          persistence.saveProjects(merged);
        }
      }
    } catch (e) {
      console.error('Import failed:', e);
    }
  },
  exportBundle: () => {
    const state = get();
    return JSON.stringify(
      {
        blocks: state.blockTemplates,
        routines: state.routineTemplates,
        projects: state.projects,
        taskDefinitions: state.taskDefinitions,
        adHocTasks: state.adHocTasks,
      },
      null,
      2
    );
  },

  // Helpers
  blocksForRoutine: (routine) => {
    const templates = get().blockTemplates;
    return routine.blockIDs
      .map((id) => templates.find((b) => b.id === id))
      .filter((b): b is BlockTemplate => !!b);
  },
  suggestedRoutine: () => {
    const routines = get().routineTemplates;
    const dow = new Date().getDay(); // 0=Sun
    const weekday = dow === 0 ? 1 : dow + 1; // 1=Sun..7=Sat
    const suggested = routines.find((r) => r.suggestedWeekdays.includes(weekday));
    return suggested || routines[0] || null;
  },
  activeProjects: () => {
    return get().projects.filter((p) => p.status === ProjectLifecycleStatus.Active);
  },
}));

// ─── Helpers ─────────────────────────────────────────────

function syncAdHocFromBlockAction(
  action: ResolvedBlock['actions'][number],
  get: () => AppState,
  set: (partial: Partial<AppState>) => void
) {
  if (!action.adHocTaskID) return;

  const dateKey = format(startOfDay(get().date), 'yyyy-MM-dd');
  const logs = persistence.loadAdHocLogs();
  let log = logs.find((l) => l.adHocTaskID === action.adHocTaskID && l.date === dateKey);

  if (!log) {
    log = {
      id: uuidv4(),
      adHocTaskID: action.adHocTaskID,
      taskDefinitionID: action.taskID,
      date: dateKey,
      isCompleted: false,
      isSkipped: false,
      effortScore: effortScore(action.durationMinutes, action.difficulty),
      actualDifficulty: action.difficulty,
      actualDurationMinutes: action.durationMinutes ?? 0,
    };
    logs.push(log);
  }

  log.isCompleted = action.isCompleted;
  log.isSkipped = false;
  log.taskDefinitionID = action.taskID;
  log.actualDifficulty = action.difficulty;
  log.actualDurationMinutes = action.durationMinutes ?? 0;
  log.effortScore = effortScore(action.durationMinutes, action.difficulty);
  persistence.saveAdHocLogs(logs);

  if (action.isCompleted) {
    const task = get().adHocTasks.find((t) => t.id === action.adHocTaskID);
    if (task?.recurrence === AdHocRecurrence.OneAndDone) {
      const updatedTasks = get().adHocTasks.map((t) =>
        t.id === action.adHocTaskID
          ? { ...t, status: AdHocStatus.Completed, completedDate: new Date().toISOString() }
          : t
      );
      set({ adHocTasks: updatedTasks });
      persistence.saveAdHocTasks(updatedTasks);
    }
  }
}

function saveDayLog(
  state: AppState,
  resolvedBlocks: ResolvedBlock[],
  dateKey: string,
  existingLogs: DayLog[]
) {
  let possibleScore = 0;
  let earnedScore = 0;

  const blockLogs = resolvedBlocks.map((rb, i) => {
    const actionLogs = rb.actions.map((a, j) => {
      const es = effortScore(a.durationMinutes, a.difficulty);
      possibleScore += es;
      if (a.isCompleted) earnedScore += es;
      return {
        id: a.id,
        title: a.title,
        isCompleted: a.isCompleted,
        durationMinutes: a.durationMinutes ?? 0,
        orderIndex: j,
        anchorPhase: a.anchorPhase,
        difficulty: a.difficulty,
        effortScore: es,
        projectIDs: a.defaultProjectIDs,
        actualDifficulty: a.difficulty,
        actualDurationMinutes: a.durationMinutes ?? 0,
        taskDefinitionID: a.taskID,
        adHocTaskID: a.adHocTaskID ?? null,
      };
    });

    return {
      id: rb.id,
      blockId: rb.template.id,
      name: rb.template.name,
      startTime: rb.startTime.toISOString(),
      endTime: rb.endTime.toISOString(),
      note: rb.note,
      orderIndex: i,
      projectIDs: [] as string[],
      actionLogs,
    };
  });

  // Compute training loads
  const { shortTermLoad, longTermLoad } = computeTrainingLoads(existingLogs, dateKey, earnedScore);

  const dayLog: DayLog = {
    id: existingLogs.find((d) => d.date === dateKey)?.id || uuidv4(),
    date: dateKey,
    routineId: state.selectedRoutine?.id ?? null,
    routineName: state.selectedRoutine?.name ?? null,
    city: state.city,
    earnedScore,
    possibleScore,
    shortTermLoad,
    longTermLoad,
    blockLogs,
  };

  const updated = existingLogs.filter((d) => d.date !== dateKey);
  updated.push(dayLog);
  persistence.saveDayLogs(updated);
}

function computeTrainingLoads(
  dayLogs: DayLog[],
  currentDateKey: string,
  currentEarned: number
): { shortTermLoad: number; longTermLoad: number } {
  const today = startOfDay(new Date());
  const last28 = [];
  for (let i = 0; i < 28; i++) {
    const d = format(subDays(today, i), 'yyyy-MM-dd');
    const log = dayLogs.find((l) => l.date === d);
    if (d === currentDateKey) {
      last28.push(currentEarned);
    } else if (log && log.possibleScore > 0) {
      last28.push(log.earnedScore);
    }
  }

  const last7 = last28.slice(0, 7);
  const shortTermLoad = last7.length > 0 ? last7.reduce((s, v) => s + v, 0) / last7.length : 0;
  const longTermLoad = last28.length > 0 ? last28.reduce((s, v) => s + v, 0) / last28.length : 0;

  return { shortTermLoad, longTermLoad };
}

function loadAdHocPlans(state: AppState, dateKey: string): AdHocPlan[] {
  const logs = persistence.loadAdHocLogs().filter((l) => l.date === dateKey);
  const allLogs = persistence.loadAdHocLogs();

  return logs.map((log) => {
    const task = state.adHocTasks.find((t) => t.id === log.adHocTaskID);
    const taskDef = task
      ? state.taskDefinitions.find((td) => td.id === task.taskID)
      : null;

    const skipCount = allLogs.filter(
      (l) => l.adHocTaskID === log.adHocTaskID && l.isSkipped
    ).length;

    const daysSinceCreated = task
      ? differenceInDays(new Date(), new Date(task.createdDate))
      : 0;

    let timeWindowLabel: string | null = null;
    if (task) {
      switch (task.timeWindow.type) {
        case 'at':
          timeWindowLabel = `At ${formatTimeOfDay(task.timeWindow.time)}`;
          break;
        case 'after':
          timeWindowLabel = `After ${formatTimeOfDay(task.timeWindow.time)}`;
          break;
        case 'between':
          timeWindowLabel = `${formatTimeOfDay(task.timeWindow.start)} – ${formatTimeOfDay(task.timeWindow.end)}`;
          break;
      }
    }

    return {
      id: log.id,
      adHocTaskID: log.adHocTaskID,
      taskDefID: log.taskDefinitionID,
      title: taskDef?.title ?? task?.taskID ?? 'Unknown',
      isCompleted: log.isCompleted,
      isSkipped: log.isSkipped,
      skipCount,
      daysSinceCreated,
      timeWindowLabel,
      effortScore: log.effortScore,
    };
  });
}

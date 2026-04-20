# Services

All business logic services, their responsibilities, and APIs.

---

## DataStore (Singleton)

The central data store — the single source of truth for all application state. Runs on the main thread. Publishes reactive properties that drive the UI.

### Published State

| Property | Type | Default | Persisted In |
|---|---|---|---|
| `blockTemplates` | `[BlockTemplate]` | `[]` | UserDefaults |
| `routineTemplates` | `[RoutineTemplate]` | `[]` | UserDefaults |
| `projects` | `[Project]` | `[]` | UserDefaults |
| `taskDefinitions` | `[TaskDefinition]` | `[]` | UserDefaults |
| `adHocTasks` | `[AdHocTask]` | `[]` | UserDefaults |
| `iqamahSchedule` | `IqamahSchedule` | `.default` | UserDefaults |
| `city` | `String` | `"Houston"` | UserDefaults |
| `notificationMode` | `NotificationMode` | `.standard` | UserDefaults |

### UserDefaults Keys

| Key | Data |
|---|---|
| `sigh_blockTemplates` | JSON-encoded `[BlockTemplate]` |
| `sigh_routineTemplates` | JSON-encoded `[RoutineTemplate]` |
| `sigh_projects` | JSON-encoded `[Project]` |
| `sigh_taskDefinitions` | JSON-encoded `[TaskDefinition]` |
| `sigh_adHocTasks` | JSON-encoded `[AdHocTask]` |
| `sigh_iqamahSchedule` | JSON-encoded `IqamahSchedule` |
| `sigh_city` | Raw string |
| `sigh_notificationMode` | Raw string of `NotificationMode` |
| `sigh_taskMigrationDone` | Bool flag |

### Initialization (First Launch)

1. Load all data from UserDefaults (JSON decode each key)
2. If `blockTemplates` is empty → seed with `PreloadedData.defaultBlocks`
3. If `routineTemplates` is empty → seed with `PreloadedData.defaultRoutines(blocks:)`
4. If `sigh_taskMigrationDone` is false → run `migrateTaskDefinitions()`

### Task Migration

On first run (or when flag is false), scans all block template actions:

1. For each unique action title across all blocks, create a `TaskDefinition` if one doesn't exist
2. Assign `taskID` on every `ActionItem` to point to the matching `TaskDefinition`
3. Save and set the migration flag

### Block CRUD

| Method | Signature | Behavior |
|---|---|---|
| `addBlock` | `(BlockTemplate) → void` | Append and save |
| `updateBlock` | `(BlockTemplate) → void` | Find by ID, replace, save |
| `deleteBlock` | `(id: UUID) → void` | Remove from templates AND from all routine blockIDs, save both |
| `block(for:)` | `(UUID) → BlockTemplate?` | Lookup by ID |

### Routine CRUD

| Method | Signature | Behavior |
|---|---|---|
| `addRoutine` | `(RoutineTemplate) → void` | Append and save |
| `updateRoutine` | `(RoutineTemplate) → void` | Find by ID, replace, save |
| `deleteRoutine` | `(id: UUID) → void` | Remove and save |
| `blocks(for:)` | `(RoutineTemplate) → [BlockTemplate]` | Map routine's blockIDs to templates, preserving order |
| `suggestedRoutine(for:)` | `(Date) → RoutineTemplate?` | Find first routine whose `suggestedWeekdays` contains the day's weekday. Fallback: first routine. |

### TaskDefinition CRUD

| Method | Signature | Behavior |
|---|---|---|
| `addTaskDefinition` | `(TaskDefinition) → void` | Append and save |
| `updateTaskDefinition` | `(TaskDefinition) → void` | Find by ID, replace, save |
| `deleteTaskDefinition` | `(id: UUID) → void` | Remove and save |
| `taskDefinition(for:)` | `(UUID) → TaskDefinition?` | Lookup by ID |
| `findOrCreateTaskDefinition` | `(title, duration?, difficulty, projectIDs) → TaskDefinition` | Return existing by title, or create new |
| `resolvedTitle(for:)` | `(ActionItem) → String` | If action has taskID → return TaskDefinition.title, else action.title |
| `blockCount(for:)` | `(taskDefID: UUID) → Int` | Count of action items across all blocks referencing this task def |

### Ad-Hoc Task CRUD

| Method | Behavior |
|---|---|
| `addAdHocTask(task)` | Append and save |
| `updateAdHocTask(task)` | Find by ID, replace, save |
| `deleteAdHocTask(id)` | Remove and save |
| `activeAdHocTasks` | Computed: filter status == .active |
| `abandonAdHocTask(id, reason?)` | Set status=abandoned, set abandonedDate, save |
| `reactivateAdHocTask(id)` | Set status=active, clear abandon fields, save |

### Ad-Hoc Day Planning (Core Data)

| Method | Behavior |
|---|---|
| `planAdHocForDay(adHocTask, date)` | Create a CDAdHocLog for the day if not already planned. Records effortScore. |
| `completeAdHocForDay(adHocTaskID, date, actualDifficulty?, actualDuration?)` | Mark log completed. If oneAndDone → complete the AdHocTask too. Add effort to day's earned score. Recalculate loads. |
| `skipAdHocForDay(adHocTaskID, date)` | Mark log as skipped |
| `toggleAdHocCompletion(adHocTaskID, date)` | Toggle completed/uncompleted. Adjusts day earned score accordingly. |
| `adHocLogsForDay(date)` | Fetch all CDAdHocLog for a given day |
| `skipCount(for adHocTaskID)` | Count all CDAdHocLog entries where isSkipped=true for this task |
| `removeAdHocPlan(adHocTaskID, date)` | Delete the CDAdHocLog entry |

### Project CRUD

| Method | Behavior |
|---|---|
| `addProject(project)` | Append and save |
| `updateProject(project)` | Find by ID, replace, save |
| `deleteProject(id)` | Remove and save |
| `activeProjects` | Computed: filter status == .active |
| `exertEligibleProjects` | Computed: active AND exertEligible |
| `taggableProjects` | Computed: active OR (not completed/archived/abandoned) |

### Project Lifecycle

| Method | Behavior |
|---|---|
| `completeProject(id, note)` | Set status=completed, isActive=false, set note and date |
| `archiveProject(id, note)` | Set status=archived, isActive=false, set note and date |
| `abandonProject(id, note)` | Set status=abandoned, isActive=false, set note and date |
| `reactivateProject(id)` | Set status=active, isActive=true, clear note and date |

### Project Tagging (Action-Level)

| Method | Behavior |
|---|---|
| `tagActionWithProjects(date, actionId, projectIDs, percentages)` | Set projectIDs on CDActionLog. Create CDProjectLog entries (minutesSpent = action duration / project count). Remove old project logs for this action first. |
| `projectIDsForAction(actionId)` | Read projectIDs from CDActionLog |
| `projectPercentagesForAction(actionId)` | Read percentage values from CDProjectLog entries |

### Project Tagging (Day-Level)

| Method | Behavior |
|---|---|
| `tagDayWithProjects(date, projectIDs, percentages)` | Create CDDayProjectTag entries. Remove old day tags first. |
| `dayProjectIDs(for date)` | Fetch project IDs from CDDayProjectTag |
| `dayProjectPercentages(for date)` | Fetch percentages from CDDayProjectTag |

### Project Tagging (Block-Level, Legacy)

| Method | Behavior |
|---|---|
| `tagBlockWithProjects(date, blockId, projectIDs)` | Set projectIDs on CDBlockLog. Create CDProjectLog entries. |
| `projectIDsForBlock(date, blockId)` | Read from CDBlockLog |

### Project Query Helpers

| Method | Behavior |
|---|---|
| `lastWorkedDate(for projectId)` | Check both CDProjectLog and CDDayProjectTag. Return the most recent date. |
| `minutesSpent(on projectId, lastDays)` | Sum minutesSpent from CDProjectLog in the date range |
| `projectLogs(from, to)` | Fetch all CDProjectLog entries in range |

### Core Data Day Logs

| Method | Behavior |
|---|---|
| `dayLog(for date)` | Fetch or create CDDayLog for the date |
| `saveDayLog(date, routineName, city, resolvedBlocks)` | Upsert CDDayLog. Delete old block logs. Create new CDBlockLog and CDActionLog entries. Compute possibleScore and earnedScore. Recalculate training loads. |
| `updateActionCompletion(actionId, isCompleted)` | Update CDActionLog.isCompleted. Recalculate day's earnedScore by summing all completed action effort scores. Recalculate loads. |
| `updateBlockNote(date, blockId, note)` | Update CDBlockLog.note |
| `loadSavedActions(for date)` | Return `[UUID: Bool]` mapping action IDs to completion states |
| `loadSavedNotes(for date)` | Return `[UUID: String]` mapping block IDs to notes |
| `updateActionOverrides(actionId, actualDifficulty?, actualDuration?)` | Set actual values on CDActionLog |

### Training Load Computation

| Method | Behavior |
|---|---|
| `recalculateLoads(for date)` | Fetch last 28 days of CDDayLog. Compute short-term load (avg of last 7 days with data) and long-term load (avg of all 28 days with data). Save to CDDayLog. |

---

## PrayerTimesService (Singleton)

Fetches prayer times from the Aladhan API. In-memory cache keyed by `"city-date"`.

| Method | Signature | Behavior |
|---|---|---|
| `fetchPrayerTimes` | `(city, country?, date) async throws → AladhanTimings` | Check cache first. Build API URL. GET request. Decode JSON. Cache and return. |

See [07-api-integrations.md](07-api-integrations.md) for API details.

---

## BlockResolver

Stateless utility that converts block templates + prayer data into concrete resolved blocks. See [06-algorithms.md](06-algorithms.md) for the full algorithm.

| Method | Signature |
|---|---|
| `resolve` | `(blocks, timings, iqamah, date, includeNap) → [ResolvedBlock]` |

---

## ProjectEngine

Stateless utility that computes project neglect scores and suggestions. See [06-algorithms.md](06-algorithms.md) for algorithms.

| Method | Returns |
|---|---|
| `computeNeglectRadar()` | `[ProjectStatus]` sorted by neglect score descending |
| `suggestProjects(limit)` | `[Suggestion]` sorted by urgency descending |

---

## StatsEngine

Stateless utility for streaks, training load, and analytics. See [06-algorithms.md](06-algorithms.md) for algorithms.

| Method | Returns |
|---|---|
| `computeSummary()` | `Summary` with streaks, load, trend, recent days |
| `taskDetails(for date)` | `[TaskDetail]` per-task data for a day |
| `taskStreak(taskDefinitionID, title)` | `TaskStreakInfo` streak info for one task |
| `topTaskStreaks(store, limit)` | `[TaskStreakInfo]` top tasks by streak |
| `adHocAnalytics(store)` | `AdHocAnalytics` skip rate and procrastination list |

---

## NotificationManager (Singleton)

See [08-notifications.md](08-notifications.md).

---

## CSVExporter

See [09-import-export.md](09-import-export.md).

---

## ImportExportService

See [09-import-export.md](09-import-export.md).

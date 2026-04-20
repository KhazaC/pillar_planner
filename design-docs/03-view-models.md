# View Models

---

## DayViewModel

The primary view model driving the main day view. Runs on the main thread. Observes the DataStore.

### State

| Property | Type | Default | Description |
|---|---|---|---|
| `selectedRoutine` | `RoutineTemplate?` | auto-suggested | Currently selected routine |
| `resolvedBlocks` | `[ResolvedBlock]` | `[]` | Blocks with concrete times for today |
| `isLoading` | `Bool` | `false` | Loading indicator |
| `errorMessage` | `String?` | `nil` | Error from API or resolution |
| `includeNap` | `Bool` | seasonal | Whether to include Qaylulah (nap) block |
| `adHocPlans` | `[AdHocPlan]` | `[]` | Ad-hoc tasks planned for today |

### Initialization

1. Set `store` reference (default: `DataStore.shared`)
2. Set `date` (default: today)
3. Auto-suggest routine: `store.suggestedRoutine(for: date)`
4. Auto-set `includeNap`: `true` if month is April–August (months 4–8), otherwise `false`

### AdHocPlan (nested struct)

Resolved ad-hoc plan for display.

| Field | Type | Description |
|---|---|---|
| `id` | `UUID` | CDAdHocLog ID |
| `adHocTaskID` | `UUID` | Reference to AdHocTask |
| `taskDefID` | `UUID?` | Reference to TaskDefinition |
| `title` | `String` | Resolved title from TaskDefinition |
| `isCompleted` | `Bool` | Completion state |
| `isSkipped` | `Bool` | Skip state |
| `skipCount` | `Int` | Total skips for this ad-hoc task |
| `daysSinceCreated` | `Int` | Days since the ad-hoc task was created |
| `timeWindowLabel` | `String?` | Human-readable time window |
| `effortScore` | `Double` | Effort score |

### loadDay() — async

The main data loading method. Called on initial load and on refresh.

1. Guard `selectedRoutine` is not nil
2. Set `isLoading = true`, clear error
3. **Fetch prayer times** from `PrayerTimesService` for `store.city` on `date`
4. **Get blocks** for the routine from DataStore
5. **Resolve blocks** via `BlockResolver.resolve(blocks, timings, iqamah, date, includeNap)`
6. **Restore saved state** from Core Data:
   - Load saved action completion states (`store.loadSavedActions`)
   - Load saved block notes (`store.loadSavedNotes`)
   - Apply to resolved blocks
7. Set `resolvedBlocks`
8. **Persist to Core Data**: `store.saveDayLog(date, routineName, city, resolvedBlocks)`
9. **Schedule notifications**: Request permission, then `NotificationManager.scheduleNotifications(for: resolved, mode: store.notificationMode)`
10. **Load ad-hoc plans**: `loadAdHocPlans()`
11. On error: set `errorMessage`
12. Set `isLoading = false`

### toggleAction(blockIndex, actionIndex)

Toggle action completion state at the given indices. Calls `store.updateActionCompletion`.

### updateNote(blockIndex, note)

Update block reflection note. **Debounced** — waits 500ms of inactivity before saving to Core Data via `store.updateBlockNote`.

### loadAdHocPlans()

Loads `CDAdHocLog` entries for the day and maps them to `AdHocPlan` structs. Resolves titles from TaskDefinitions. Computes skip counts and days since created. Formats time window labels:

| TimeWindow | Label |
|---|---|
| `.anytime` | nil |
| `.at(t)` | `"At {formatted}"` |
| `.after(t)` | `"After {formatted}"` |
| `.between(s, e)` | `"{s.formatted} – {e.formatted}"` |

### adHocSkipRate → Double

Computed: `skippedCount / totalPlans` (0 if no plans)

### toggleAdHoc(plan)

Call `store.toggleAdHocCompletion`, then reload plans.

### skipAdHoc(plan)

Call `store.skipAdHocForDay`, then reload plans.

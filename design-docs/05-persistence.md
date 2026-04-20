# Persistence

Dual-storage approach: UserDefaults for user-editable templates, Core Data for daily logs and analytics.

---

## UserDefaults Storage

All templates and configuration are stored as JSON-encoded data in UserDefaults.

| Key | Type | Content |
|---|---|---|
| `sigh_blockTemplates` | `Data` | JSON array of `BlockTemplate` |
| `sigh_routineTemplates` | `Data` | JSON array of `RoutineTemplate` |
| `sigh_projects` | `Data` | JSON array of `Project` |
| `sigh_taskDefinitions` | `Data` | JSON array of `TaskDefinition` |
| `sigh_adHocTasks` | `Data` | JSON array of `AdHocTask` |
| `sigh_iqamahSchedule` | `Data` | JSON `IqamahSchedule` |
| `sigh_city` | `String` | City name for prayer times API |
| `sigh_notificationMode` | `String` | Raw value of `NotificationMode` |
| `sigh_taskMigrationDone` | `Bool` | Whether task definition migration has run |

### Serialization Notes

All model types implement `Codable`. The `BlockAnchor` enum (tagged union with associated data) must be serialized with a discriminator. Example JSON:

```json
{
  "prayerTime": {
    "prayer": "Fajr",
    "offsetMinutes": -5
  }
}
```

Similarly, `IqamahTimeConfig` and `AdHocTimeWindow` are tagged unions requiring discriminated serialization.

---

## Core Data Schema

The Core Data model is built programmatically (no .xcdatamodeld file). The database is named `"Sigh"`.

### Configuration

- Lightweight migration enabled (auto-migrate + infer mapping model)
- `automaticallyMergesChangesFromParent = true`
- Merge policy: `NSMergeByPropertyObjectTrumpMergePolicy`

### Entities

#### CDDayLog

One record per day. Root of the log hierarchy.

| Attribute | Type | Optional | Default | Description |
|---|---|---|---|---|
| `id` | UUID | no | — | Primary key |
| `date` | Date | no | — | Start of day (midnight) |
| `routineId` | UUID | yes | — | Which routine was used |
| `routineName` | String | yes | — | Routine name snapshot |
| `city` | String | yes | — | City used for prayer times |
| `earnedScore` | Double | yes | 0.0 | Sum of completed action effort scores |
| `possibleScore` | Double | yes | 0.0 | Sum of all action effort scores |
| `shortTermLoad` | Double | yes | 0.0 | 7-day average earned score |
| `longTermLoad` | Double | yes | 0.0 | 28-day average earned score |

**Relationships:**
- `blockLogs` → CDBlockLog (one-to-many, cascade delete)

**Computed:**
- `blockLogsArray`: Sorted by `orderIndex` ascending

#### CDBlockLog

One record per block instance in a day.

| Attribute | Type | Optional | Default | Description |
|---|---|---|---|---|
| `id` | UUID | no | — | Primary key |
| `blockId` | UUID | no | — | References BlockTemplate.id |
| `name` | String | yes | — | Block name snapshot |
| `startTime` | Date | yes | — | Resolved start time |
| `endTime` | Date | yes | — | Resolved end time |
| `note` | String | yes | — | User reflection note |
| `orderIndex` | Int16 | no | — | Position in routine |
| `projectIDsData` | Binary | yes | — | JSON-encoded `[UUID]` |

**Relationships:**
- `dayLog` → CDDayLog (many-to-one, nullify)
- `actionLogs` → CDActionLog (one-to-many, cascade delete)

**Computed:**
- `actionLogsArray`: Sorted by `orderIndex` ascending
- `projectIDs`: Decoded/encoded via `projectIDsData`

#### CDActionLog

One record per action instance in a block.

| Attribute | Type | Optional | Default | Description |
|---|---|---|---|---|
| `id` | UUID | no | — | Primary key (matches ActionItem.id) |
| `title` | String | yes | — | Action title |
| `isCompleted` | Bool | no | false | Completion state |
| `durationMinutes` | Int16 | yes | — | Planned duration |
| `orderIndex` | Int16 | no | — | Position in block |
| `anchorPhase` | String | yes | — | Raw value of AnchorPhase |
| `difficulty` | Int16 | yes | 2 | Raw value of TaskDifficulty |
| `effortScore` | Double | yes | 0.0 | Computed effort score |
| `projectIDsData` | Binary | yes | — | JSON-encoded `[UUID]` |
| `actualDifficulty` | Int16 | yes | 0 | User override (0 = no override) |
| `actualDurationMinutes` | Int16 | yes | 0 | User override (0 = no override) |
| `taskDefinitionID` | UUID | yes | — | References TaskDefinition.id |

**Relationships:**
- `blockLog` → CDBlockLog (many-to-one, nullify)

**Computed:**
- `projectIDs`: Decoded/encoded via `projectIDsData`

#### CDProjectLog

Records project work sessions. Links to either an action or a block.

| Attribute | Type | Optional | Default | Description |
|---|---|---|---|---|
| `id` | UUID | no | — | Primary key |
| `projectId` | UUID | no | — | References Project.id |
| `date` | Date | no | — | Day of the log |
| `minutesSpent` | Int16 | yes | 0 | Minutes attributed to this project |
| `blockLogId` | UUID | yes | — | References CDBlockLog.id (legacy) |
| `actionLogId` | UUID | yes | — | References CDActionLog.id |
| `percentage` | Double | yes | -1.0 | Quality/completion percentage (-1 = not tracked) |

#### CDAdHocLog

Per-day instance of an ad-hoc task.

| Attribute | Type | Optional | Default | Description |
|---|---|---|---|---|
| `id` | UUID | no | — | Primary key |
| `adHocTaskID` | UUID | no | — | References AdHocTask.id |
| `taskDefinitionID` | UUID | yes | — | References TaskDefinition.id |
| `date` | Date | no | — | Day this was planned for |
| `isCompleted` | Bool | no | false | Whether completed |
| `isSkipped` | Bool | no | false | Whether skipped |
| `effortScore` | Double | yes | 0.0 | Effort score |
| `actualDifficulty` | Int16 | yes | 0 | Override difficulty |
| `actualDurationMinutes` | Int16 | yes | 0 | Override duration |

#### CDDayProjectTag

Day-level project tags not tied to any specific task.

| Attribute | Type | Optional | Default | Description |
|---|---|---|---|---|
| `id` | UUID | no | — | Primary key |
| `projectId` | UUID | no | — | References Project.id |
| `date` | Date | no | — | Day |
| `percentage` | Double | yes | -1.0 | Quality percentage (-1 = not tracked) |

### Entity Relationship Diagram

```
CDDayLog
  │
  ├──< blockLogs (one-to-many, cascade)
  │     CDBlockLog
  │       │
  │       ├──< actionLogs (one-to-many, cascade)
  │       │     CDActionLog
  │       │
  │       └── dayLog (many-to-one, nullify)
  │
  └── (no direct relationship to:)
        CDProjectLog (standalone, linked by actionLogId/blockLogId)
        CDAdHocLog (standalone)
        CDDayProjectTag (standalone)
```

### Querying Patterns

1. **Fetch day log**: Predicate `date >= startOfDay AND date < nextDay`, fetchLimit 1
2. **Fetch ad-hoc logs for day**: Predicate `date == startOfDay`
3. **Fetch project logs in range**: Predicate `date >= start AND date <= end`, sorted by date desc
4. **Fetch action by ID**: Predicate `id == actionId`, fetchLimit 1
5. **Count skips**: Predicate `adHocTaskID == X AND isSkipped == YES`
6. **Last worked date**: Two queries (CDProjectLog + CDDayProjectTag), take max date

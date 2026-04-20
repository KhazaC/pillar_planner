# Import / Export

---

## JSON Bundle Format (SighBundle)

The portable interchange format. Human-readable JSON with no internal UUIDs — entities are linked by **name** instead. This allows the same bundle to be imported on any platform.

### Top-Level Structure

```json
{
  "blocks": [...],
  "routines": [...],
  "projects": [...],
  "taskDefinitions": [...],
  "adHocTasks": [...]
}
```

`taskDefinitions` and `adHocTasks` are optional for backward compatibility.

### PortableBlock

```json
{
  "name": "Fajr",
  "anchorType": "iqamahTime",
  "anchorPrayer": "Fajr",
  "anchorOffsetMinutes": 0,
  "anchorHour": null,
  "anchorMinute": null,
  "actions": [...],
  "overallDurationMinutes": 110,
  "earlyNotificationMinutes": 5,
  "colorTag": "indigo"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | String | yes | Block name |
| `anchorType` | String | yes | One of: `"prayerTime"`, `"iqamahTime"`, `"fixedTime"`, `"filler"` |
| `anchorPrayer` | String | for prayer/iqamah | Prayer name: `"Fajr"`, `"Sunrise"`, `"Dhuhr"`, `"Asr"`, `"Maghrib"`, `"Isha"`, `"Jumu'ah"` |
| `anchorOffsetMinutes` | Int | no | Offset in minutes from prayer/iqamah. Ignored for filler. |
| `anchorHour` | Int | for fixedTime | 0–23 |
| `anchorMinute` | Int | for fixedTime | 0–59. Both 0 = auto-chain. |
| `actions` | [PortableAction] | yes | Ordered list |
| `overallDurationMinutes` | Int | no | Duration override |
| `earlyNotificationMinutes` | Int | no | Early warning (default 0) |
| `colorTag` | String | no | Color name (default `"blue"`) |

### PortableAction

```json
{
  "title": "Pray Fajr",
  "durationMinutes": 10,
  "anchorPhase": "anchor",
  "difficulty": 2,
  "defaultProjectNames": ["Salah"]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | String | yes | Action title |
| `durationMinutes` | Int | no | Duration in minutes |
| `anchorPhase` | String | no | `"pre"`, `"anchor"`, `"post"`, `"none"` (default `"none"`) |
| `difficulty` | Int | no | 1–5 (default 2) |
| `defaultProjectNames` | [String] | no | Project names to auto-tag |

### PortableRoutine

```json
{
  "name": "WFH",
  "description": "Work from home — prayers at masjid",
  "blockNames": ["Pre-Fajr", "Fajr", "Post-Fajr (WFH)", "Exert", "Dhuhr (Home)", ...],
  "suggestedWeekdays": [3, 5]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | String | yes | Routine name |
| `description` | String | no | Description |
| `blockNames` | [String] | yes | Ordered block names (matched to blocks by name) |
| `suggestedWeekdays` | [Int] | no | 1=Sun, 2=Mon, ..., 7=Sat |

### PortableProject

```json
{
  "name": "Arabic",
  "category": "Learning",
  "priority": 3,
  "cadence": "Weekly",
  "isActive": true,
  "tracksCompletion": false,
  "exertEligible": true,
  "status": "Active"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | String | yes | Project name |
| `category` | String | no | Category label |
| `priority` | Int | no | 1–4 (default 2) |
| `cadence` | String | no | `"Daily"`, `"Every Other Day"`, `"Weekly"`, `"Biweekly"`, `"Monthly"` (default `"Weekly"`) |
| `isActive` | Bool | no | Default true |
| `tracksCompletion` | Bool | no | Default false |
| `exertEligible` | Bool | no | Default true |
| `status` | String | no | `"Active"`, `"Completed"`, `"Archived"`, `"Abandoned"` (default `"Active"`) |

### PortableTaskDefinition

```json
{
  "title": "Pray Dhuhr",
  "defaultDurationMinutes": 10,
  "defaultDifficulty": 2,
  "defaultProjectNames": ["Salah"]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | String | yes | Task title |
| `defaultDurationMinutes` | Int | no | Default duration |
| `defaultDifficulty` | Int | no | 1–5 (default 2) |
| `defaultProjectNames` | [String] | no | Default project names |

### PortableAdHocTask

```json
{
  "taskTitle": "Buy groceries",
  "recurrence": "One & Done",
  "status": "Active",
  "difficulty": 2,
  "estimatedMinutes": 30,
  "timeWindow": "after 14:00",
  "timeNote": "After work"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `taskTitle` | String | yes | Must match a TaskDefinition title |
| `recurrence` | String | no | `"One & Done"`, `"Re-plannable"` (default `"Re-plannable"`) |
| `status` | String | no | `"Active"`, `"Completed"`, `"Abandoned"` (default `"Active"`) |
| `difficulty` | Int | no | 1–5 (default 2) |
| `estimatedMinutes` | Int | no | Estimated duration |
| `timeWindow` | String | no | `"anytime"`, `"at HH:MM"`, `"after HH:MM"`, `"between HH:MM-HH:MM"` |
| `timeNote` | String | no | Free-text note |

---

## Import Modes

### Replace Mode

1. Parse projects first (blocks may reference project names)
2. Parse blocks (resolve `defaultProjectNames` → project IDs)
3. Parse routines (resolve `blockNames` → block IDs)
4. Parse task definitions (resolve `defaultProjectNames` → project IDs)
5. Parse ad-hoc tasks (resolve `taskTitle` → TaskDefinition ID)
6. **Overwrite** all DataStore arrays
7. Save all to UserDefaults

### Merge Mode

1. Parse projects first; skip any whose name already exists
2. Parse task definitions; skip any whose title already exists
3. Parse blocks; skip any whose name already exists
4. Parse routines; skip any whose name already exists, resolve blockNames against all blocks (existing + new)
5. Parse ad-hoc tasks; add all (no deduplication by name)
6. Append new items to DataStore arrays
7. Save all to UserDefaults

---

## CSV Export

Exports all Core Data day logs to CSV. One row per action (denormalized).

### Columns

```
date,routine,city,block_name,block_order,block_start,block_end,block_note,action_title,action_order,action_duration_min,action_phase,action_difficulty,action_effort_score,action_completed
```

| Column | Format | Description |
|---|---|---|
| `date` | ISO 8601 date | Day date |
| `routine` | String | Routine name |
| `city` | String | City |
| `block_name` | String | Block name |
| `block_order` | Int | Position in routine |
| `block_start` | ISO 8601 datetime | Block start time |
| `block_end` | ISO 8601 datetime | Block end time |
| `block_note` | String | Reflection note |
| `action_title` | String | Action title |
| `action_order` | Int | Position in block |
| `action_duration_min` | Int | Duration in minutes |
| `action_phase` | String | Anchor phase |
| `action_difficulty` | Int | Difficulty level (1–5) |
| `action_effort_score` | Float (1 decimal) | Effort score |
| `action_completed` | `"true"` / `"false"` | Completion state |

### CSV Escaping

Fields containing commas, double quotes, or newlines are wrapped in double quotes. Internal double quotes are doubled (`""`).

### Data Source

Fetches all `CDDayLog` sorted by date ascending. Iterates through blockLogsArray and actionLogsArray for each day.

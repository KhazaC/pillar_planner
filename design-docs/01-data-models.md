# Data Models

Every entity, enum, and struct used in the application. All types must be serializable (JSON-encodable). UUIDs are used as primary identifiers everywhere.

---

## Enums

### NotificationMode

Controls how block-start notifications behave.

| Value | Raw String | Behavior |
|---|---|---|
| `standard` | `"Standard"` | Normal notification sound |
| `alarm` | `"Alarm"` | Time-sensitive / critical alert that breaks through DND, custom alarm sound |
| `silent` | `"Silent"` | No notifications scheduled |

### PrayerTime

The six daily prayer times plus Jumu'ah.

| Value | Raw String | Notes |
|---|---|---|
| `fajr` | `"Fajr"` | Pre-dawn prayer |
| `sunrise` | `"Sunrise"` | Not a prayer, but a time marker |
| `dhuhr` | `"Dhuhr"` | Midday prayer |
| `asr` | `"Asr"` | Afternoon prayer |
| `maghrib` | `"Maghrib"` | Sunset prayer |
| `isha` | `"Isha"` | Night prayer |
| `jumuah` | `"Jumu'ah"` | Friday congregational prayer |

**Computed property:**
- `apiPrayer`: Returns the API prayer this maps to. `jumuah` maps to `dhuhr`; all others map to themselves.

### BlockAnchor

Determines how a block calculates its start time. This is a **tagged union / discriminated union** with associated data.

| Variant | Associated Data | Description |
|---|---|---|
| `prayerTime` | `prayer: PrayerTime, offsetMinutes: Int` | Starts at API prayer time + offset (negative = before) |
| `iqamahTime` | `prayer: PrayerTime, offsetMinutes: Int` | Starts at iqamah time + offset, adjusted backwards by pre-anchor action duration |
| `fixedTime` | `hour: Int, minute: Int` | Starts at a fixed clock time. Special case: `hour=0, minute=0` means "auto-chain after previous block" |
| `filler` | _(none)_ | Expands to fill available space between surrounding anchored blocks |

**Display methods:**
- `shortLabel`: Compact text like `"@ Fajr -5m"`, `"Iqamah Dhuhr"`, `"→ chain"`, `"filler"`
- `detailedLabel`: Verbose text like `"Prayer: Fajr -5m"`, `"Iqamah: Dhuhr"`, `"Auto-chain"`, `"Filler"`

### AnchorPhase

Classifies actions within an iqamah-anchored block.

| Value | Raw String | Meaning |
|---|---|---|
| `preAnchor` | `"pre"` | Before the anchor moment (e.g., walk to masjid) |
| `anchor` | `"anchor"` | The anchor action itself (e.g., the prayer) |
| `postAnchor` | `"post"` | After the anchor action (e.g., adhkar) |
| `none` | `"none"` | Not in an iqamah-anchored block; normal sequential action |

### TaskDifficulty

5-level difficulty scale affecting effort scoring.

| Value | Raw Int | Label | Multiplier |
|---|---|---|---|
| `veryLow` | 1 | `"Very Low"` | 0.5 |
| `low` | 2 | `"Low"` | 1.0 |
| `medium` | 3 | `"Medium"` | 1.5 |
| `high` | 4 | `"High"` | 2.0 |
| `veryHigh` | 5 | `"Very High"` | 3.0 |

**Effort score formula:** `effortScore = max(durationMinutes ?? 5, 1) × multiplier`

### ProjectCadence

How often a project needs attention.

| Value | Raw String | Target Interval (days) |
|---|---|---|
| `daily` | `"Daily"` | 1 |
| `everyOtherDay` | `"Every Other Day"` | 2 |
| `weekly` | `"Weekly"` | 7 |
| `biweekly` | `"Biweekly"` | 14 |
| `monthly` | `"Monthly"` | 30 |

### ProjectPriority

| Value | Raw Int | Label | Sort Weight |
|---|---|---|---|
| `low` | 1 | `"Low"` | 1.0 |
| `medium` | 2 | `"Medium"` | 2.0 |
| `high` | 3 | `"High"` | 3.5 |
| `critical` | 4 | `"Critical"` | 5.0 |

### ProjectLifecycleStatus

| Value | Raw String |
|---|---|
| `active` | `"Active"` |
| `completed` | `"Completed"` |
| `archived` | `"Archived"` |
| `abandoned` | `"Abandoned"` |

### AdHocRecurrence

| Value | Raw String | Behavior |
|---|---|---|
| `oneAndDone` | `"One & Done"` | Auto-completes the ad-hoc task when marked done for the day |
| `rePlannable` | `"Re-plannable"` | Can be planned again on future days |

### AdHocStatus

| Value | Raw String |
|---|---|
| `active` | `"Active"` |
| `completed` | `"Completed"` |
| `abandoned` | `"Abandoned"` |

### AdHocTimeWindow

Tagged union describing when an ad-hoc task should be done.

| Variant | Associated Data | Description |
|---|---|---|
| `anytime` | _(none)_ | No time constraint |
| `at` | `TimeOfDay` | At a specific time |
| `after` | `TimeOfDay` | After a specific time |
| `between` | `start: TimeOfDay, end: TimeOfDay` | Within a time range |

### IqamahTimeConfig

Tagged union for how an iqamah time is defined.

| Variant | Associated Data | Description |
|---|---|---|
| `fixed` | `TimeOfDay` | A specific clock time the user enters |
| `relative` | `offsetMinutes: Int` | Minutes after the adhan (API prayer time) |

---

## Structs

### TimeOfDay

A simple time-of-day value (no date component).

| Field | Type | Description |
|---|---|---|
| `hour` | `Int` | 0–23 |
| `minute` | `Int` | 0–59 |

**Methods:**
- `formatted` → `String`: Returns `"h:mm AM/PM"` format (e.g., `"6:30 AM"`)
- `toDate(on: Date)` → `Date`: Creates a full date by setting hour/minute on the given day

### ActionItem

A single to-do within a block.

| Field | Type | Default | Description |
|---|---|---|---|
| `id` | `UUID` | auto | Unique identifier |
| `title` | `String` | required | Display name |
| `durationMinutes` | `Int?` | `nil` | Estimated duration; nil = unspecified |
| `isCompleted` | `Bool` | `false` | Completion state |
| `anchorPhase` | `AnchorPhase` | `.none` | Phase within iqamah-anchored blocks |
| `difficulty` | `TaskDifficulty` | `.low` | Difficulty rating |
| `defaultProjectIDs` | `[UUID]` | `[]` | Default project tags from template |
| `taskID` | `UUID?` | `nil` | References a TaskDefinition for unified stats |

**Computed:**
- `effortScore` → `Double`: `difficulty.effortScore(durationMinutes: durationMinutes)`

### BlockTemplate

A reusable block definition.

| Field | Type | Default | Description |
|---|---|---|---|
| `id` | `UUID` | auto | Unique identifier |
| `name` | `String` | required | Display name (e.g., "Fajr", "Exert") |
| `anchor` | `BlockAnchor` | required | How start time is determined |
| `actions` | `[ActionItem]` | `[]` | Ordered list of actions |
| `overallDurationMinutes` | `Int?` | `nil` | Duration override; nil = sum of action durations |
| `earlyNotificationMinutes` | `Int` | `0` | Minutes before start to send early notification (0 = off) |
| `colorTag` | `String` | `"blue"` | Color for UI display |

**Computed:**
- `durationMinutes` → `Int`: If filler → 0. If overallDurationMinutes set → that value. Otherwise → sum of action durations (min 1).
- `preAnchorMinutes` → `Int`: Sum of durations of actions with `anchorPhase == .preAnchor`

**Valid color tags:** `"indigo"`, `"orange"`, `"yellow"`, `"pink"`, `"purple"`, `"blue"`, `"red"`, `"teal"`, `"gray"`, `"green"`

### RoutineTemplate

A named sequence of block templates mapped to weekdays.

| Field | Type | Default | Description |
|---|---|---|---|
| `id` | `UUID` | auto | Unique identifier |
| `name` | `String` | required | Display name (e.g., "WFH", "In-Office") |
| `description` | `String` | `""` | User-visible description |
| `blockIDs` | `[UUID]` | `[]` | Ordered list of BlockTemplate IDs |
| `suggestedWeekdays` | `[Int]` | `[]` | Weekdays this routine auto-suggests. `1=Sun, 2=Mon, ... 7=Sat` |

### IqamahSchedule

User-managed iqamah times for their local masjid.

| Field | Type | Default |
|---|---|---|
| `fajr` | `IqamahTimeConfig` | `.fixed(TimeOfDay(hour: 6, minute: 30))` |
| `dhuhr` | `IqamahTimeConfig` | `.fixed(TimeOfDay(hour: 13, minute: 45))` |
| `asr` | `IqamahTimeConfig` | `.fixed(TimeOfDay(hour: 17, minute: 15))` |
| `maghrib` | `IqamahTimeConfig` | `.relative(offsetMinutes: 15)` |
| `isha` | `IqamahTimeConfig` | `.fixed(TimeOfDay(hour: 20, minute: 45))` |
| `jumuah` | `IqamahTimeConfig` | `.fixed(TimeOfDay(hour: 13, minute: 15))` |

**Methods:**
- `config(for: PrayerTime)` → `IqamahTimeConfig?`: Returns the config for a prayer. `sunrise` returns nil.
- `resolvedDate(for: PrayerTime, timings: AladhanTimings, on: Date)` → `Date?`: Resolves the iqamah time to a concrete `Date`. For `fixed`: uses `TimeOfDay.toDate(on:)`. For `relative`: uses `API adhan time + offsetMinutes`.

### ResolvedBlock

A block with concrete start/end times for display on a specific day. **Not persisted as a template** — computed daily.

| Field | Type | Description |
|---|---|---|
| `id` | `UUID` | Unique per resolution (new UUID each time) |
| `template` | `BlockTemplate` | The source template |
| `startTime` | `Date` | Concrete start |
| `endTime` | `Date` | Concrete end |
| `actions` | `[ActionItem]` | Mutable copy of template actions (completion tracked here) |
| `note` | `String` | User reflection note for this block instance |

**Computed:**
- `isActive` → `Bool`: `now >= startTime && now < endTime`
- `isPast` → `Bool`: `now >= endTime`
- `formattedStartTime` → `String`: `"h:mm a"` format
- `formattedEndTime` → `String`: `"h:mm a"` format
- `formattedDuration` → `String`: `"Xh Ym"` or `"Xm"` format

### Project

A user-defined project for time tracking and neglect analysis.

| Field | Type | Default | Description |
|---|---|---|---|
| `id` | `UUID` | auto | Unique identifier |
| `name` | `String` | required | Display name |
| `category` | `String` | `""` | Grouping category |
| `priority` | `ProjectPriority` | `.medium` | Priority tier |
| `cadence` | `ProjectCadence` | `.weekly` | Target frequency |
| `isActive` | `Bool` | `true` | Whether project is active |
| `tracksCompletion` | `Bool` | `false` | Whether tagging prompts for percentage/quality |
| `exertEligible` | `Bool` | `true` | Show in Exert block suggestions |
| `status` | `ProjectLifecycleStatus` | `.active` | Lifecycle status |
| `completionNote` | `String?` | `nil` | Note for completed/archived/abandoned |
| `completionDate` | `Date?` | `nil` | When the lifecycle event occurred |

### TaskDefinition

A first-class task entity for unified stats across all blocks and ad-hoc appearances.

| Field | Type | Default | Description |
|---|---|---|---|
| `id` | `UUID` | auto | Unique identifier |
| `title` | `String` | required | Task name (e.g., "Pray Dhuhr") |
| `defaultDurationMinutes` | `Int?` | `nil` | Default duration |
| `defaultDifficulty` | `TaskDifficulty` | `.low` | Default difficulty |
| `defaultProjectIDs` | `[UUID]` | `[]` | Default project tags |

### AdHocTask

A flexible one-off or recurring task outside the routine structure.

| Field | Type | Default | Description |
|---|---|---|---|
| `id` | `UUID` | auto | Unique identifier |
| `taskID` | `UUID` | required | References a TaskDefinition |
| `recurrence` | `AdHocRecurrence` | `.rePlannable` | How it recurs |
| `status` | `AdHocStatus` | `.active` | Lifecycle status |
| `createdDate` | `Date` | now | When created |
| `completedDate` | `Date?` | `nil` | When completed |
| `abandonedDate` | `Date?` | `nil` | When abandoned |
| `abandonReason` | `String?` | `nil` | Reason for abandonment |
| `difficulty` | `TaskDifficulty` | `.low` | Difficulty rating |
| `estimatedMinutes` | `Int?` | `nil` | Estimated duration |
| `timeWindow` | `AdHocTimeWindow` | `.anytime` | When it should be done |
| `timeNote` | `String?` | `nil` | Free-text time note |

**Computed:**
- `effortScore` → `Double`: `difficulty.effortScore(durationMinutes: estimatedMinutes)`

---

## Entity Relationships

```
RoutineTemplate
  └─ blockIDs: [UUID] ──references──▶ BlockTemplate[]

BlockTemplate
  └─ actions: [ActionItem]
       └─ taskID: UUID? ──references──▶ TaskDefinition
       └─ defaultProjectIDs: [UUID] ──references──▶ Project[]

AdHocTask
  └─ taskID: UUID ──references──▶ TaskDefinition

Project (standalone, tagged at runtime via Core Data logs)
```

# Views & UI

All screens, their layout, components, navigation flow, and user interactions.

---

## Navigation Structure

```
ContentView (main screen)
├── toolbar left:
│   ├── StatsView (chart icon)
│   └── ProjectRadarView (folder icon)
├── toolbar right:
│   └── SettingsView (gear icon)
│       ├── BlockEditorView (create/edit block)
│       ├── RoutineEditorView (create/edit routine)
│       ├── TaskRegistryView (task registry)
│       ├── ProjectListView (project management)
│       └── ImportView (import JSON)
└── main content:
    ├── Routine selector (horizontal scroll)
    ├── AdHocDaySection
    │   └── AdHocPickerView (sheet)
    ├── BlockRow[] (vertical timeline)
    │   ├── ProjectTaggingView (sheet per action)
    │   └── Completion Override Sheet (sheet)
    ├── DayProjectTagSection
    │   └── ProjectTaggingView (sheet)
    └── TaskStatsView (navigation link from TaskRegistryView)
```

---

## ContentView (Main Screen)

The app's root view. Shows the day's schedule.

### Layout

1. **Navigation title**: Today's date formatted as `"EEEE, MMM d"` (e.g., "Saturday, Apr 19")
2. **Routine selector** (top): Horizontal scrollable row of capsule-shaped buttons, one per routine. Active routine is accent-colored. Tapping a different routine triggers `loadDay()`.
3. **Loading state**: Centered `ProgressView` with text "Loading prayer times..."
4. **Error state**: WiFi-slash icon, error message, "Retry" button
5. **Block timeline** (main area): Scrollable vertical list
   - `AdHocDaySection` at top
   - `BlockRow` for each resolved block
   - `DayProjectTagSection` at bottom
6. **Auto-scroll**: On appear, scroll to the first active block (anchor: top)
7. **Pull-to-refresh**: Triggers `loadDay()`
8. **Keyboard**: Scroll dismisses keyboard interactively

### Toolbar

| Position | Icon | Destination |
|---|---|---|
| Leading | `chart.bar.fill` | `StatsView` |
| Leading | `folder.fill` | `ProjectRadarView` |
| Trailing | `gearshape` | `SettingsView` |

---

## BlockRow

A single block in the timeline. Shows a vertical timeline bar on the left.

### Layout

1. **Left timeline bar**: Circle indicator (12px) + vertical line (2px wide)
   - Active block: full color circle with 3px border ring (20px outer), highlighted background
   - Past block: 40% opacity circle
   - Future block: 70% opacity circle
2. **Header** (tappable, toggles expand/collapse):
   - Block name (headline font)
   - Time range: `"h:mm a – h:mm a · Xm"` (caption, secondary)
   - "NOW" capsule badge if active (accent color background, white text)
   - Done count `"X/Y"` badge when collapsed (green if all done)
   - Chevron up/down indicator
3. **Expanded content** (when expanded):
   - Actions list with anchor phase sections
   - Reflection note field

### Auto-expand behavior
- Active block auto-expands on appear (unless user manually collapsed it)
- `userToggledCollapse` flag prevents re-expansion

### Actions List

If any action has `anchorPhase != .none`, display actions grouped by phase:

| Section Label | Phase |
|---|---|
| `"Before"` | `.preAnchor` |
| `"Prayer"` | `.anchor` |
| `"After"` | `.postAnchor` |

Each section header: caption2, semibold, secondary, uppercase.

If no actions have phases, display as a flat list.

### Action Row

Each action displays:

| Element | Description |
|---|---|
| Checkbox | Circle / checkmark.circle.fill icon. Tapping toggles completion (with haptic feedback). On completion → shows override sheet. |
| Title | Subheadline. Strikethrough + secondary color when completed. |
| Tag button | Capsule with tag icon + count. Tapping opens ProjectTaggingView sheet. Accent-colored when tags > 0. |
| Duration | `"Xm"` in caption2 |
| Points | `"X pts"` in caption2. Green when completed. |
| Project names | Below the row, 9pt secondary text showing comma-separated tagged project names |

### Completion Override Sheet

Presented when a user marks an action complete. `.medium` detent.

| Section | Content |
|---|---|
| "How did it feel?" | Segmented picker of TaskDifficulty levels |
| "Actual Duration" | Text field for minutes (number pad). "Leave blank to keep planned duration." |
| Cancel ("Skip") | Dismiss without saving overrides |
| Save | Save actual difficulty and duration to CDActionLog |

### Reflection Note Field

| Element | Description |
|---|---|
| Label | `"Reflection"` (caption2, semibold, secondary, uppercase) |
| Text field | Rounded border, 2-4 lines, placeholder "How did this block go?" |
| Behavior | Auto-scrolls to center when focused. Debounced save (500ms). |

---

## AdHocDaySection

Section at the top of the timeline showing ad-hoc tasks planned for today.

### Layout

1. **Header**: "Ad-Hoc Tasks" with `+` button to open `AdHocPickerView` sheet
2. **List of planned tasks**: Each shows:
   - Checkbox (toggle completion)
   - Title
   - Skip count badge (orange, if > 0, shows number of times skipped)
   - Days since created badge
   - Time window label (if set)
   - Effort score
   - Swipe actions: Skip (orange), Remove (red)
3. **Empty state**: "No ad-hoc tasks planned" with "Plan Tasks" button
4. If skip rate > 50%: warning text "⚠️ High skip rate — consider simplifying"

---

## AdHocPickerView

Sheet for planning ad-hoc tasks for a day.

### Layout

1. **Search bar**: Filters active ad-hoc tasks by title
2. **"Create New" section**: Button to create a new ad-hoc task inline
   - Title text field
   - Duration stepper
   - Difficulty picker (segmented)
   - Recurrence picker
   - Time window picker
3. **Active tasks list**: Each active ad-hoc task with a "Plan" button
   - Shows task title, difficulty badge, estimated minutes
   - Already-planned tasks show a checkmark instead
4. **Navigation title**: "Plan Ad-Hoc Tasks"

---

## ProjectTaggingView

Sheet for tagging an action or day with projects.

### Layout

1. **If showSuggestions is true** (Exert/filler blocks): "Suggestions" section with top 3 project suggestions from ProjectEngine, showing urgency reason
2. **"All Projects" section**: List of all active projects with checkmarks for selected ones
   - Tapping toggles selection
   - If project has `tracksCompletion`: shows a percentage slider (0-100%) when selected
3. **Navigation title**: "Tag Projects"

---

## DayProjectTagSection

Section at the bottom of the timeline for day-level project tagging.

### Layout

1. **Header**: "Day Projects" with tag icon button to open ProjectTaggingView sheet
2. **Tag pills**: Horizontal wrap of project name pills, each showing the project name and optional percentage
3. **Empty state**: "Tag projects for the day" prompt

---

## SettingsView

Full settings screen.

### Sections

1. **City**: Text field for prayer times city. Saves on change.
2. **Iqamah Times**: For each prayer (Fajr, Dhuhr, Asr, Maghrib, Isha, Jumu'ah):
   - Toggle between Fixed and Relative
   - Fixed: Hour and minute pickers
   - Relative: Stepper for offset minutes
3. **Notifications**: Picker for NotificationMode (Standard/Alarm/Silent)
4. **Nap**: Toggle for including Qaylulah block
5. **Blocks**: List of all block templates with swipe-to-delete. "Add Block" button → BlockEditorView.
6. **Routines**: List of all routine templates with swipe-to-delete. "Add Routine" button → RoutineEditorView.
7. **Task Registry**: Navigation link to TaskRegistryView
8. **Projects**: Navigation link to ProjectListView
9. **Import**: Navigation link to ImportView
10. **Export**: Buttons for "Export JSON" (SighBundle) and "Export CSV" (day logs)
    - JSON: uses `ImportExportService.exportBundle`
    - CSV: uses `CSVExporter.exportAll`
    - Both present a share sheet

---

## BlockEditorView

Form for creating or editing a BlockTemplate.

### Fields

1. **Block Info**: Name text field, Color picker (segmented, 10 colors)
2. **Anchor Type**: Segmented picker (Prayer Time / Iqamah Time / Fixed Time / Filler)
   - Prayer Time: Prayer picker + offset stepper (-120 to +120, step 5). Shows computed offset suggestion from pre-anchor actions.
   - Iqamah Time: Prayer picker (excludes sunrise) + offset stepper
   - Fixed Time: Toggle for auto-chain. If not auto-chain: hour/minute wheel pickers.
   - Filler: Info text
3. **Duration** (not for filler): Stepper 5-480 min, step 5. Shows computed duration suggestion from actions.
4. **Early Notification**: Stepper 0-60 min, step 5
5. **Actions**: Ordered list, swipe-to-delete, drag-to-reorder
   - Each action: title, duration, anchor phase picker, difficulty picker, task definition linkage
   - "Add Action" button
6. **Save/Cancel** toolbar buttons

### Anchor Phase Picker

For prayerTime and iqamahTime anchors: shows a segmented picker with Pre/Anchor/Post/None options per action.

### Task Definition Linkage

When adding/editing an action, the editor calls `store.findOrCreateTaskDefinition(title:)` to ensure a TaskDefinition exists, and links the action to it via `taskID`.

---

## RoutineEditorView

Form for creating or editing a RoutineTemplate.

### Fields

1. **Name**: Text field
2. **Description**: Text field
3. **Weekdays**: Multi-select toggles for Sun–Sat
4. **Blocks**: Ordered list of block references
   - Each shows block name + anchor label
   - Swipe-to-delete, drag-to-reorder
   - "Add Block" button: picker sheet showing all available blocks

---

## TaskRegistryView

List of all TaskDefinitions.

### Layout

1. **Search bar**: Filters by title
2. **List**: Each task shows:
   - Title
   - Default duration and difficulty badges
   - Block count (number of blocks referencing this task)
   - Navigation link to TaskStatsView
3. **Swipe actions**: Delete
4. **Add button**: Create new TaskDefinition

---

## TaskStatsView

Detailed stats for a single TaskDefinition.

### Layout

1. **Streak info**: Current streak, longest streak, total completions
2. **Block appearances**: List of blocks that contain this task
3. **Recent history**: Per-day completion status for last 14 days

---

## StatsView

Overall statistics dashboard.

### Layout

1. **Summary cards**:
   - Current streak (days)
   - Longest streak (days)
   - Trend indicator (Leveling Up / Steady / Leveling Down)
2. **Training load chart**: Bar chart showing last 28 days of earnedScore
   - Short-term load line (7-day average)
   - Long-term load line (28-day average)
3. **Top task streaks**: List of top 5 tasks by current streak
4. **Ad-Hoc analytics**:
   - 28-day skip rate
   - Procrastination list (tasks sorted by skip count descending)

### Streak Threshold

A day counts toward the streak if `completionRate >= 0.80` (80%).

### Trend Calculation

- `ratio = shortTermLoad / longTermLoad`
- `ratio > 1.1` → Leveling Up
- `ratio < 0.9` → Leveling Down
- else → Steady

---

## ProjectListView

CRUD screen for projects.

### Layout

1. **Segmented filter**: Active / Completed / Archived / Abandoned / All
2. **List**: Each project shows:
   - Name, category, priority badge, cadence
   - Status indicator
   - Swipe actions: Complete/Archive/Abandon (with note prompt), Delete
3. **Add button**: Create new project form
4. **Project form fields**: Name, Category, Priority picker, Cadence picker, tracksCompletion toggle, exertEligible toggle

---

## ProjectRadarView

Visual overview of project health.

### Layout

1. **Neglect radar list**: All active projects sorted by neglect score descending
   - Each shows: project name, status label, days since last worked, cadence target
   - Color coding: red for severely neglected, orange for neglected, yellow for due soon, green for on track
2. **Suggestions section**: Top 5 project suggestions from ProjectEngine with urgency reasons
3. **Minutes summary**: Per-project minutes in last 7 and 30 days

---

## ImportView

Screen for importing a SighBundle JSON file.

### Layout

1. **File picker**: Select a JSON file
2. **Preview**: Shows counts of blocks, routines, projects to be imported
3. **Mode selector**: Replace All / Merge
   - Replace: Overwrites all templates and projects
   - Merge: Only adds new items (by name match)
4. **Import button**: Applies the bundle

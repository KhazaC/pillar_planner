# Sigh — Application Overview

## Purpose

Sigh is a **prayer-time-anchored daily planner** designed for Muslims. It structures a user's entire day around the five Islamic prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha) plus Jumu'ah (Friday congregational prayer). The app fetches real prayer times from an API, then resolves a user-defined "routine" into a concrete timeline of time blocks with actionable tasks.

## Core Concept: Block-Based Scheduling

The day is divided into **Blocks** — contiguous time segments. Each block:

- Has an **anchor** that determines when it starts (relative to a prayer time, iqamah time, a fixed clock time, or fills available gaps)
- Contains an ordered list of **Actions** (tasks/to-dos) that the user checks off throughout the day
- Has a computed **effort score** based on task difficulty × duration
- Can be tagged with **Projects** for tracking what work categories the user is investing time in

## Key Subsystems

| Subsystem | Purpose |
|---|---|
| **Routine Templates** | Named day plans: sequences of block template IDs mapped to weekdays |
| **Block Templates** | Reusable block definitions with anchor type, actions, color, notifications |
| **Block Resolver** | Converts block templates + prayer API data → concrete start/end times |
| **Task Registry** | Global catalog of tasks for unified stats across all blocks |
| **Ad-Hoc Tasks** | One-off or re-plannable tasks outside the routine structure |
| **Project System** | Named projects with priority/cadence; tagged to actions for neglect tracking |
| **Project Engine** | Computes neglect scores and suggests which projects to work on |
| **Stats Engine** | Streaks, training load (7-day vs 28-day averages), per-task analytics |
| **Notifications** | Local notifications for block starts and early warnings |
| **Import/Export** | Portable JSON bundle format for cross-platform data transfer |
| **Persistence** | Dual storage: UserDefaults (templates) + Core Data (daily logs) |

## Architecture Pattern

- **MVVM**: Views observe ViewModels which interact with a central DataStore
- **Singleton DataStore**: `DataStore.shared` is the single source of truth for all templates, projects, task definitions, and ad-hoc tasks
- **Programmatic Core Data**: The Core Data model is built in code (no .xcdatamodeld file) for portability
- **Reactive UI**: Published properties on the DataStore and ViewModel drive UI updates

## Application Entry Point

The app launches into a `ContentView` which:

1. Auto-selects a routine based on the current weekday
2. Fetches prayer times for the configured city from the Aladhan API
3. Resolves the routine's blocks into concrete times using the `BlockResolver`
4. Displays a scrollable timeline with expandable block rows
5. Restores saved completion state from Core Data
6. Schedules local notifications for upcoming blocks
7. Shows ad-hoc tasks planned for the day at the top

## File Index

| Design Doc | Contents |
|---|---|
| [01-data-models.md](01-data-models.md) | All entities, enums, and relationships |
| [02-services.md](02-services.md) | DataStore, BlockResolver, ProjectEngine, StatsEngine |
| [03-view-models.md](03-view-models.md) | DayViewModel logic and state |
| [04-views-ui.md](04-views-ui.md) | All screens, components, navigation, and layout |
| [05-persistence.md](05-persistence.md) | Core Data schema, UserDefaults keys, managed object classes |
| [06-algorithms.md](06-algorithms.md) | Block resolution, effort scoring, training load, neglect radar |
| [07-api-integrations.md](07-api-integrations.md) | Aladhan prayer times API |
| [08-notifications.md](08-notifications.md) | Local notification scheduling |
| [09-import-export.md](09-import-export.md) | Portable JSON bundle format and CSV export |
| [10-preloaded-data.md](10-preloaded-data.md) | Default blocks, routines, and seed data |

# Notifications

Local notification system for alerting users about upcoming blocks.

---

## Overview

The app uses local (on-device) notifications — no push notification server is needed. Notifications are re-scheduled every time the day is loaded.

## Permission

Request authorization with options: `alert`, `sound`, `badge`, `providesAppNotificationSettings`.

## Notification Modes

| Mode | Behavior |
|---|---|
| `Standard` | Normal sound, normal interruption level |
| `Alarm` | Time-sensitive interruption level (breaks through Focus/DND). Custom alarm sound if bundled (`alarm.caf`), otherwise `defaultCritical` system sound. |
| `Silent` | No notifications scheduled at all |

## Notification Types

### Block Start Notification

Fired at the exact start time of each block.

| Property | Value |
|---|---|
| Identifier | `"block-start-{resolvedBlock.id}"` |
| Title | Block name (e.g., `"Fajr"`) |
| Body | `"Time for {name} ({formattedDuration})"` |
| Trigger | Calendar trigger matching year/month/day/hour/minute/second of start time |
| Sound | Standard or Alarm mode sound |
| Interruption Level | Standard: default. Alarm: `.timeSensitive` |

### Early Warning Notification

Fired N minutes before a block starts (configurable per block via `earlyNotificationMinutes`).

| Property | Value |
|---|---|
| Identifier | `"block-early-{resolvedBlock.id}"` |
| Title | `"{name} in {N} min"` |
| Body | `"{name} starts at {formattedStartTime}"` |
| Trigger | Calendar trigger matching the early time |
| Sound | Always standard (never alarm mode) |
| Interruption Level | Default |
| Condition | Only scheduled if `earlyNotificationMinutes > 0` AND early time is in the future |

## Scheduling Flow

```
1. Cancel all pending block notifications
2. If mode is Silent → return (no notifications)
3. For each resolved block:
   a. Skip if block has already ended
   b. Schedule block-start notification
   c. If earlyNotificationMinutes > 0 AND early time is in the future:
      Schedule early warning notification
```

## Custom Alarm Sound

If the app bundle contains a file named `alarm.caf`, it is used as the alarm sound. Otherwise, the system's `defaultCritical` sound is used.

The sound file format should be:
- Format: CAF (Core Audio Format) or compatible
- Duration: Up to 30 seconds (iOS limit for notification sounds)
- Resource name: `alarm` with extension `caf`

## Platform Considerations

For non-iOS platforms, the notification system should:
1. Support scheduling notifications at specific times
2. Support at least two urgency levels (normal and high-priority/alarm)
3. Support custom notification sounds
4. Allow canceling all previously scheduled notifications
5. Allow scheduling based on calendar date components (not just time intervals)

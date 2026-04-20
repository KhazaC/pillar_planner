# Algorithms

Detailed pseudocode for all non-trivial algorithms in the application.

---

## 1. Block Resolution Algorithm

**Input:**
- `blocks: [BlockTemplate]` — ordered block templates from a routine
- `timings: AladhanTimings` — prayer times for the day from the API
- `iqamah: IqamahSchedule` — user-configured iqamah times
- `date: Date` — the target day
- `includeNap: Bool` — whether to include Qaylulah blocks

**Output:** `[ResolvedBlock]` — blocks with concrete start/end times

### Pseudocode

```
function resolve(blocks, timings, iqamah, date, includeNap):
    resolved = []
    previousEnd = null
    exertIndex = 1

    // Pre-compute anchored times for filler lookahead
    anchoredTimes = []
    for each (index, block) in blocks:
        time = anchorTime(block, timings, iqamah, date)
        if time != null:
            anchoredTimes.append((index, time))

    for i in 0..blocks.length:
        block = blocks[i]

        // Skip Qaylulah if nap not included
        if block.name contains "Qaylulah" AND NOT includeNap:
            continue

        switch block.anchor:
            case prayerTime(prayer, offset):
                base = timings.dateFor(prayer.apiPrayer, date) ?? previousEnd ?? date
                start = base + (offset * 60 seconds)
                end = start + (block.durationMinutes * 60 seconds)
                resolved.append(makeResolved(block, start, end))
                previousEnd = end

            case iqamahTime(prayer, offset):
                iqamahDate = iqamah.resolvedDate(prayer, timings, date)
                             ?? timings.dateFor(prayer.apiPrayer, date)
                             ?? previousEnd ?? date
                adjusted = iqamahDate + (offset * 60 seconds)
                // Subtract pre-anchor duration so block starts before iqamah
                start = adjusted - (block.preAnchorMinutes * 60 seconds)
                end = start + (block.durationMinutes * 60 seconds)
                resolved.append(makeResolved(block, start, end))
                previousEnd = end

            case fixedTime(hour, minute):
                if hour == 0 AND minute == 0:
                    // Auto-chain: start after previous block
                    start = previousEnd ?? date
                else:
                    start = date.setTime(hour, minute)
                end = start + (block.durationMinutes * 60 seconds)
                resolved.append(makeResolved(block, start, end))
                previousEnd = end

            case filler:
                if previousEnd == null: continue
                fillStart = previousEnd

                // Find next anchored block's start time
                fillEnd = fillStart + 60 minutes  // default 1 hour
                for each (atIndex, atTime) in anchoredTimes where atIndex > i:
                    nextBlock = blocks[atIndex]
                    nextStart = atTime
                    // Adjust for iqamah blocks: subtract their preAnchorMinutes
                    if nextBlock.anchor is iqamahTime:
                        nextStart = nextStart - (nextBlock.preAnchorMinutes * 60 seconds)
                    if nextStart > fillStart:
                        fillEnd = nextStart
                        break

                if fillEnd <= fillStart:
                    fillEnd = fillStart + 60 minutes

                // Create named filler block
                namedBlock = copy of block with:
                    name = "Exert {exertIndex}"
                    overallDurationMinutes = (fillEnd - fillStart) in minutes
                exertIndex++
                resolved.append(makeResolved(namedBlock, fillStart, fillEnd))
                previousEnd = fillEnd

    return resolved
```

### anchorTime helper

```
function anchorTime(block, timings, iqamah, date):
    switch block.anchor:
        case prayerTime(prayer, offset):
            base = timings.dateFor(prayer.apiPrayer, date)
            return base + (offset * 60s) if base exists, else null
        case iqamahTime(prayer, offset):
            base = iqamah.resolvedDate(prayer, timings, date)
                   ?? timings.dateFor(prayer.apiPrayer, date)
            return base + (offset * 60s) if base exists, else null
        case fixedTime(h, m):
            if h == 0 AND m == 0: return null  // auto-chained
            return date.setTime(h, m)
        case filler:
            return null
```

---

## 2. Effort Score Calculation

```
effortScore(durationMinutes, difficulty):
    duration = max(durationMinutes ?? 5, 1)
    multiplier = difficulty.multiplier  // 0.5, 1.0, 1.5, 2.0, 3.0
    return duration * multiplier
```

### Day Scores

```
possibleScore = sum of effortScore for ALL actions in all blocks
earnedScore = sum of effortScore for COMPLETED actions only
completionRate = earnedScore / possibleScore  (0 if possibleScore == 0)
```

---

## 3. Training Load (ACWR-Inspired)

Adapted from the Acute:Chronic Workload Ratio used in sports science.

```
function recalculateLoads(date):
    // Fetch last 28 days of CDDayLog
    logs = fetchDayLogs(date - 27 days, date)
    logsWithData = logs.filter(possibleScore > 0)

    last7 = logsWithData.suffix(7)

    shortTermLoad = average(last7.earnedScore)  // 7-day average
    longTermLoad = average(logsWithData.earnedScore)  // 28-day average

    save shortTermLoad, longTermLoad to CDDayLog
```

### Trend Calculation

```
if longTermLoad == 0:
    trend = shortTermLoad > 0 ? "Leveling Up" : "Steady"
else:
    ratio = shortTermLoad / longTermLoad
    if ratio > 1.1: trend = "Leveling Up"
    else if ratio < 0.9: trend = "Leveling Down"
    else: trend = "Steady"
```

---

## 4. Streak Calculation

### Day Streak

```
threshold = 0.80

function currentStreak(days):
    streak = 0
    for day in days.reversed():
        if day.possibleScore == 0: skip  // no data
        if day.completionRate >= threshold:
            streak++
        else:
            break
    return streak

function longestStreak(days):
    longest = 0
    current = 0
    for day in days:
        if day.possibleScore == 0: skip
        if day.completionRate >= threshold:
            current++
            longest = max(longest, current)
        else:
            current = 0
    return longest
```

### Per-Task Streak

```
function taskStreak(taskDefinitionID):
    // Gather all completion dates from:
    // 1. CDActionLog (where taskDefinitionID matches AND isCompleted)
    // 2. CDAdHocLog (where taskDefinitionID matches AND isCompleted)
    completionDates = Set of unique dates (start-of-day)

    // Current streak: walk backwards from today
    currentStreak = 0
    checkDate = today
    while completionDates contains checkDate:
        currentStreak++
        checkDate = checkDate - 1 day

    // Longest streak: walk forward through sorted dates
    longestStreak = 0
    streak = 0
    for i in sortedDates:
        if i == 0:
            streak = 1
        else:
            daysBetween = sortedDates[i] - sortedDates[i-1]
            if daysBetween == 1: streak++
            else: streak = 1
        longestStreak = max(longestStreak, streak)

    return { currentStreak, longestStreak, totalCompletions: completionDates.count }
```

---

## 5. Project Neglect Radar

```
function computeNeglectRadar():
    for each activeProject:
        lastDate = lastWorkedDate(project.id)  // from CDProjectLog + CDDayProjectTag
        
        if lastDate exists:
            daysSince = today - lastDate (in days)
            neglectScore = daysSince / project.cadence.targetIntervalDays
        else:
            daysSince = null
            neglectScore = 10.0  // never worked on = max neglect

        minutesLast7Days = sum CDProjectLog.minutesSpent where date >= today-7
        minutesLast30Days = sum CDProjectLog.minutesSpent where date >= today-30

    sort by neglectScore descending
    
    status labels:
        neglectScore > 2.0 → "Severely neglected"
        neglectScore > 1.0 → "Neglected"
        neglectScore > 0.5 → "Due soon"
        else → "On track"
```

---

## 6. Project Suggestions for Exert Blocks

```
function suggestProjects(limit = 5):
    statuses = computeNeglectRadar().filter(project.exertEligible)

    for each status in top (limit * 2) candidates:
        urgency = project.priority.sortWeight * max(neglectScore, 0.1)

        reason:
            if never started: "Never started — {priority} priority"
            if neglectScore > 2.0: "Severely overdue ({days}d ago, target: every {target}d)"
            if neglectScore > 1.0: "Overdue — last worked {days}d ago"
            if neglectScore > 0.5: "Due soon — {priority} priority"
            else: "On track — {minutes}m this week"

    sort by urgency descending
    return top {limit} results
```

---

## 7. Ad-Hoc Analytics

```
function adHocAnalytics():
    // 28-day skip rate
    logs = CDAdHocLog where date >= today - 28 days
    skipRate = count(isSkipped) / total count

    // Procrastination list
    for each activeAdHocTask:
        skipCount = count CDAdHocLog where isSkipped AND adHocTaskID matches
        daysSinceCreated = today - createdDate
    sort by skipCount descending
```

---

## 8. Iqamah Time Resolution

```
function resolvedDate(prayer, timings, date):
    config = iqamahSchedule.config(for: prayer)
    if config is null: return null

    if config is fixed(timeOfDay):
        return timeOfDay.toDate(on: date)
    
    if config is relative(offsetMinutes):
        adhanTime = timings.dateFor(prayer.apiPrayer, date)
        return adhanTime + (offsetMinutes * 60 seconds)
```

---

## 9. Project Minutes Attribution

When tagging an action with projects:

```
durationMinutes = actionLog.durationMinutes (or 5 if 0)
perProject = durationMinutes / numberOfProjects

For each projectID:
    create CDProjectLog with minutesSpent = perProject
```

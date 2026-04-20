# Preloaded / Seed Data

Default blocks and routines seeded on first launch. These define the Islamic daily schedule the app is designed around.

---

## Design Philosophy

The seed data provides two tiers:
1. **Baseline** — Absolute bare-minimum non-negotiable blocks (prayers at home, minimal actions)
2. **Full** — Complete blocks with all add-ons (masjid attendance, sunnah prayers, adhkar, Quran study)

Plus shared blocks that appear in multiple routines.

---

## Baseline Blocks

### Fajr (Baseline)

| Property | Value |
|---|---|
| Anchor | prayerTime(Fajr, offset: -5) |
| Duration | 20 min |
| Color | indigo |

| Action | Duration | Phase | Difficulty |
|---|---|---|---|
| Wash Face | 2 | preAnchor | veryLow |
| Brush Teeth | 2 | preAnchor | veryLow |
| Pray 2 Rakah Sunnah for Fajr | 3 | preAnchor | veryLow |
| Pray Fajr | 10 | anchor | low |

### Post-Fajr (WFH)

| Property | Value |
|---|---|
| Anchor | fixedTime(0, 0) — auto-chain |
| Duration | 90 min |
| Color | indigo |

| Action | Duration | Phase | Difficulty |
|---|---|---|---|
| Exercise | 60 | none | medium |
| Shower | 10 | none | veryLow |
| Journal | 20 | none | low |

### Post-Fajr (Office)

| Property | Value |
|---|---|
| Anchor | fixedTime(0, 0) — auto-chain |
| Duration | 60 min |
| Color | indigo |

| Action | Duration | Phase | Difficulty |
|---|---|---|---|
| Shower | 10 | none | veryLow |
| Journal | 20 | none | low |
| Commute to Office | 30 | none | veryLow |

### Dhuhr (Baseline)

| Property | Value |
|---|---|
| Anchor | prayerTime(Dhuhr, offset: -3) |
| Duration | 15 min |
| Color | orange |

| Action | Duration | Phase | Difficulty |
|---|---|---|---|
| Make Wudu | 3 | preAnchor | veryLow |
| Pray Dhuhr | 10 | anchor | low |

### Asr (Baseline)

| Property | Value |
|---|---|
| Anchor | prayerTime(Asr, offset: -3) |
| Duration | 15 min |
| Color | yellow |

| Action | Duration | Phase | Difficulty |
|---|---|---|---|
| Make Wudu | 3 | preAnchor | veryLow |
| Pray Asr | 10 | anchor | low |

### Maghrib (Baseline)

| Property | Value |
|---|---|
| Anchor | prayerTime(Maghrib, offset: -3) |
| Duration | 15 min |
| Color | pink |

| Action | Duration | Phase | Difficulty |
|---|---|---|---|
| Make Wudu | 3 | preAnchor | veryLow |
| Pray Maghrib | 10 | anchor | low |

### Isha (Baseline)

| Property | Value |
|---|---|
| Anchor | prayerTime(Isha, offset: -3) |
| Duration | 20 min |
| Color | purple |

| Action | Duration | Phase | Difficulty |
|---|---|---|---|
| Make Wudu | 3 | preAnchor | veryLow |
| Pray Isha | 10 | anchor | low |
| Pray Witr | 5 | postAnchor | low |

### Night Routine (Baseline)

| Property | Value |
|---|---|
| Anchor | fixedTime(0, 0) — auto-chain |
| Duration | 10 min |
| Color | gray |

| Action | Duration | Phase | Difficulty |
|---|---|---|---|
| Wash Face | 2 | none | veryLow |
| Brush Teeth | 2 | none | veryLow |
| Floss | 2 | none | veryLow |
| Sleep | — | none | veryLow |

---

## Full Blocks (With Add-Ons)

### Pre-Fajr

| Property | Value |
|---|---|
| Anchor | prayerTime(Fajr, offset: -30) |
| Duration | 25 min |
| Color | indigo |

| Action | Duration | Phase | Difficulty |
|---|---|---|---|
| Pray Tahajjud | 25 | none | veryHigh |

### Fajr (Full)

| Property | Value |
|---|---|
| Anchor | iqamahTime(Fajr, offset: 0) |
| Duration | 110 min |
| Color | indigo |

| Action | Duration | Phase | Difficulty |
|---|---|---|---|
| Dua for Waking up | 1 | preAnchor | low |
| Look at Sky | 1 | preAnchor | low |
| First 10 verses of Surah Imran | 3 | preAnchor | low |
| Wash Face | 2 | preAnchor | veryLow |
| Brush Teeth | 2 | preAnchor | veryLow |
| Walk to Masjid | 7 | preAnchor | high |
| Pray 2 Rakah Sunnah for Fajr | 3 | preAnchor | veryLow |
| Pray Fajr | 10 | anchor | low |
| Adhkar After Salah | 2 | postAnchor | veryLow |
| Morning Adhkar | 10 | postAnchor | low |
| Memorize Quran | 35 | postAnchor | high |
| Revise Quran | 25 | postAnchor | medium |
| Walk Home from Masjid | 7 | postAnchor | high |

### Dhuhr (Home)

| Property | Value |
|---|---|
| Anchor | iqamahTime(Dhuhr, offset: 0) |
| Duration | 50 min |
| Color | orange |

| Action | Duration | Phase | Difficulty |
|---|---|---|---|
| Pray 2 Rakah Sunnah for Dhuhr Before | 3 | preAnchor | veryLow |
| Pray 2 Rakah extra Sunnah for Dhuhr Before | 3 | preAnchor | low |
| Walk to Masjid | 7 | preAnchor | high |
| Pray Dhuhr | 10 | anchor | low |
| Pray 2 Rakah Sunnah for Dhuhr After | 3 | postAnchor | veryLow |
| Adhkar After Salah | 2 | postAnchor | veryLow |
| Read Translation / Tafsir | 12 | postAnchor | medium |
| Walk Home from Masjid | 7 | postAnchor | high |

### Dhuhr (Office)

| Property | Value |
|---|---|
| Anchor | prayerTime(Dhuhr, offset: 0) |
| Duration | 35 min |
| Color | orange |

| Action | Duration | Phase | Difficulty |
|---|---|---|---|
| Make Wudu | 3 | preAnchor | veryLow |
| Pray 2 Rakah Sunnah for Dhuhr Before | 3 | preAnchor | veryLow |
| Pray 2 Rakah extra Sunnah for Dhuhr Before | 3 | preAnchor | low |
| Pray Dhuhr | 10 | anchor | low |
| Pray 2 Rakah Sunnah for Dhuhr After | 3 | postAnchor | veryLow |
| Adhkar After Salah | 2 | postAnchor | veryLow |
| Read Translation / Tafsir | 12 | postAnchor | medium |

### Asr (Home)

| Property | Value |
|---|---|
| Anchor | iqamahTime(Asr, offset: 0) |
| Duration | 50 min |
| Color | yellow |

| Action | Duration | Phase | Difficulty |
|---|---|---|---|
| Walk to Masjid | 7 | preAnchor | high |
| Pray Asr | 10 | anchor | low |
| Adhkar After Salah | 2 | postAnchor | veryLow |
| Evening Adhkar | 10 | postAnchor | low |
| Read Translation / Tafsir | 12 | postAnchor | medium |
| Walk Home from Masjid | 7 | postAnchor | high |

### Asr (Office)

| Property | Value |
|---|---|
| Anchor | prayerTime(Asr, offset: 0) |
| Duration | 65 min |
| Color | yellow |

| Action | Duration | Phase | Difficulty |
|---|---|---|---|
| Make Wudu | 3 | preAnchor | veryLow |
| Pray Asr | 10 | anchor | low |
| Adhkar After Salah | 2 | postAnchor | veryLow |
| Evening Adhkar | 10 | postAnchor | low |
| Read Translation / Tafsir | 12 | postAnchor | medium |
| Commute Home | 30 | postAnchor | veryLow |

### Maghrib (Full)

| Property | Value |
|---|---|
| Anchor | iqamahTime(Maghrib, offset: 0) |
| Duration | 45 min |
| Color | pink |

| Action | Duration | Phase | Difficulty |
|---|---|---|---|
| Walk to Masjid | 7 | preAnchor | high |
| Pray Maghrib | 10 | anchor | low |
| Pray 2 Rakah Sunnah for Maghrib After | 3 | postAnchor | veryLow |
| Pray 2 Rakah extra Sunnah for Maghrib After | 3 | postAnchor | low |
| Read Quran for 15 minutes | 15 | postAnchor | medium |
| Walk Home from Masjid | 7 | postAnchor | high |

### Isha (Full)

| Property | Value |
|---|---|
| Anchor | iqamahTime(Isha, offset: 0) |
| Duration | 50 min |
| Color | purple |

| Action | Duration | Phase | Difficulty |
|---|---|---|---|
| Walk to Masjid | 7 | preAnchor | medium |
| Pray Isha | 10 | anchor | low |
| Pray 2 Rakah Sunnah for Isha After | 3 | postAnchor | veryLow |
| Pray 2 Rakah extra Sunnah for Isha After | 3 | postAnchor | low |
| Read Translation / Tafsir | 12 | postAnchor | medium |
| Walk Home from Masjid | 7 | postAnchor | medium |
| Pray Witr | 5 | postAnchor | low |

### Night Routine (Full)

| Property | Value |
|---|---|
| Anchor | fixedTime(0, 0) — auto-chain |
| Duration | 35 min |
| Color | gray |

| Action | Duration | Phase | Difficulty |
|---|---|---|---|
| Wash Face | 2 | none | veryLow |
| Brush Teeth | 2 | none | veryLow |
| Floss | 2 | none | veryLow |
| Use Tretinoin | 1 | none | veryLow |
| Bedtime wudu | 3 | none | low |
| Dust of the bed | 1 | none | veryLow |
| Dua for Sleeping | 1 | none | low |
| Ayat Al Kursi | 1 | none | low |
| Last 2 Verses of Surah Baqarah | 2 | none | low |
| Recite the 3 Quls 3x | 2 | none | low |
| Surah Kafiroon | 1 | none | low |
| Recite Surah Al-Mulk | 5 | none | medium |
| Read the meaning of Surah Al-Mulk | 5 | none | medium |
| SubhanAllah 33x, Alhamdulillah 33x, Allahu Akbar 34x | 3 | none | low |
| Shahadah | 1 | none | veryLow |
| Sleep | — | none | veryLow |

---

## Shared Blocks

### Exert

| Property | Value |
|---|---|
| Anchor | filler |
| Duration | 0 (auto-fills) |
| Color | blue |

| Action | Duration | Phase | Difficulty |
|---|---|---|---|
| Exert / Relax / Nap | — | none | medium |

### Wife

| Property | Value |
|---|---|
| Anchor | fixedTime(0, 0) — auto-chain |
| Duration | 90 min |
| Color | red |

| Action | Duration | Phase | Difficulty |
|---|---|---|---|
| Hangout w/ Wife | 90 | none | low |

### Jumu'ah

| Property | Value |
|---|---|
| Anchor | iqamahTime(Jumu'ah, offset: 0) |
| Duration | 75 min |
| Color | orange |

| Action | Duration | Phase | Difficulty |
|---|---|---|---|
| Walk to Masjid early | 7 | preAnchor | high |
| Jumu'ah prayer + Khutbah | 60 | anchor | low |
| Walk Home | 7 | postAnchor | high |

### Qaylulah (Nap)

| Property | Value |
|---|---|
| Anchor | fixedTime(0, 0) — auto-chain |
| Duration | 90 min |
| Color | teal |

| Action | Duration | Phase | Difficulty |
|---|---|---|---|
| Nap for 90 min (one full sleep cycle) | 90 | none | veryLow |

---

## Default Routines

### Baseline

**Description:** Absolute Basics only — start here
**Suggested weekdays:** 1 (Sun), 7 (Sat)

**Block sequence:**
1. Fajr (Baseline)
2. Post-Fajr (WFH)
3. Exert
4. Dhuhr (Baseline)
5. Exert
6. Asr (Baseline)
7. Exert
8. Maghrib (Baseline)
9. Wife
10. Isha (Baseline)
11. Night Routine (Baseline)

### WFH

**Description:** Work from home — prayers at masjid, full add-ons
**Suggested weekdays:** 3 (Tue), 5 (Thu)

**Block sequence:**
1. Pre-Fajr
2. Fajr
3. Post-Fajr (WFH)
4. Exert
5. Dhuhr (Home)
6. Exert
7. Asr (Home)
8. Exert
9. Maghrib
10. Wife
11. Isha
12. Night Routine

### In-Office

**Description:** Office days — commute, prayers at office
**Suggested weekdays:** 2 (Mon), 4 (Wed)

**Block sequence:**
1. Pre-Fajr
2. Fajr
3. Post-Fajr (Office)
4. Exert
5. Dhuhr (Office)
6. Exert
7. Asr (Office)
8. Exert
9. Maghrib
10. Wife
11. Isha
12. Night Routine

### Jumu'ah

**Description:** Friday — Jumu'ah replaces Dhuhr
**Suggested weekdays:** 6 (Fri)

**Block sequence:**
1. Pre-Fajr
2. Fajr
3. Post-Fajr (WFH)
4. Exert
5. Jumu'ah
6. Exert
7. Asr (Home)
8. Exert
9. Maghrib
10. Wife
11. Isha
12. Night Routine

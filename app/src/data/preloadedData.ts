import type { BlockTemplate, RoutineTemplate, ActionItem } from '../types';
import {
  AnchorPhase,
  TaskDifficulty,
  PrayerTime,
  createBlockTemplate,
  createActionItem,
  createRoutineTemplate,
} from '../types';

function action(
  title: string,
  durationMinutes: number | null,
  anchorPhase: AnchorPhase = AnchorPhase.None,
  difficulty: TaskDifficulty = TaskDifficulty.Low
): ActionItem {
  return createActionItem({ title, durationMinutes, anchorPhase, difficulty });
}

// ─── Baseline Blocks ────────────────────────────────────

const fajrBaseline = createBlockTemplate({
  name: 'Fajr (Baseline)',
  anchor: { type: 'prayerTime', prayer: PrayerTime.Fajr, offsetMinutes: -5 },
  overallDurationMinutes: 20,
  colorTag: 'indigo',
  actions: [
    action('Wash Face', 2, AnchorPhase.PreAnchor, TaskDifficulty.VeryLow),
    action('Brush Teeth', 2, AnchorPhase.PreAnchor, TaskDifficulty.VeryLow),
    action('Pray 2 Rakah Sunnah for Fajr', 3, AnchorPhase.PreAnchor, TaskDifficulty.VeryLow),
    action('Pray Fajr', 10, AnchorPhase.Anchor, TaskDifficulty.Low),
  ],
});

const postFajrWFH = createBlockTemplate({
  name: 'Post-Fajr (WFH)',
  anchor: { type: 'fixedTime', hour: 0, minute: 0 },
  overallDurationMinutes: 90,
  colorTag: 'indigo',
  actions: [
    action('Exercise', 60, AnchorPhase.None, TaskDifficulty.Medium),
    action('Shower', 10, AnchorPhase.None, TaskDifficulty.VeryLow),
    action('Journal', 20, AnchorPhase.None, TaskDifficulty.Low),
  ],
});

const postFajrOffice = createBlockTemplate({
  name: 'Post-Fajr (Office)',
  anchor: { type: 'fixedTime', hour: 0, minute: 0 },
  overallDurationMinutes: 60,
  colorTag: 'indigo',
  actions: [
    action('Shower', 10, AnchorPhase.None, TaskDifficulty.VeryLow),
    action('Journal', 20, AnchorPhase.None, TaskDifficulty.Low),
    action('Commute to Office', 30, AnchorPhase.None, TaskDifficulty.VeryLow),
  ],
});

const dhuhrBaseline = createBlockTemplate({
  name: 'Dhuhr (Baseline)',
  anchor: { type: 'prayerTime', prayer: PrayerTime.Dhuhr, offsetMinutes: -3 },
  overallDurationMinutes: 15,
  colorTag: 'orange',
  actions: [
    action('Make Wudu', 3, AnchorPhase.PreAnchor, TaskDifficulty.VeryLow),
    action('Pray Dhuhr', 10, AnchorPhase.Anchor, TaskDifficulty.Low),
  ],
});

const asrBaseline = createBlockTemplate({
  name: 'Asr (Baseline)',
  anchor: { type: 'prayerTime', prayer: PrayerTime.Asr, offsetMinutes: -3 },
  overallDurationMinutes: 15,
  colorTag: 'yellow',
  actions: [
    action('Make Wudu', 3, AnchorPhase.PreAnchor, TaskDifficulty.VeryLow),
    action('Pray Asr', 10, AnchorPhase.Anchor, TaskDifficulty.Low),
  ],
});

const maghribBaseline = createBlockTemplate({
  name: 'Maghrib (Baseline)',
  anchor: { type: 'prayerTime', prayer: PrayerTime.Maghrib, offsetMinutes: -3 },
  overallDurationMinutes: 15,
  colorTag: 'pink',
  actions: [
    action('Make Wudu', 3, AnchorPhase.PreAnchor, TaskDifficulty.VeryLow),
    action('Pray Maghrib', 10, AnchorPhase.Anchor, TaskDifficulty.Low),
  ],
});

const ishaBaseline = createBlockTemplate({
  name: 'Isha (Baseline)',
  anchor: { type: 'prayerTime', prayer: PrayerTime.Isha, offsetMinutes: -3 },
  overallDurationMinutes: 20,
  colorTag: 'purple',
  actions: [
    action('Make Wudu', 3, AnchorPhase.PreAnchor, TaskDifficulty.VeryLow),
    action('Pray Isha', 10, AnchorPhase.Anchor, TaskDifficulty.Low),
    action('Pray Witr', 5, AnchorPhase.PostAnchor, TaskDifficulty.Low),
  ],
});

const nightBaseline = createBlockTemplate({
  name: 'Night Routine (Baseline)',
  anchor: { type: 'fixedTime', hour: 0, minute: 0 },
  overallDurationMinutes: 10,
  colorTag: 'gray',
  actions: [
    action('Wash Face', 2, AnchorPhase.None, TaskDifficulty.VeryLow),
    action('Brush Teeth', 2, AnchorPhase.None, TaskDifficulty.VeryLow),
    action('Floss', 2, AnchorPhase.None, TaskDifficulty.VeryLow),
    action('Sleep', null, AnchorPhase.None, TaskDifficulty.VeryLow),
  ],
});

// ─── Full Blocks ─────────────────────────────────────────

const preFajr = createBlockTemplate({
  name: 'Pre-Fajr',
  anchor: { type: 'prayerTime', prayer: PrayerTime.Fajr, offsetMinutes: -30 },
  overallDurationMinutes: 25,
  colorTag: 'indigo',
  actions: [
    action('Pray Tahajjud', 25, AnchorPhase.None, TaskDifficulty.VeryHigh),
  ],
});

const fajrFull = createBlockTemplate({
  name: 'Fajr',
  anchor: { type: 'iqamahTime', prayer: PrayerTime.Fajr, offsetMinutes: 0 },
  overallDurationMinutes: 110,
  earlyNotificationMinutes: 5,
  colorTag: 'indigo',
  actions: [
    action('Dua for Waking up', 1, AnchorPhase.PreAnchor, TaskDifficulty.Low),
    action('Look at Sky', 1, AnchorPhase.PreAnchor, TaskDifficulty.Low),
    action('First 10 verses of Surah Imran', 3, AnchorPhase.PreAnchor, TaskDifficulty.Low),
    action('Wash Face', 2, AnchorPhase.PreAnchor, TaskDifficulty.VeryLow),
    action('Brush Teeth', 2, AnchorPhase.PreAnchor, TaskDifficulty.VeryLow),
    action('Walk to Masjid', 7, AnchorPhase.PreAnchor, TaskDifficulty.High),
    action('Pray 2 Rakah Sunnah for Fajr', 3, AnchorPhase.PreAnchor, TaskDifficulty.VeryLow),
    action('Pray Fajr', 10, AnchorPhase.Anchor, TaskDifficulty.Low),
    action('Adhkar After Salah', 2, AnchorPhase.PostAnchor, TaskDifficulty.VeryLow),
    action('Morning Adhkar', 10, AnchorPhase.PostAnchor, TaskDifficulty.Low),
    action('Memorize Quran', 35, AnchorPhase.PostAnchor, TaskDifficulty.High),
    action('Revise Quran', 25, AnchorPhase.PostAnchor, TaskDifficulty.Medium),
    action('Walk Home from Masjid', 7, AnchorPhase.PostAnchor, TaskDifficulty.High),
  ],
});

const dhuhrHome = createBlockTemplate({
  name: 'Dhuhr (Home)',
  anchor: { type: 'iqamahTime', prayer: PrayerTime.Dhuhr, offsetMinutes: 0 },
  overallDurationMinutes: 50,
  colorTag: 'orange',
  actions: [
    action('Pray 2 Rakah Sunnah for Dhuhr Before', 3, AnchorPhase.PreAnchor, TaskDifficulty.VeryLow),
    action('Pray 2 Rakah extra Sunnah for Dhuhr Before', 3, AnchorPhase.PreAnchor, TaskDifficulty.Low),
    action('Walk to Masjid', 7, AnchorPhase.PreAnchor, TaskDifficulty.High),
    action('Pray Dhuhr', 10, AnchorPhase.Anchor, TaskDifficulty.Low),
    action('Pray 2 Rakah Sunnah for Dhuhr After', 3, AnchorPhase.PostAnchor, TaskDifficulty.VeryLow),
    action('Adhkar After Salah', 2, AnchorPhase.PostAnchor, TaskDifficulty.VeryLow),
    action('Read Translation / Tafsir', 12, AnchorPhase.PostAnchor, TaskDifficulty.Medium),
    action('Walk Home from Masjid', 7, AnchorPhase.PostAnchor, TaskDifficulty.High),
  ],
});

const dhuhrOffice = createBlockTemplate({
  name: 'Dhuhr (Office)',
  anchor: { type: 'prayerTime', prayer: PrayerTime.Dhuhr, offsetMinutes: 0 },
  overallDurationMinutes: 35,
  colorTag: 'orange',
  actions: [
    action('Make Wudu', 3, AnchorPhase.PreAnchor, TaskDifficulty.VeryLow),
    action('Pray 2 Rakah Sunnah for Dhuhr Before', 3, AnchorPhase.PreAnchor, TaskDifficulty.VeryLow),
    action('Pray 2 Rakah extra Sunnah for Dhuhr Before', 3, AnchorPhase.PreAnchor, TaskDifficulty.Low),
    action('Pray Dhuhr', 10, AnchorPhase.Anchor, TaskDifficulty.Low),
    action('Pray 2 Rakah Sunnah for Dhuhr After', 3, AnchorPhase.PostAnchor, TaskDifficulty.VeryLow),
    action('Adhkar After Salah', 2, AnchorPhase.PostAnchor, TaskDifficulty.VeryLow),
    action('Read Translation / Tafsir', 12, AnchorPhase.PostAnchor, TaskDifficulty.Medium),
  ],
});

const asrHome = createBlockTemplate({
  name: 'Asr (Home)',
  anchor: { type: 'iqamahTime', prayer: PrayerTime.Asr, offsetMinutes: 0 },
  overallDurationMinutes: 50,
  colorTag: 'yellow',
  actions: [
    action('Walk to Masjid', 7, AnchorPhase.PreAnchor, TaskDifficulty.High),
    action('Pray Asr', 10, AnchorPhase.Anchor, TaskDifficulty.Low),
    action('Adhkar After Salah', 2, AnchorPhase.PostAnchor, TaskDifficulty.VeryLow),
    action('Evening Adhkar', 10, AnchorPhase.PostAnchor, TaskDifficulty.Low),
    action('Read Translation / Tafsir', 12, AnchorPhase.PostAnchor, TaskDifficulty.Medium),
    action('Walk Home from Masjid', 7, AnchorPhase.PostAnchor, TaskDifficulty.High),
  ],
});

const asrOffice = createBlockTemplate({
  name: 'Asr (Office)',
  anchor: { type: 'prayerTime', prayer: PrayerTime.Asr, offsetMinutes: 0 },
  overallDurationMinutes: 65,
  colorTag: 'yellow',
  actions: [
    action('Make Wudu', 3, AnchorPhase.PreAnchor, TaskDifficulty.VeryLow),
    action('Pray Asr', 10, AnchorPhase.Anchor, TaskDifficulty.Low),
    action('Adhkar After Salah', 2, AnchorPhase.PostAnchor, TaskDifficulty.VeryLow),
    action('Evening Adhkar', 10, AnchorPhase.PostAnchor, TaskDifficulty.Low),
    action('Read Translation / Tafsir', 12, AnchorPhase.PostAnchor, TaskDifficulty.Medium),
    action('Commute Home', 30, AnchorPhase.PostAnchor, TaskDifficulty.VeryLow),
  ],
});

const maghribFull = createBlockTemplate({
  name: 'Maghrib',
  anchor: { type: 'iqamahTime', prayer: PrayerTime.Maghrib, offsetMinutes: 0 },
  overallDurationMinutes: 45,
  colorTag: 'pink',
  actions: [
    action('Walk to Masjid', 7, AnchorPhase.PreAnchor, TaskDifficulty.High),
    action('Pray Maghrib', 10, AnchorPhase.Anchor, TaskDifficulty.Low),
    action('Pray 2 Rakah Sunnah for Maghrib After', 3, AnchorPhase.PostAnchor, TaskDifficulty.VeryLow),
    action('Pray 2 Rakah extra Sunnah for Maghrib After', 3, AnchorPhase.PostAnchor, TaskDifficulty.Low),
    action('Read Quran for 15 minutes', 15, AnchorPhase.PostAnchor, TaskDifficulty.Medium),
    action('Walk Home from Masjid', 7, AnchorPhase.PostAnchor, TaskDifficulty.High),
  ],
});

const ishaFull = createBlockTemplate({
  name: 'Isha',
  anchor: { type: 'iqamahTime', prayer: PrayerTime.Isha, offsetMinutes: 0 },
  overallDurationMinutes: 50,
  colorTag: 'purple',
  actions: [
    action('Walk to Masjid', 7, AnchorPhase.PreAnchor, TaskDifficulty.Medium),
    action('Pray Isha', 10, AnchorPhase.Anchor, TaskDifficulty.Low),
    action('Pray 2 Rakah Sunnah for Isha After', 3, AnchorPhase.PostAnchor, TaskDifficulty.VeryLow),
    action('Pray 2 Rakah extra Sunnah for Isha After', 3, AnchorPhase.PostAnchor, TaskDifficulty.Low),
    action('Read Translation / Tafsir', 12, AnchorPhase.PostAnchor, TaskDifficulty.Medium),
    action('Walk Home from Masjid', 7, AnchorPhase.PostAnchor, TaskDifficulty.Medium),
    action('Pray Witr', 5, AnchorPhase.PostAnchor, TaskDifficulty.Low),
  ],
});

const nightFull = createBlockTemplate({
  name: 'Night Routine',
  anchor: { type: 'fixedTime', hour: 0, minute: 0 },
  overallDurationMinutes: 35,
  colorTag: 'gray',
  actions: [
    action('Wash Face', 2, AnchorPhase.None, TaskDifficulty.VeryLow),
    action('Brush Teeth', 2, AnchorPhase.None, TaskDifficulty.VeryLow),
    action('Floss', 2, AnchorPhase.None, TaskDifficulty.VeryLow),
    action('Use Tretinoin', 1, AnchorPhase.None, TaskDifficulty.VeryLow),
    action('Bedtime wudu', 3, AnchorPhase.None, TaskDifficulty.Low),
    action('Dust of the bed', 1, AnchorPhase.None, TaskDifficulty.VeryLow),
    action('Dua for Sleeping', 1, AnchorPhase.None, TaskDifficulty.Low),
    action('Ayat Al Kursi', 1, AnchorPhase.None, TaskDifficulty.Low),
    action('Last 2 Verses of Surah Baqarah', 2, AnchorPhase.None, TaskDifficulty.Low),
    action('Recite the 3 Quls 3x', 2, AnchorPhase.None, TaskDifficulty.Low),
    action('Surah Kafiroon', 1, AnchorPhase.None, TaskDifficulty.Low),
    action('Recite Surah Al-Mulk', 5, AnchorPhase.None, TaskDifficulty.Medium),
    action('Read the meaning of Surah Al-Mulk', 5, AnchorPhase.None, TaskDifficulty.Medium),
    action('SubhanAllah 33x, Alhamdulillah 33x, Allahu Akbar 34x', 3, AnchorPhase.None, TaskDifficulty.Low),
    action('Shahadah', 1, AnchorPhase.None, TaskDifficulty.VeryLow),
    action('Sleep', null, AnchorPhase.None, TaskDifficulty.VeryLow),
  ],
});

// ─── Shared Blocks ───────────────────────────────────────

const exert = createBlockTemplate({
  name: 'Exert',
  anchor: { type: 'filler' },
  colorTag: 'blue',
  actions: [
    action('Exert / Relax / Nap', null, AnchorPhase.None, TaskDifficulty.Medium),
  ],
});

const wife = createBlockTemplate({
  name: 'Wife',
  anchor: { type: 'fixedTime', hour: 0, minute: 0 },
  overallDurationMinutes: 90,
  colorTag: 'red',
  actions: [
    action('Hangout w/ Wife', 90, AnchorPhase.None, TaskDifficulty.Low),
  ],
});

const jumuah = createBlockTemplate({
  name: "Jumu'ah",
  anchor: { type: 'iqamahTime', prayer: PrayerTime.Jumuah, offsetMinutes: 0 },
  overallDurationMinutes: 75,
  colorTag: 'orange',
  actions: [
    action('Walk to Masjid early', 7, AnchorPhase.PreAnchor, TaskDifficulty.High),
    action("Jumu'ah prayer + Khutbah", 60, AnchorPhase.Anchor, TaskDifficulty.Low),
    action('Walk Home', 7, AnchorPhase.PostAnchor, TaskDifficulty.High),
  ],
});

const qaylulah = createBlockTemplate({
  name: 'Qaylulah (Nap)',
  anchor: { type: 'fixedTime', hour: 0, minute: 0 },
  overallDurationMinutes: 90,
  colorTag: 'teal',
  actions: [
    action('Nap for 90 min (one full sleep cycle)', 90, AnchorPhase.None, TaskDifficulty.VeryLow),
  ],
});

// ─── All Default Blocks ──────────────────────────────────

export const defaultBlocks: BlockTemplate[] = [
  preFajr,
  fajrBaseline,
  fajrFull,
  postFajrWFH,
  postFajrOffice,
  dhuhrBaseline,
  dhuhrHome,
  dhuhrOffice,
  asrBaseline,
  asrHome,
  asrOffice,
  maghribBaseline,
  maghribFull,
  ishaBaseline,
  ishaFull,
  nightBaseline,
  nightFull,
  exert,
  wife,
  jumuah,
  qaylulah,
];

// ─── Default Routines ────────────────────────────────────

function blockIdByName(name: string): string {
  const b = defaultBlocks.find((bl) => bl.name === name);
  return b ? b.id : '';
}

export function defaultRoutines(): RoutineTemplate[] {
  return [
    createRoutineTemplate({
      name: 'Baseline',
      description: 'Absolute Basics only — start here',
      suggestedWeekdays: [1, 7],
      blockIDs: [
        blockIdByName('Fajr (Baseline)'),
        blockIdByName('Post-Fajr (WFH)'),
        blockIdByName('Exert'),
        blockIdByName('Dhuhr (Baseline)'),
        blockIdByName('Exert'),
        blockIdByName('Asr (Baseline)'),
        blockIdByName('Exert'),
        blockIdByName('Maghrib (Baseline)'),
        blockIdByName('Wife'),
        blockIdByName('Isha (Baseline)'),
        blockIdByName('Night Routine (Baseline)'),
      ],
    }),
    createRoutineTemplate({
      name: 'WFH',
      description: 'Work from home — prayers at masjid, full add-ons',
      suggestedWeekdays: [3, 5],
      blockIDs: [
        blockIdByName('Pre-Fajr'),
        blockIdByName('Fajr'),
        blockIdByName('Post-Fajr (WFH)'),
        blockIdByName('Exert'),
        blockIdByName('Dhuhr (Home)'),
        blockIdByName('Exert'),
        blockIdByName('Asr (Home)'),
        blockIdByName('Exert'),
        blockIdByName('Maghrib'),
        blockIdByName('Wife'),
        blockIdByName('Isha'),
        blockIdByName('Night Routine'),
      ],
    }),
    createRoutineTemplate({
      name: 'In-Office',
      description: 'Office days — commute, prayers at office',
      suggestedWeekdays: [2, 4],
      blockIDs: [
        blockIdByName('Pre-Fajr'),
        blockIdByName('Fajr'),
        blockIdByName('Post-Fajr (Office)'),
        blockIdByName('Exert'),
        blockIdByName('Dhuhr (Office)'),
        blockIdByName('Exert'),
        blockIdByName('Asr (Office)'),
        blockIdByName('Exert'),
        blockIdByName('Maghrib'),
        blockIdByName('Wife'),
        blockIdByName('Isha'),
        blockIdByName('Night Routine'),
      ],
    }),
    createRoutineTemplate({
      name: "Jumu'ah",
      description: "Friday — Jumu'ah replaces Dhuhr",
      suggestedWeekdays: [6],
      blockIDs: [
        blockIdByName('Pre-Fajr'),
        blockIdByName('Fajr'),
        blockIdByName('Post-Fajr (WFH)'),
        blockIdByName('Exert'),
        blockIdByName("Jumu'ah"),
        blockIdByName('Exert'),
        blockIdByName('Asr (Home)'),
        blockIdByName('Exert'),
        blockIdByName('Maghrib'),
        blockIdByName('Wife'),
        blockIdByName('Isha'),
        blockIdByName('Night Routine'),
      ],
    }),
  ];
}

import type { AladhanTimings, AladhanResponse } from '../types';
import { PrayerTime, apiPrayer } from '../types';
import { format } from 'date-fns';

const cache: Record<string, AladhanTimings> = {};

export async function fetchPrayerTimes(
  city: string,
  date: Date,
  country = 'United States'
): Promise<AladhanTimings> {
  const dateStr = format(date, 'dd-MM-yyyy');
  const key = `${city.toLowerCase()}-${dateStr}`;

  if (cache[key]) return cache[key];

  const params = new URLSearchParams({
    city,
    country,
    method: '2',
    adjustment: '1',
  });

  const url = `https://api.aladhan.com/v1/timingsByCity/${dateStr}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Prayer times API error: ${res.status}`);

  const json: AladhanResponse = await res.json();
  const timings = json.data.timings;
  cache[key] = timings;
  return timings;
}

export function timingsDateFor(
  timings: AladhanTimings,
  prayer: PrayerTime,
  date: Date
): Date | null {
  const mapped = apiPrayer(prayer);
  const timeStr = timings[mapped as keyof AladhanTimings];
  if (!timeStr) return null;
  const clean = timeStr.split(' ')[0];
  const [h, m] = clean.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

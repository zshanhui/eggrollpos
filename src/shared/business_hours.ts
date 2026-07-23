import { formatInTimeZone } from 'date-fns-tz';

export type DayHours = { open: string | null; close: string | null };

/** HH:MM keys for each weekday (Sunday–Saturday). */
export type BusinessHours = Partial<Record<
  'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat',
  DayHours
>>;

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export const DEFAULT_TIMEZONE = 'UTC';

function isOpenAt(hours: DayHours | undefined, localTime: string): boolean {
  if (!hours || hours.open === null || hours.close === null) return false;
  if (hours.open <= hours.close) {
    return localTime >= hours.open && localTime < hours.close;
  }
  // Overnight window on the starting day (e.g. 22:00 – 02:00)
  return localTime >= hours.open || localTime < hours.close;
}

/**
 * Whether the menu is open at `now` for the given business hours.
 *
 * Hours are treated as wall-clock times in `timezone` (IANA), matching what
 * merchants enter in the admin UI. When `businessHours` is null/undefined,
 * the menu is considered always open.
 *
 * Overnight ranges also cover early morning on the following calendar day
 * (e.g. Fri 22:00–02:00 keeps the menu open at Sat 01:00).
 */
export function computeCurrentlyOpen(
  businessHours: BusinessHours | null | undefined,
  timezone: string | null | undefined = DEFAULT_TIMEZONE,
  now: Date = new Date()
): boolean {
  if (!businessHours) return true;

  const tz = timezone && timezone.trim() ? timezone.trim() : DEFAULT_TIMEZONE;

  let localTime: string;
  let dayIndex: number;
  try {
    localTime = formatInTimeZone(now, tz, 'HH:mm');
    // date-fns 'i' = ISO day of week (1=Mon … 7=Sun)
    const isoDay = Number(formatInTimeZone(now, tz, 'i'));
    dayIndex = isoDay === 7 ? 0 : isoDay;
  } catch {
    localTime = formatInTimeZone(now, DEFAULT_TIMEZONE, 'HH:mm');
    const isoDay = Number(formatInTimeZone(now, DEFAULT_TIMEZONE, 'i'));
    dayIndex = isoDay === 7 ? 0 : isoDay;
  }

  const today = DAY_KEYS[dayIndex];
  if (isOpenAt(businessHours[today], localTime)) return true;

  // If still in the early-morning half of yesterday's overnight window
  const yesterday = DAY_KEYS[(dayIndex + 6) % 7];
  const prev = businessHours[yesterday];
  if (
    prev &&
    prev.open !== null &&
    prev.close !== null &&
    prev.open > prev.close &&
    localTime < prev.close
  ) {
    return true;
  }

  return false;
}

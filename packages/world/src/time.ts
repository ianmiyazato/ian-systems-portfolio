/** Maré runs on São Paulo time (UTC−3, no daylight saving in 2026). Sim time is epoch ms. */
export const MARE_OFFSET_MINUTES = -180;
export const MINUTE = 60_000;
export const DAY = 86_400_000;

/** The v0.1 artboards are all set at 16:18 on Sep 26, 2026; the world starts there by default. */
export const DEFAULT_START = Date.UTC(2026, 8, 26, 19, 18, 0);

export const localParts = (ms: number) => {
  const date = new Date(ms + MARE_OFFSET_MINUTES * MINUTE);
  return { hours: date.getUTCHours(), minutes: date.getUTCMinutes(), seconds: date.getUTCSeconds() };
};

const pad = (value: number) => String(value).padStart(2, '0');

/** "16:18" or "16:18:05" in Maré local time. */
export function clock(ms: number, seconds = false) {
  const { hours, minutes, seconds: secs } = localParts(ms);
  return seconds ? `${pad(hours)}:${pad(minutes)}:${pad(secs)}` : `${pad(hours)}:${pad(minutes)}`;
}

/** Fractional local hour, e.g. 16.3 for 16:18. */
export const localHour = (ms: number) => {
  const { hours, minutes, seconds } = localParts(ms);
  return hours + minutes / 60 + seconds / 3600;
};

/** Parse ?t=16:40 (Maré local, same day as the default start). */
export function parseLocalTime(value: string | null | undefined, day = DEFAULT_START): number | null {
  const match = value?.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  const offset = MARE_OFFSET_MINUTES * MINUTE;
  const midnight = Math.floor((day + offset) / DAY) * DAY - offset;
  return midnight + (Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3] ?? 0)) * 1000;
}

/** "3 s ago", "2 min ago" for freshness labels. */
export function ago(ms: number) {
  const seconds = Math.max(0, Math.round(ms / 1000));
  if (seconds < 60) return `${seconds} s ago`;
  const minutes = Math.round(seconds / 60);
  return minutes < 60 ? `${minutes} min ago` : `${Math.round(minutes / 60)} h ago`;
}

/** "14 min", "1 h 05 min", "5 d 1 h" for countdowns. */
export function duration(ms: number) {
  const total = Math.max(0, Math.round(ms / MINUTE));
  const days = Math.floor(total / 1440);
  const hours = Math.floor((total % 1440) / 60);
  const minutes = total % 60;
  if (days) return `${days} d ${hours} h`;
  return hours ? `${hours} h ${pad(minutes)} min` : `${minutes} min`;
}

/**
 * Traffic follows the day: a quiet night, a lunch peak around 12:30 and a bigger evening peak
 * around 20:10. The multiplier is ~0.8 at 16:18, ~1.5 at lunch and ~1.7 in the evening.
 */
export function dayCurve(hour: number) {
  const bump = (center: number, width: number, height: number) => height * Math.exp(-((hour - center) ** 2) / (2 * width ** 2));
  return 0.18 + bump(12.6, 1.1, 0.95) + bump(20.2, 1.6, 1.25) + bump(16, 3.5, 0.55);
}

import { format } from 'date-fns';
import { de } from 'date-fns/locale';

/**
 * Formats a duration in seconds as a compact German label, e.g. "25 Min" or
 * "1 Std 5 Min". Durations under a minute are shown in seconds.
 */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  if (seconds < 60) return `${seconds} Sek`;
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} Min`;
  if (minutes === 0) return `${hours} Std`;
  return `${hours} Std ${minutes} Min`;
}

/** Formats seconds as a `m:ss` (or `h:mm:ss`) countdown clock. */
export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (n: number): string => String(n).padStart(2, '0');
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(secs)}`;
  return `${minutes}:${pad(secs)}`;
}

/** Time-of-day greeting in German. */
export function greetingForHour(hour: number): string {
  if (hour >= 5 && hour < 11) return 'Guten Morgen';
  if (hour >= 11 && hour < 18) return 'Guten Tag';
  if (hour >= 18 && hour < 23) return 'Guten Abend';
  return 'Gute Nacht';
}

/** Long localised date, e.g. "Mittwoch, 22. Juli". */
export function formatLongDate(date: Date): string {
  return format(date, "EEEE, d. MMMM", { locale: de });
}

/** Short localised date, e.g. "22. Juli". */
export function formatShortDate(date: Date): string {
  return format(date, 'd. MMMM', { locale: de });
}

/** German pluralisation helper for simple count labels. */
export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

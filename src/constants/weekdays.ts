import type { Weekday, WeekStart } from '../types/common';

/** Short German weekday labels indexed by JS weekday (0 = Sunday). */
export const WEEKDAY_SHORT: Record<Weekday, string> = {
  0: 'So',
  1: 'Mo',
  2: 'Di',
  3: 'Mi',
  4: 'Do',
  5: 'Fr',
  6: 'Sa',
};

/** Full German weekday labels indexed by JS weekday (0 = Sunday). */
export const WEEKDAY_LONG: Record<Weekday, string> = {
  0: 'Sonntag',
  1: 'Montag',
  2: 'Dienstag',
  3: 'Mittwoch',
  4: 'Donnerstag',
  5: 'Freitag',
  6: 'Samstag',
};

/** Returns weekdays ordered from the user's chosen week start. */
export function orderedWeekdays(weekStartsOn: WeekStart): Weekday[] {
  const base: Weekday[] = [0, 1, 2, 3, 4, 5, 6];
  return base.map((d) => (((d + weekStartsOn) % 7) as Weekday));
}

/** Human-readable summary of selected weekdays, e.g. "Mo, Mi, Fr" or "Täglich". */
export function summariseWeekdays(weekdays: Weekday[], weekStartsOn: WeekStart): string {
  if (weekdays.length === 0) return 'Kein Zeitplan';
  if (weekdays.length === 7) return 'Täglich';
  const set = new Set(weekdays);
  const workdays: Weekday[] = [1, 2, 3, 4, 5];
  const weekend: Weekday[] = [0, 6];
  if (workdays.every((d) => set.has(d)) && weekend.every((d) => !set.has(d))) {
    return 'Wochentags';
  }
  if (weekend.every((d) => set.has(d)) && workdays.every((d) => !set.has(d))) {
    return 'Wochenende';
  }
  return orderedWeekdays(weekStartsOn)
    .filter((d) => set.has(d))
    .map((d) => WEEKDAY_SHORT[d])
    .join(', ');
}

/**
 * Weekday index aligned with JavaScript's `Date.getDay()` and date-fns:
 * 0 = Sunday … 6 = Saturday.
 */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAYS: readonly Weekday[] = [0, 1, 2, 3, 4, 5, 6];

/** First day of the week preference (date-fns compatible). */
export type WeekStart = 0 | 1;

/** Calendar day in `yyyy-MM-dd` form (no time, no timezone). */
export type ISODateString = string;

/** Full timestamp in ISO 8601 form. */
export type ISODateTimeString = string;

/** Wall-clock time of day in `HH:mm` (24h). */
export type TimeString = string;

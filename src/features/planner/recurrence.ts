import type { Routine } from '../../types/routine';
import type { ISODateString } from '../../types/common';
import { addDaysISO, weekdayOf } from '../../utils/datetime';

/**
 * Whether a routine recurs on a given calendar day according to its schedule
 * alone (ad-hoc per-day overrides are layered on separately by the planner).
 */
export function isRoutineScheduledOn(routine: Routine, dateISO: ISODateString): boolean {
  const { schedule } = routine;
  if (!schedule.enabled) return false;
  if (schedule.weekdays.length === 0) return false;
  if (dateISO < schedule.startDate) return false;
  if (schedule.endDate !== null && dateISO > schedule.endDate) return false;
  return schedule.weekdays.includes(weekdayOf(dateISO));
}

/**
 * Next calendar day (inclusive of `fromISO`) on which the routine recurs, or
 * `null` if it does not recur within `horizonDays`.
 */
export function nextOccurrence(
  routine: Routine,
  fromISO: ISODateString,
  horizonDays = 365,
): ISODateString | null {
  let cursor = fromISO;
  for (let i = 0; i <= horizonDays; i += 1) {
    if (isRoutineScheduledOn(routine, cursor)) return cursor;
    cursor = addDaysISO(cursor, 1);
  }
  return null;
}

/** All recurring occurrences within an inclusive [startISO, endISO] range. */
export function occurrencesInRange(
  routine: Routine,
  startISO: ISODateString,
  endISO: ISODateString,
): ISODateString[] {
  const results: ISODateString[] = [];
  let cursor = startISO;
  while (cursor <= endISO) {
    if (isRoutineScheduledOn(routine, cursor)) results.push(cursor);
    cursor = addDaysISO(cursor, 1);
  }
  return results;
}

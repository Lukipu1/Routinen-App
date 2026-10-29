import type { DayPlanIndex } from '../../database/dayPlansRepository';
import type { ISODateString, Weekday, WeekStart } from '../../types/common';
import type { RoutineCompletion } from '../../types/completion';
import type { PlanOverride } from '../../types/planning';
import type { Routine } from '../../types/routine';
import { addDaysISO, differenceInDaysISO, weekdayOf } from '../../utils/datetime';
import { isRoutineScheduledOn } from '../planner/recurrence';

/** Whether a day was met, missed, or had nothing required (neutral). */
type DayOutcome = 'success' | 'fail' | 'neutral';

/** Everything the statistics need to judge a day. */
export interface StatsInput {
  routines: Routine[];
  completions: RoutineCompletion[];
  overrides: PlanOverride[];
  /**
   * Snapshots of what was required on past days, written while those days
   * were "today". Past days with a snapshot are judged by it, so later edits to
   * a routine's schedule or active state never rewrite history. Days without
   * one (the app was not opened) fall back to the current schedule.
   */
  dayPlans?: DayPlanIndex;
  todayISO: ISODateString;
}

/** Routine ids that are *required* on a day according to the current schedule. */
export function requiredRoutineIdsFromSchedule(
  routines: Routine[],
  overrides: PlanOverride[],
  dateISO: ISODateString,
): Set<string> {
  const dayOverrides = overrides.filter((o) => o.date === dateISO);
  const excused = new Set(
    dayOverrides.filter((o) => o.paused || o.skipped).map((o) => o.routineId),
  );
  const added = new Set(dayOverrides.filter((o) => o.added).map((o) => o.routineId));
  const ids = new Set<string>();
  for (const routine of routines) {
    if (excused.has(routine.id)) continue;
    if ((routine.isActive && isRoutineScheduledOn(routine, dateISO)) || added.has(routine.id)) {
      ids.add(routine.id);
    }
  }
  return ids;
}

/**
 * Routine ids required on a day: the stored snapshot for a past day when one
 * exists, otherwise the live computation. Today is always computed live.
 */
export function requiredRoutineIdsForDay(
  input: StatsInput,
  dateISO: ISODateString,
): Set<string> {
  const snapshot = dateISO < input.todayISO ? input.dayPlans?.[dateISO] : undefined;
  if (snapshot) {
    const known = new Set(input.routines.map((r) => r.id));
    return new Set(snapshot.filter((id) => known.has(id)));
  }
  return requiredRoutineIdsFromSchedule(input.routines, input.overrides, dateISO);
}

function completedRoutineIdsForDay(
  completions: RoutineCompletion[],
  dateISO: ISODateString,
): Set<string> {
  return new Set(
    completions.filter((c) => c.date === dateISO && c.completed).map((c) => c.routineId),
  );
}

function dayOutcome(input: StatsInput, dateISO: ISODateString): DayOutcome {
  const required = requiredRoutineIdsForDay(input, dateISO);
  if (required.size === 0) return 'neutral';
  const done = completedRoutineIdsForDay(input.completions, dateISO);
  for (const id of required) {
    if (!done.has(id)) return 'fail';
  }
  return 'success';
}

/**
 * Current streak of successful days ending today. Days with nothing required
 * are neutral (they neither break nor extend it), and today counts only when
 * already met — an unfinished today never breaks the streak.
 */
export function computeCurrentStreak(input: StatsInput, horizonDays = 365): number {
  let streak = 0;
  let cursor = input.todayISO;
  for (let i = 0; i <= horizonDays; i += 1) {
    const outcome = dayOutcome(input, cursor);
    if (outcome === 'success') {
      streak += 1;
    } else if (outcome === 'fail') {
      if (cursor === input.todayISO) {
        // Today is still in progress — don't penalise it.
      } else {
        break;
      }
    }
    cursor = addDaysISO(cursor, -1);
  }
  return streak;
}

/** Longest run of successful days within [fromISO, todayISO]. */
export function computeLongestStreak(input: StatsInput, fromISO: ISODateString): number {
  if (fromISO > input.todayISO) return 0;
  const days = differenceInDaysISO(input.todayISO, fromISO);
  let run = 0;
  let longest = 0;
  let cursor = fromISO;
  for (let i = 0; i <= days; i += 1) {
    let outcome = dayOutcome(input, cursor);
    if (cursor === input.todayISO && outcome === 'fail') outcome = 'neutral';
    if (outcome === 'success') {
      run += 1;
      longest = Math.max(longest, run);
    } else if (outcome === 'fail') {
      run = 0;
    }
    cursor = addDaysISO(cursor, 1);
  }
  return longest;
}

export interface WeekDayStat {
  date: ISODateString;
  weekday: Weekday;
  plannedCount: number;
  completedCount: number;
  isToday: boolean;
  isFuture: boolean;
}

/** Start-of-week calendar day for the given day and week-start preference. */
export function startOfWeekISO(dateISO: ISODateString, weekStartsOn: WeekStart): ISODateString {
  const weekday = weekdayOf(dateISO);
  const diff = (weekday - weekStartsOn + 7) % 7;
  return addDaysISO(dateISO, -diff);
}

/** Seven-day overview for the week containing `todayISO`. */
export function weeklyOverview(input: StatsInput, weekStartsOn: WeekStart): WeekDayStat[] {
  const weekStart = startOfWeekISO(input.todayISO, weekStartsOn);
  const stats: WeekDayStat[] = [];
  for (let i = 0; i < 7; i += 1) {
    const date = addDaysISO(weekStart, i);
    const planned = requiredRoutineIdsForDay(input, date);
    const completed = completedRoutineIdsForDay(input.completions, date);
    let completedCount = 0;
    for (const id of planned) if (completed.has(id)) completedCount += 1;
    stats.push({
      date,
      weekday: weekdayOf(date),
      plannedCount: planned.size,
      completedCount,
      isToday: date === input.todayISO,
      isFuture: date > input.todayISO,
    });
  }
  return stats;
}

export interface OverallStats {
  successRate: number;
  completedThisWeek: number;
  currentStreak: number;
  longestStreak: number;
  averageDurationSeconds: number;
}

/** Average active duration across completed runs, in seconds. */
export function averageDurationSeconds(completions: RoutineCompletion[]): number {
  const finished = completions.filter((c) => c.completed);
  if (finished.length === 0) return 0;
  const total = finished.reduce((sum, c) => sum + c.durationInSeconds, 0);
  return Math.round(total / finished.length);
}

export interface RoutineStats {
  routineId: string;
  completionCount: number;
  /** Completed days ÷ days the routine was required (today only once done). */
  successRate: number;
  /** Days the routine was required within the window (today only once done). */
  requiredDays: number;
  averageDurationSeconds: number;
  lastCompletedDate: ISODateString | null;
}

/**
 * Per-routine statistics over the last `windowDays` days. The denominator is
 * the number of days the routine was actually required, so a routine done once
 * and then ignored for weeks no longer shows 100 %.
 */
export function routineStats(input: StatsInput, routine: Routine, windowDays = 90): RoutineStats {
  const records = input.completions.filter((c) => c.routineId === routine.id);
  const finished = records.filter((c) => c.completed);
  const completedDates = new Set(finished.map((c) => c.date));

  const from = addDaysISO(input.todayISO, -(windowDays - 1));
  const start = routine.schedule.startDate > from ? routine.schedule.startDate : from;
  let requiredDays = 0;
  let completedDays = 0;
  let cursor = start;
  while (cursor <= input.todayISO) {
    const required = requiredRoutineIdsForDay(input, cursor).has(routine.id);
    const done = completedDates.has(cursor);
    // Today is still open: it only counts once it is done.
    if (required && (cursor !== input.todayISO || done)) {
      requiredDays += 1;
      if (done) completedDays += 1;
    }
    cursor = addDaysISO(cursor, 1);
  }

  const avg =
    finished.length === 0
      ? 0
      : Math.round(finished.reduce((sum, c) => sum + c.durationInSeconds, 0) / finished.length);
  const lastCompleted = finished
    .map((c) => c.date)
    .sort()
    .at(-1);
  return {
    routineId: routine.id,
    completionCount: finished.length,
    successRate: requiredDays === 0 ? 0 : completedDays / requiredDays,
    requiredDays,
    averageDurationSeconds: avg,
    lastCompletedDate: lastCompleted ?? null,
  };
}

/** Aggregated headline statistics for the progress screen. */
export function computeOverallStats(input: StatsInput, weekStartsOn: WeekStart): OverallStats {
  const week = weeklyOverview(input, weekStartsOn);
  let planned = 0;
  let completed = 0;
  for (const day of week) {
    if (day.isFuture) continue;
    // Today's unfinished routines are not misses yet: count only what is done.
    planned += day.isToday ? day.completedCount : day.plannedCount;
    completed += day.completedCount;
  }
  const earliest = startOfWeekISO(addDaysISO(input.todayISO, -364), weekStartsOn);
  return {
    successRate: planned === 0 ? 0 : completed / planned,
    completedThisWeek: completed,
    currentStreak: computeCurrentStreak(input),
    longestStreak: computeLongestStreak(input, earliest),
    averageDurationSeconds: averageDurationSeconds(input.completions),
  };
}

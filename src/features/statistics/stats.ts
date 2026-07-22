import type { ISODateString, Weekday, WeekStart } from '../../types/common';
import type { RoutineCompletion } from '../../types/completion';
import type { PlanOverride } from '../../types/planning';
import type { Routine } from '../../types/routine';
import { addDaysISO, differenceInDaysISO, weekdayOf } from '../../utils/datetime';
import { isRoutineScheduledOn } from '../planner/recurrence';

/** Whether a day was met, missed, or had nothing required (neutral). */
type DayOutcome = 'success' | 'fail' | 'neutral';

/** Routine ids that are *required* on a day (scheduled/added, not excused). */
export function requiredRoutineIdsForDay(
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

function completedRoutineIdsForDay(
  completions: RoutineCompletion[],
  dateISO: ISODateString,
): Set<string> {
  return new Set(
    completions.filter((c) => c.date === dateISO && c.completed).map((c) => c.routineId),
  );
}

function dayOutcome(
  routines: Routine[],
  completions: RoutineCompletion[],
  overrides: PlanOverride[],
  dateISO: ISODateString,
): DayOutcome {
  const required = requiredRoutineIdsForDay(routines, overrides, dateISO);
  if (required.size === 0) return 'neutral';
  const done = completedRoutineIdsForDay(completions, dateISO);
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
export function computeCurrentStreak(
  routines: Routine[],
  completions: RoutineCompletion[],
  overrides: PlanOverride[],
  todayISO: ISODateString,
  horizonDays = 365,
): number {
  let streak = 0;
  let cursor = todayISO;
  for (let i = 0; i <= horizonDays; i += 1) {
    const outcome = dayOutcome(routines, completions, overrides, cursor);
    if (outcome === 'success') {
      streak += 1;
    } else if (outcome === 'fail') {
      if (cursor === todayISO) {
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
export function computeLongestStreak(
  routines: Routine[],
  completions: RoutineCompletion[],
  overrides: PlanOverride[],
  fromISO: ISODateString,
  todayISO: ISODateString,
): number {
  if (fromISO > todayISO) return 0;
  const days = differenceInDaysISO(todayISO, fromISO);
  let run = 0;
  let longest = 0;
  let cursor = fromISO;
  for (let i = 0; i <= days; i += 1) {
    let outcome = dayOutcome(routines, completions, overrides, cursor);
    if (cursor === todayISO && outcome === 'fail') outcome = 'neutral';
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
export function weeklyOverview(
  routines: Routine[],
  completions: RoutineCompletion[],
  overrides: PlanOverride[],
  todayISO: ISODateString,
  weekStartsOn: WeekStart,
): WeekDayStat[] {
  const weekStart = startOfWeekISO(todayISO, weekStartsOn);
  const stats: WeekDayStat[] = [];
  for (let i = 0; i < 7; i += 1) {
    const date = addDaysISO(weekStart, i);
    const planned = requiredRoutineIdsForDay(routines, overrides, date);
    const completed = completedRoutineIdsForDay(completions, date);
    let completedCount = 0;
    for (const id of planned) if (completed.has(id)) completedCount += 1;
    stats.push({
      date,
      weekday: weekdayOf(date),
      plannedCount: planned.size,
      completedCount,
      isToday: date === todayISO,
      isFuture: date > todayISO,
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

/** Average actual duration across completed runs, in seconds. */
export function averageDurationSeconds(completions: RoutineCompletion[]): number {
  const finished = completions.filter((c) => c.completed);
  if (finished.length === 0) return 0;
  const total = finished.reduce((sum, c) => sum + c.durationInSeconds, 0);
  return Math.round(total / finished.length);
}

export interface RoutineStats {
  routineId: string;
  completionCount: number;
  successRate: number;
  averageDurationSeconds: number;
  lastCompletedDate: ISODateString | null;
}

/** Per-routine completion statistics over all recorded runs. */
export function routineStats(routineId: string, completions: RoutineCompletion[]): RoutineStats {
  const records = completions.filter((c) => c.routineId === routineId);
  const finished = records.filter((c) => c.completed);
  const avg =
    finished.length === 0
      ? 0
      : Math.round(finished.reduce((sum, c) => sum + c.durationInSeconds, 0) / finished.length);
  const lastCompleted = finished
    .map((c) => c.date)
    .sort()
    .at(-1);
  return {
    routineId,
    completionCount: finished.length,
    successRate: records.length === 0 ? 0 : finished.length / records.length,
    averageDurationSeconds: avg,
    lastCompletedDate: lastCompleted ?? null,
  };
}

/** Aggregated headline statistics for the progress screen. */
export function computeOverallStats(
  routines: Routine[],
  completions: RoutineCompletion[],
  overrides: PlanOverride[],
  todayISO: ISODateString,
  weekStartsOn: WeekStart,
): OverallStats {
  const week = weeklyOverview(routines, completions, overrides, todayISO, weekStartsOn);
  const past = week.filter((d) => !d.isFuture);
  const planned = past.reduce((sum, d) => sum + d.plannedCount, 0);
  const completed = past.reduce((sum, d) => sum + d.completedCount, 0);
  const earliest = startOfWeekISO(addDaysISO(todayISO, -364), weekStartsOn);
  return {
    successRate: planned === 0 ? 0 : completed / planned,
    completedThisWeek: completed,
    currentStreak: computeCurrentStreak(routines, completions, overrides, todayISO),
    longestStreak: computeLongestStreak(routines, completions, overrides, earliest, todayISO),
    averageDurationSeconds: averageDurationSeconds(completions),
  };
}

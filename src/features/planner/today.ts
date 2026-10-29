import type { ISODateString } from '../../types/common';
import type { RoutineCompletion } from '../../types/completion';
import type { RoutineExecution } from '../../types/execution';
import type { PlanOverride, PlannedRoutine } from '../../types/planning';
import type { Routine } from '../../types/routine';
import type { TimelineStatus } from '../../types/status';
import { combineDateAndTime, todayISO } from '../../utils/datetime';
import { isRoutineScheduledOn } from './recurrence';

export interface BuildDayInput {
  routines: Routine[];
  dateISO: ISODateString;
  overrides: PlanOverride[];
  executions: RoutineExecution[];
  completions: RoutineCompletion[];
  now: Date;
}

/** Late-day flexible/timed routines sort after all timed ones. */
const FLEXIBLE_SORT_KEY = '99:99';

/**
 * How long after its slot (start + estimated duration) a routine stays "Jetzt"
 * before it turns "Überfällig". It can still be caught up on at any time.
 */
export const OVERDUE_GRACE_MS = 60 * 60 * 1000;

function findOverride(overrides: PlanOverride[], routineId: string): PlanOverride | undefined {
  return overrides.find((o) => o.routineId === routineId);
}

function findExecution(
  executions: RoutineExecution[],
  routineId: string,
): RoutineExecution | null {
  // Prefer an unfinished run, otherwise the most recent one.
  const forRoutine = executions.filter((e) => e.routineId === routineId);
  const live = forRoutine.find((e) => e.status === 'active' || e.status === 'paused');
  if (live) return live;
  return forRoutine.length > 0 ? (forRoutine[forRoutine.length - 1] ?? null) : null;
}

function findCompletion(
  completions: RoutineCompletion[],
  routineId: string,
): RoutineCompletion | null {
  return completions.find((c) => c.routineId === routineId) ?? null;
}

/**
 * Determines how a routine should appear on a day's timeline, combining
 * execution state, recorded completion, per-day overrides and clock time.
 */
export function computeTimelineStatus(params: {
  dateISO: ISODateString;
  startTime: string | null;
  estimatedDuration: number;
  override: PlanOverride | undefined;
  execution: RoutineExecution | null;
  completion: RoutineCompletion | null;
  now: Date;
}): TimelineStatus {
  const { dateISO, startTime, estimatedDuration, override, execution, completion, now } = params;

  if (execution?.status === 'active') return 'active';
  if (execution?.status === 'paused') return 'paused';
  if (execution?.status === 'completed' && completion?.completed !== false) return 'completed';
  if (execution?.status === 'abandoned') return 'abandoned';

  if (completion) return completion.completed ? 'completed' : 'abandoned';
  if (override?.skipped || override?.paused) return 'skipped';

  const today = todayISO(now);
  if (dateISO < today) return 'missed';
  if (dateISO > today) return 'planned';

  // Today, not yet acted on.
  if (startTime === null) return 'ready';
  const start = combineDateAndTime(dateISO, startTime).getTime();
  if (now.getTime() < start) return 'planned';
  const slotEnd = start + estimatedDuration * 1000 + OVERDUE_GRACE_MS;
  return now.getTime() >= slotEnd ? 'overdue' : 'ready';
}

/** Builds the ordered timeline of routines for a specific day. */
export function buildPlannedRoutines(input: BuildDayInput): PlannedRoutine[] {
  const { routines, dateISO, overrides, executions, completions, now } = input;
  const planned: PlannedRoutine[] = [];

  for (const routine of routines) {
    const override = findOverride(overrides, routine.id);
    const recurs = routine.isActive && isRoutineScheduledOn(routine, dateISO);
    const added = override?.added ?? false;
    if (!recurs && !added) continue;

    const startTime = override?.startTimeOverride ?? routine.schedule.startTime;
    const execution = findExecution(executions, routine.id);
    const completion = findCompletion(completions, routine.id);
    const status = computeTimelineStatus({
      dateISO,
      startTime,
      estimatedDuration: routine.estimatedDuration,
      override,
      execution,
      completion,
      now,
    });

    planned.push({
      routine,
      date: dateISO,
      startTime,
      status,
      execution,
      completion,
      isAdHoc: added && !recurs,
    });
  }

  return sortPlannedRoutines(planned);
}

/** Sorts by start time (flexible last), then by title. */
export function sortPlannedRoutines(items: PlannedRoutine[]): PlannedRoutine[] {
  return items.slice().sort((a, b) => {
    const ta = a.startTime ?? FLEXIBLE_SORT_KEY;
    const tb = b.startTime ?? FLEXIBLE_SORT_KEY;
    if (ta !== tb) return ta < tb ? -1 : 1;
    return a.routine.title.localeCompare(b.routine.title, 'de');
  });
}

/**
 * The routine the user should act on next: in progress > due now > the most
 * recently overdue one > upcoming.
 */
export function selectNextRoutine(items: PlannedRoutine[]): PlannedRoutine | null {
  const live = items.find((p) => p.status === 'active' || p.status === 'paused');
  if (live) return live;
  const ready = items.find((p) => p.status === 'ready');
  if (ready) return ready;
  const overdue = items.filter((p) => p.status === 'overdue');
  if (overdue.length > 0) return overdue[overdue.length - 1] ?? null;
  const upcoming = items.find((p) => p.status === 'planned');
  return upcoming ?? null;
}

export interface DayProgress {
  completed: number;
  /** Routines that still count for today (skipped ones are left out). */
  total: number;
  skipped: number;
  fraction: number;
}

/**
 * Day completion progress. Routines skipped for the day are excused and do not
 * count against the total, so a day with one deliberate skip can still reach
 * 100 % — matching how streaks and the weekly chart treat skips.
 */
export function computeDayProgress(items: PlannedRoutine[]): DayProgress {
  const skipped = items.filter((p) => p.status === 'skipped').length;
  const total = items.length - skipped;
  const completed = items.filter((p) => p.status === 'completed').length;
  const fraction = total === 0 ? 0 : completed / total;
  return { completed, total, skipped, fraction };
}

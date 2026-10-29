import type { ISODateString } from '../../types/common';
import type { RoutineCompletion } from '../../types/completion';
import type { RoutineExecution } from '../../types/execution';
import type { Routine, RoutineStep } from '../../types/routine';
import { nowISO } from '../../utils/datetime';
import { generateId } from '../../utils/id';

/**
 * Pure state transitions for running a routine. Every function returns a new
 * execution object; nothing here touches the database, timers or UI. Timing is
 * reconstructed from `stepStartedAt` + `accumulatedStepSeconds`, so a run
 * survives pauses and full app restarts.
 */

export function currentStep(
  routine: Routine,
  execution: RoutineExecution,
): RoutineStep | undefined {
  return routine.steps[execution.currentStepIndex];
}

/** Seconds spent on the current step, including time before the latest resume. */
export function stepElapsedSeconds(execution: RoutineExecution, now: Date): number {
  const base = execution.accumulatedStepSeconds;
  if (execution.stepStartedAt === null) return Math.max(0, base);
  const since = (now.getTime() - new Date(execution.stepStartedAt).getTime()) / 1000;
  return Math.max(0, base + since);
}

/** Remaining seconds on the current timed step, or `null` for untimed steps. */
export function stepRemainingSeconds(
  routine: Routine,
  execution: RoutineExecution,
  now: Date,
): number | null {
  const step = currentStep(routine, execution);
  if (!step || step.durationInSeconds === null) return null;
  return Math.max(0, step.durationInSeconds - stepElapsedSeconds(execution, now));
}

export function isStepTimerFinished(
  routine: Routine,
  execution: RoutineExecution,
  now: Date,
): boolean {
  const remaining = stepRemainingSeconds(routine, execution, now);
  return remaining !== null && remaining <= 0;
}

/** Fraction of steps already handled (completed or skipped). */
export function executionProgress(routine: Routine, execution: RoutineExecution): number {
  const total = routine.steps.length;
  if (total === 0) return 0;
  const handled = execution.completedStepIds.length + execution.skippedStepIds.length;
  return Math.min(1, handled / total);
}

/** Sum of remaining step durations from the current step onward, in seconds. */
export function remainingTotalSeconds(
  routine: Routine,
  execution: RoutineExecution,
  now: Date,
): number {
  let total = 0;
  const currentRemaining = stepRemainingSeconds(routine, execution, now);
  total += currentRemaining ?? 0;
  for (let i = execution.currentStepIndex + 1; i < routine.steps.length; i += 1) {
    total += routine.steps[i]?.durationInSeconds ?? 0;
  }
  return Math.round(total);
}

/**
 * Timestamp to start the current step's clock at. Every step is timed for
 * bookkeeping (so the recorded duration covers check-off steps too); only the
 * countdown UI distinguishes timed from untimed steps.
 */
function startStepAt(execution: Pick<RoutineExecution, 'status'>, now: Date): string | null {
  return execution.status === 'active' ? nowISO(now) : null;
}

/** Total active seconds including the current step so far. */
function activeSecondsSoFar(execution: RoutineExecution, now: Date): number {
  return execution.activeSeconds + stepElapsedSeconds(execution, now);
}

/** Creates a fresh execution positioned at the first step. */
export function startExecution(
  routine: Routine,
  dateISO: ISODateString,
  now: Date,
): RoutineExecution {
  return {
    id: generateId(),
    routineId: routine.id,
    scheduledDate: dateISO,
    startedAt: nowISO(now),
    completedAt: null,
    currentStepIndex: 0,
    completedStepIds: [],
    skippedStepIds: [],
    status: 'active',
    stepStartedAt: nowISO(now),
    accumulatedStepSeconds: 0,
    activeSeconds: 0,
  };
}

/** Moves to the next step, banking the current step's active time. */
function advance(
  execution: RoutineExecution,
  routine: Routine,
  now: Date,
): RoutineExecution {
  const activeSeconds = activeSecondsSoFar(execution, now);
  const nextIndex = execution.currentStepIndex + 1;
  if (nextIndex >= routine.steps.length) {
    return {
      ...execution,
      currentStepIndex: routine.steps.length,
      status: 'completed',
      completedAt: nowISO(now),
      stepStartedAt: null,
      accumulatedStepSeconds: 0,
      activeSeconds,
    };
  }
  return {
    ...execution,
    currentStepIndex: nextIndex,
    // A step completed while paused stays paused: no clock starts.
    stepStartedAt: startStepAt(execution, now),
    accumulatedStepSeconds: 0,
    activeSeconds,
  };
}

function withId(list: string[], id: string): string[] {
  return list.includes(id) ? list : [...list, id];
}

/** Marks the current step complete and moves on (finishing if it was last). */
export function completeStep(
  routine: Routine,
  execution: RoutineExecution,
  now: Date,
): RoutineExecution {
  const step = currentStep(routine, execution);
  if (!step) return execution;
  const updated: RoutineExecution = {
    ...execution,
    completedStepIds: withId(execution.completedStepIds, step.id),
  };
  return advance(updated, routine, now);
}

/** Marks the current step skipped and moves on. */
export function skipStep(
  routine: Routine,
  execution: RoutineExecution,
  now: Date,
): RoutineExecution {
  const step = currentStep(routine, execution);
  if (!step) return execution;
  const updated: RoutineExecution = {
    ...execution,
    skippedStepIds: withId(execution.skippedStepIds, step.id),
  };
  return advance(updated, routine, now);
}

/** Pauses the run, folding elapsed time into the accumulator. */
export function pauseExecution(execution: RoutineExecution, now: Date): RoutineExecution {
  if (execution.status !== 'active') return execution;
  return {
    ...execution,
    status: 'paused',
    accumulatedStepSeconds: stepElapsedSeconds(execution, now),
    stepStartedAt: null,
  };
}

/** Resumes a paused run, restarting the current step's clock. */
export function resumeExecution(
  routine: Routine,
  execution: RoutineExecution,
  now: Date,
): RoutineExecution {
  if (execution.status !== 'paused') return execution;
  if (!currentStep(routine, execution)) return execution;
  return {
    ...execution,
    status: 'active',
    stepStartedAt: nowISO(now),
  };
}

/**
 * Adds extra time to the current timed step by rewinding its elapsed timer.
 * Elapsed time is first capped at the step's duration, so "+1 Minute" always
 * grants a full minute even after the step has overrun.
 */
export function addStepTime(
  routine: Routine,
  execution: RoutineExecution,
  seconds: number,
  now: Date,
): RoutineExecution {
  const step = currentStep(routine, execution);
  const elapsed = stepElapsedSeconds(execution, now);
  const capped = step?.durationInSeconds != null ? Math.min(elapsed, step.durationInSeconds) : elapsed;
  // Time already spent stays banked as active time even though the step
  // clock is rewound; otherwise an overrun would vanish from the duration.
  const overrun = Math.max(0, elapsed - capped);
  return {
    ...execution,
    accumulatedStepSeconds: Math.max(0, capped - seconds),
    stepStartedAt: startStepAt(execution, now),
    activeSeconds: execution.activeSeconds + overrun,
  };
}

/** Ends a run early, banking the time spent on the current step. */
export function abandonExecution(execution: RoutineExecution, now: Date): RoutineExecution {
  if (execution.status === 'completed' || execution.status === 'abandoned') return execution;
  return {
    ...execution,
    status: 'abandoned',
    completedAt: nowISO(now),
    stepStartedAt: null,
    accumulatedStepSeconds: 0,
    activeSeconds: activeSecondsSoFar(execution, now),
  };
}

/**
 * Steps back to the previous step ("Vorheriger Schritt"), un-marking it so an
 * accidental "Erledigt" can be undone. Time already spent stays banked.
 */
export function goBackStep(
  routine: Routine,
  execution: RoutineExecution,
  now: Date,
): RoutineExecution {
  if (execution.status === 'completed' || execution.status === 'abandoned') return execution;
  const previousIndex = execution.currentStepIndex - 1;
  const previous = routine.steps[previousIndex];
  if (!previous) return execution;
  return {
    ...execution,
    currentStepIndex: previousIndex,
    completedStepIds: execution.completedStepIds.filter((id) => id !== previous.id),
    skippedStepIds: execution.skippedStepIds.filter((id) => id !== previous.id),
    stepStartedAt: startStepAt(execution, now),
    accumulatedStepSeconds: 0,
    activeSeconds: activeSecondsSoFar(execution, now),
  };
}

/**
 * Reopens a run that was just completed, positioned on its last step, so a
 * premature final "Erledigt" can be taken back from the success screen.
 */
export function reopenLastStep(
  routine: Routine,
  execution: RoutineExecution,
  now: Date,
): RoutineExecution {
  if (execution.status !== 'completed') return execution;
  const lastIndex = routine.steps.length - 1;
  const last = routine.steps[lastIndex];
  if (!last) return execution;
  return {
    ...execution,
    status: 'active',
    completedAt: null,
    currentStepIndex: lastIndex,
    completedStepIds: execution.completedStepIds.filter((id) => id !== last.id),
    skippedStepIds: execution.skippedStepIds.filter((id) => id !== last.id),
    stepStartedAt: nowISO(now),
    accumulatedStepSeconds: 0,
  };
}

/**
 * Re-aligns a stored run with the routine's *current* steps. If the routine was
 * edited while the run was paused (steps removed, reordered or inserted), the
 * stored index may point past the end or at a different step. The handled step
 * ids are the source of truth: the run continues at the first unhandled step,
 * or finishes when none is left.
 */
export function reconcileExecution(
  routine: Routine,
  execution: RoutineExecution,
  now: Date,
): RoutineExecution {
  if (execution.status === 'completed' || execution.status === 'abandoned') return execution;

  const stepIds = new Set(routine.steps.map((step) => step.id));
  const completedStepIds = execution.completedStepIds.filter((id) => stepIds.has(id));
  const skippedStepIds = execution.skippedStepIds.filter(
    (id) => stepIds.has(id) && !completedStepIds.includes(id),
  );
  const handled = new Set([...completedStepIds, ...skippedStepIds]);
  const nextIndex = routine.steps.findIndex((step) => !handled.has(step.id));

  if (nextIndex === -1) {
    return {
      ...execution,
      completedStepIds,
      skippedStepIds,
      currentStepIndex: routine.steps.length,
      status: 'completed',
      completedAt: nowISO(now),
      stepStartedAt: null,
      accumulatedStepSeconds: 0,
      activeSeconds: activeSecondsSoFar(execution, now),
    };
  }

  const unchanged =
    nextIndex === execution.currentStepIndex &&
    completedStepIds.length === execution.completedStepIds.length &&
    skippedStepIds.length === execution.skippedStepIds.length;
  if (unchanged) return execution;

  return {
    ...execution,
    completedStepIds,
    skippedStepIds,
    currentStepIndex: nextIndex,
    stepStartedAt: startStepAt(execution, now),
    accumulatedStepSeconds: 0,
    activeSeconds: activeSecondsSoFar(execution, now),
  };
}

/** Runs that crossed midnight less than this long ago may still be resumed. */
export const RESUME_GRACE_MS = 3 * 60 * 60 * 1000;

/**
 * Whether a live (active/paused) run may still be picked up: it belongs to
 * today, or it started so recently that it merely crossed midnight. Anything
 * older is stale and gets closed as abandoned.
 */
export function isResumableRun(
  execution: RoutineExecution,
  todayISO: ISODateString,
  now: Date,
): boolean {
  if (execution.status !== 'active' && execution.status !== 'paused') return false;
  if (execution.scheduledDate === todayISO) return true;
  return now.getTime() - new Date(execution.startedAt).getTime() < RESUME_GRACE_MS;
}

/**
 * Builds the completion record summarising a finished or abandoned run.
 * A run only counts as completed when it reached the end *and* at least one
 * step was actually done — skipping everything is not doing the routine.
 */
export function buildCompletion(
  routine: Routine,
  execution: RoutineExecution,
  now: Date,
): RoutineCompletion {
  const completedAt = execution.completedAt ?? nowISO(now);
  return {
    id: generateId(),
    routineId: routine.id,
    date: execution.scheduledDate,
    completed: execution.status === 'completed' && execution.completedStepIds.length > 0,
    completedSteps: execution.completedStepIds.length,
    totalSteps: routine.steps.length,
    durationInSeconds: Math.max(0, Math.round(execution.activeSeconds)),
    startedAt: execution.startedAt,
    completedAt,
  };
}

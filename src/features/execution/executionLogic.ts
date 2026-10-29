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

function isTimed(step: RoutineStep | undefined): boolean {
  return step !== undefined && step.durationInSeconds !== null;
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

function startStepAt(step: RoutineStep | undefined, now: Date): string | null {
  return isTimed(step) ? nowISO(now) : null;
}

/** Creates a fresh execution positioned at the first step. */
export function startExecution(
  routine: Routine,
  dateISO: ISODateString,
  now: Date,
): RoutineExecution {
  const firstStep = routine.steps[0];
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
    stepStartedAt: startStepAt(firstStep, now),
    accumulatedStepSeconds: 0,
  };
}

function advance(
  execution: RoutineExecution,
  routine: Routine,
  now: Date,
): RoutineExecution {
  const nextIndex = execution.currentStepIndex + 1;
  if (nextIndex >= routine.steps.length) {
    return {
      ...execution,
      currentStepIndex: routine.steps.length,
      status: 'completed',
      completedAt: nowISO(now),
      stepStartedAt: null,
      accumulatedStepSeconds: 0,
    };
  }
  return {
    ...execution,
    currentStepIndex: nextIndex,
    stepStartedAt: startStepAt(routine.steps[nextIndex], now),
    accumulatedStepSeconds: 0,
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

/** Resumes a paused run, restarting the current step's timer if it is timed. */
export function resumeExecution(
  routine: Routine,
  execution: RoutineExecution,
  now: Date,
): RoutineExecution {
  if (execution.status !== 'paused') return execution;
  return {
    ...execution,
    status: 'active',
    stepStartedAt: startStepAt(currentStep(routine, execution), now),
  };
}

/** Adds extra time to the current step by rewinding its elapsed timer. */
export function addStepTime(
  execution: RoutineExecution,
  seconds: number,
  now: Date,
): RoutineExecution {
  const elapsed = stepElapsedSeconds(execution, now);
  const newAccumulated = Math.max(0, elapsed - seconds);
  return {
    ...execution,
    accumulatedStepSeconds: newAccumulated,
    stepStartedAt: execution.status === 'active' ? nowISO(now) : null,
  };
}

/** Ends a run early. */
export function abandonExecution(execution: RoutineExecution, now: Date): RoutineExecution {
  return {
    ...execution,
    status: 'abandoned',
    completedAt: nowISO(now),
    stepStartedAt: null,
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
    stepStartedAt:
      execution.status === 'active' ? startStepAt(routine.steps[nextIndex], now) : null,
    accumulatedStepSeconds: 0,
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

/** Builds the completion record summarising a finished or abandoned run. */
export function buildCompletion(
  routine: Routine,
  execution: RoutineExecution,
  now: Date,
): RoutineCompletion {
  const completedAt = execution.completedAt ?? nowISO(now);
  const durationMs =
    new Date(completedAt).getTime() - new Date(execution.startedAt).getTime();
  return {
    id: generateId(),
    routineId: routine.id,
    date: execution.scheduledDate,
    completed: execution.status === 'completed',
    completedSteps: execution.completedStepIds.length,
    totalSteps: routine.steps.length,
    durationInSeconds: Math.max(0, Math.round(durationMs / 1000)),
    startedAt: execution.startedAt,
    completedAt,
  };
}

import { create } from 'zustand';

import * as db from '../database';
import * as engine from '../features/execution/executionLogic';
import { haptics } from '../services/haptics';
import { syncStepEndAlert } from '../services/notifications';
import type { ISODateString } from '../types/common';
import type { RoutineCompletion } from '../types/completion';
import type { RoutineExecution } from '../types/execution';
import type { Routine } from '../types/routine';
import { todayISO } from '../utils/datetime';
import { useAppStore } from './appStore';

interface ExecutionState {
  routine: Routine | null;
  execution: RoutineExecution | null;
  /** Completion record shown on the success screen once a run finishes. */
  finished: RoutineCompletion | null;

  start: (routine: Routine, dateISO: ISODateString) => Promise<void>;
  restore: () => Promise<boolean>;
  attach: (routine: Routine, execution: RoutineExecution) => Promise<void>;
  completeStep: () => Promise<void>;
  skipStep: () => Promise<void>;
  /** Undo for an accidental "Erledigt"/"Überspringen": back to the previous step. */
  goBack: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  addTime: (seconds: number) => Promise<void>;
  abandon: () => Promise<void>;
  /** Takes back a just-finished run so its last step can be redone. */
  reopen: () => Promise<void>;
  /** Pauses the run and leaves the screen; it stays resumable from "Heute". */
  leave: () => Promise<void>;
  clear: () => void;
}

/**
 * Actions run strictly one after another. Without this, a quick "Erledigt"
 * followed by "Pause" could persist a paused run on top of a finished one, and
 * a double tap would lose a step.
 */
let chain: Promise<unknown> = Promise.resolve();
function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = chain.then(task, task);
  chain = run.catch(() => undefined);
  return run;
}

async function persist(execution: RoutineExecution): Promise<void> {
  await useAppStore.getState().applyExecutionUpdate(execution);
}

/** Keeps the single "step finished" alert aligned with the current step. */
function syncAlert(routine: Routine | null, execution: RoutineExecution | null): void {
  if (!routine || !execution || execution.status !== 'active') {
    void syncStepEndAlert(null);
    return;
  }
  const now = new Date();
  const step = engine.currentStep(routine, execution);
  const remaining = engine.stepRemainingSeconds(routine, execution, now);
  if (!step || remaining === null || remaining <= 0) {
    void syncStepEndAlert(null);
    return;
  }
  void syncStepEndAlert({
    routineId: routine.id,
    routineTitle: routine.title,
    stepTitle: step.title,
    at: new Date(now.getTime() + remaining * 1000),
  });
}

export const useExecutionStore = create<ExecutionState>((set, get) => {
  /** Applies a transition: show it immediately, then persist and finalize if done. */
  async function apply(
    routine: Routine,
    next: RoutineExecution,
    now: Date,
    feedback?: () => Promise<void>,
  ): Promise<void> {
    set({ execution: next });
    syncAlert(routine, next);
    await persist(next);
    if (feedback) void feedback();
    if (next.status === 'completed' || next.status === 'abandoned') {
      await finalize(routine, next, now);
    }
  }

  async function finalize(routine: Routine, execution: RoutineExecution, now: Date): Promise<void> {
    const completion = engine.buildCompletion(routine, execution, now);
    await useAppStore.getState().recordCompletion(completion);
    if (completion.completed) void haptics.success();
    set({ execution, finished: completion });
  }

  return {
    routine: null,
    execution: null,
    finished: null,

    start: (routine, dateISO) =>
      enqueue(async () => {
        const now = new Date();
        await db.clearLiveExecutionsForRoutineDate(routine.id, dateISO);
        const execution = engine.startExecution(routine, dateISO, now);
        set({ routine, execution, finished: null });
        syncAlert(routine, execution);
        await persist(execution);
        void haptics.medium();
      }),

    restore: () =>
      enqueue(async () => {
        const now = new Date();
        const live = (await db.getLiveExecutions()).find((execution) =>
          engine.isResumableRun(execution, todayISO(now), now),
        );
        if (!live) return false;
        const routine =
          useAppStore.getState().routines.find((r) => r.id === live.routineId) ??
          (await db.getRoutineById(live.routineId));
        if (!routine) return false;
        set({ routine, execution: live, finished: null });
        const reconciled = engine.reconcileExecution(routine, live, now);
        if (reconciled !== live) await apply(routine, reconciled, now);
        else syncAlert(routine, live);
        return true;
      }),

    attach: (routine, execution) =>
      enqueue(async () => {
        const now = new Date();
        set({ routine, execution, finished: null });
        const reconciled = engine.reconcileExecution(routine, execution, now);
        if (reconciled !== execution) await apply(routine, reconciled, now);
        else syncAlert(routine, execution);
      }),

    completeStep: () =>
      enqueue(async () => {
        const { routine, execution } = get();
        if (!routine || !execution || execution.status === 'completed') return;
        const now = new Date();
        await apply(routine, engine.completeStep(routine, execution, now), now, haptics.success);
      }),

    skipStep: () =>
      enqueue(async () => {
        const { routine, execution } = get();
        if (!routine || !execution || execution.status === 'completed') return;
        const now = new Date();
        await apply(routine, engine.skipStep(routine, execution, now), now, haptics.light);
      }),

    goBack: () =>
      enqueue(async () => {
        const { routine, execution } = get();
        if (!routine || !execution) return;
        const now = new Date();
        const next = engine.goBackStep(routine, execution, now);
        if (next !== execution) await apply(routine, next, now, haptics.light);
      }),

    pause: () =>
      enqueue(async () => {
        const { routine, execution } = get();
        if (!routine || !execution) return;
        const now = new Date();
        const next = engine.pauseExecution(execution, now);
        if (next !== execution) await apply(routine, next, now, haptics.light);
      }),

    resume: () =>
      enqueue(async () => {
        const { routine, execution } = get();
        if (!routine || !execution) return;
        const now = new Date();
        const next = engine.resumeExecution(routine, execution, now);
        if (next !== execution) await apply(routine, next, now);
      }),

    addTime: (seconds) =>
      enqueue(async () => {
        const { routine, execution } = get();
        if (!routine || !execution) return;
        const now = new Date();
        await apply(routine, engine.addStepTime(routine, execution, seconds, now), now);
      }),

    abandon: () =>
      enqueue(async () => {
        const { routine, execution } = get();
        if (!routine || !execution) return;
        if (execution.status === 'completed' || execution.status === 'abandoned') return;
        const now = new Date();
        await apply(routine, engine.abandonExecution(execution, now), now);
      }),

    reopen: () =>
      enqueue(async () => {
        const { routine, execution } = get();
        if (!routine || !execution || execution.status !== 'completed') return;
        const now = new Date();
        const next = engine.reopenLastStep(routine, execution, now);
        if (next === execution) return;
        // The completion was already recorded; take it back with the run.
        await useAppStore.getState().removeCompletion(routine.id, execution.scheduledDate);
        set({ finished: null });
        await apply(routine, next, now);
      }),

    leave: () =>
      enqueue(async () => {
        const { routine, execution } = get();
        if (routine && execution && execution.status === 'active') {
          const paused = engine.pauseExecution(execution, new Date());
          await persist(paused);
        }
        void syncStepEndAlert(null);
        set({ routine: null, execution: null, finished: null });
      }),

    clear: () => {
      void syncStepEndAlert(null);
      set({ routine: null, execution: null, finished: null });
    },
  };
});

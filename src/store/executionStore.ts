import { create } from 'zustand';

import * as db from '../database';
import * as engine from '../features/execution/executionLogic';
import { haptics } from '../services/haptics';
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
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  addTime: (seconds: number) => Promise<void>;
  abandon: () => Promise<void>;
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

export const useExecutionStore = create<ExecutionState>((set, get) => {
  /** Applies a transition: show it immediately, then persist and finalize if done. */
  async function apply(
    routine: Routine,
    next: RoutineExecution,
    now: Date,
    feedback?: () => Promise<void>,
  ): Promise<void> {
    set({ execution: next });
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
        return true;
      }),

    attach: (routine, execution) =>
      enqueue(async () => {
        const now = new Date();
        set({ routine, execution, finished: null });
        const reconciled = engine.reconcileExecution(routine, execution, now);
        if (reconciled !== execution) await apply(routine, reconciled, now);
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
        await apply(routine, engine.addStepTime(execution, seconds, now), now);
      }),

    abandon: () =>
      enqueue(async () => {
        const { routine, execution } = get();
        if (!routine || !execution) return;
        if (execution.status === 'completed' || execution.status === 'abandoned') return;
        const now = new Date();
        await apply(routine, engine.abandonExecution(execution, now), now);
      }),

    clear: () => set({ routine: null, execution: null, finished: null }),
  };
});

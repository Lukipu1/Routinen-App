import { create } from 'zustand';

import * as db from '../database';
import * as engine from '../features/execution/executionLogic';
import { haptics } from '../services/haptics';
import type { ISODateString } from '../types/common';
import type { RoutineCompletion } from '../types/completion';
import type { RoutineExecution } from '../types/execution';
import type { Routine } from '../types/routine';
import { useAppStore } from './appStore';

interface ExecutionState {
  routine: Routine | null;
  execution: RoutineExecution | null;
  /** Completion record shown on the success screen once a run finishes. */
  finished: RoutineCompletion | null;

  start: (routine: Routine, dateISO: ISODateString) => Promise<void>;
  restore: () => Promise<boolean>;
  attach: (routine: Routine, execution: RoutineExecution) => void;
  completeStep: () => Promise<void>;
  skipStep: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  addTime: (seconds: number) => Promise<void>;
  abandon: () => Promise<void>;
  clear: () => void;
}

async function persist(execution: RoutineExecution): Promise<void> {
  await useAppStore.getState().applyExecutionUpdate(execution);
}

export const useExecutionStore = create<ExecutionState>((set, get) => ({
  routine: null,
  execution: null,
  finished: null,

  start: async (routine, dateISO) => {
    const now = new Date();
    await db.clearLiveExecutionsForRoutineDate(routine.id, dateISO);
    const execution = engine.startExecution(routine, dateISO, now);
    await persist(execution);
    void haptics.medium();
    set({ routine, execution, finished: null });
  },

  restore: async () => {
    const live = await db.getLiveExecution();
    if (!live) return false;
    const routine =
      useAppStore.getState().routines.find((r) => r.id === live.routineId) ??
      (await db.getRoutineById(live.routineId));
    if (!routine) return false;
    set({ routine, execution: live, finished: null });
    return true;
  },

  attach: (routine, execution) => {
    set({ routine, execution, finished: null });
  },

  completeStep: async () => {
    const { routine, execution } = get();
    if (!routine || !execution) return;
    const now = new Date();
    const next = engine.completeStep(routine, execution, now);
    await persist(next);
    void haptics.success();
    if (next.status === 'completed') {
      await finalize(routine, next, now, set);
    } else {
      set({ execution: next });
    }
  },

  skipStep: async () => {
    const { routine, execution } = get();
    if (!routine || !execution) return;
    const now = new Date();
    const next = engine.skipStep(routine, execution, now);
    await persist(next);
    void haptics.light();
    if (next.status === 'completed') {
      await finalize(routine, next, now, set);
    } else {
      set({ execution: next });
    }
  },

  pause: async () => {
    const { routine, execution } = get();
    if (!routine || !execution) return;
    const next = engine.pauseExecution(execution, new Date());
    await persist(next);
    void haptics.light();
    set({ execution: next });
  },

  resume: async () => {
    const { routine, execution } = get();
    if (!routine || !execution) return;
    const next = engine.resumeExecution(routine, execution, new Date());
    await persist(next);
    set({ execution: next });
  },

  addTime: async (seconds) => {
    const { execution } = get();
    if (!execution) return;
    const next = engine.addStepTime(execution, seconds, new Date());
    await persist(next);
    set({ execution: next });
  },

  abandon: async () => {
    const { routine, execution } = get();
    if (!routine || !execution) return;
    const now = new Date();
    const next = engine.abandonExecution(execution, now);
    await persist(next);
    await finalize(routine, next, now, set);
  },

  clear: () => set({ routine: null, execution: null, finished: null }),
}));

async function finalize(
  routine: Routine,
  execution: RoutineExecution,
  now: Date,
  set: (partial: Partial<ExecutionState>) => void,
): Promise<void> {
  const completion = engine.buildCompletion(routine, execution, now);
  await useAppStore.getState().recordCompletion(completion);
  void haptics.success();
  set({ execution, finished: completion });
}

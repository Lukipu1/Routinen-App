import { create } from 'zustand';

import * as db from '../database';
import { buildSampleRoutines } from '../data/seed';
import {
  addRoutineForDay,
  findOverride,
  moveRoutineForDay,
  pauseRoutineForDay,
  skipRoutineForDay,
} from '../features/planner/overrides';
import {
  cancelRoutineReminders,
  scheduleRoutineReminders,
} from '../services/notifications';
import type { ISODateString, TimeString } from '../types/common';
import type { RoutineCompletion } from '../types/completion';
import type { RoutineExecution } from '../types/execution';
import type { PlanOverride } from '../types/planning';
import type { Routine } from '../types/routine';
import { nowISO, todayISO } from '../utils/datetime';
import { generateId } from '../utils/id';
import { usePreferencesStore } from './preferencesStore';

interface AppState {
  initialized: boolean;
  loading: boolean;
  error: string | null;
  today: ISODateString;
  routines: Routine[];
  overrides: PlanOverride[];
  completions: RoutineCompletion[];
  todayExecutions: RoutineExecution[];

  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  ensureToday: () => Promise<void>;

  saveRoutine: (routine: Routine) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;
  duplicateRoutine: (id: string) => Promise<void>;
  toggleRoutineActive: (id: string) => Promise<void>;

  moveRoutineForToday: (routineId: string, startTime: TimeString | null) => Promise<void>;
  skipRoutineForToday: (routineId: string, skipped?: boolean) => Promise<void>;
  pauseRoutineForToday: (routineId: string, paused?: boolean) => Promise<void>;
  addRoutineForToday: (routineId: string, startTime?: TimeString | null) => Promise<void>;

  applyExecutionUpdate: (execution: RoutineExecution) => Promise<void>;
  recordCompletion: (completion: RoutineCompletion) => Promise<void>;

  resetSampleData: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

async function notificationsEnabled(): Promise<boolean> {
  return usePreferencesStore.getState().preferences.notificationsEnabled;
}

async function syncReminders(routine: Routine): Promise<void> {
  if (await notificationsEnabled()) {
    await scheduleRoutineReminders(routine);
  } else {
    await cancelRoutineReminders(routine.id);
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  initialized: false,
  loading: false,
  error: null,
  today: todayISO(),
  routines: [],
  overrides: [],
  completions: [],
  todayExecutions: [],

  initialize: async () => {
    if (get().initialized || get().loading) return;
    set({ loading: true, error: null });
    try {
      await db.getDatabase();
      if ((await db.countRoutines()) === 0) {
        for (const routine of buildSampleRoutines()) {
          await db.saveRoutine(routine);
        }
      }
      await get().refresh();
      set({ initialized: true });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unbekannter Fehler' });
    } finally {
      set({ loading: false });
    }
  },

  refresh: async () => {
    const today = todayISO();
    const [routines, overrides, completions, todayExecutions] = await Promise.all([
      db.getAllRoutines(),
      db.getAllOverrides(),
      db.getAllCompletions(),
      db.getExecutionsForDate(today),
    ]);
    set({ today, routines, overrides, completions, todayExecutions });
  },

  ensureToday: async () => {
    if (get().today !== todayISO()) {
      await get().refresh();
    }
  },

  saveRoutine: async (routine) => {
    await db.saveRoutine(routine);
    await syncReminders(routine);
    const existingIndex = get().routines.findIndex((r) => r.id === routine.id);
    const routines =
      existingIndex >= 0
        ? get().routines.map((r) => (r.id === routine.id ? routine : r))
        : [...get().routines, routine];
    set({ routines });
  },

  deleteRoutine: async (id) => {
    await db.deleteRoutine(id);
    await cancelRoutineReminders(id);
    set({
      routines: get().routines.filter((r) => r.id !== id),
      overrides: get().overrides.filter((o) => o.routineId !== id),
      completions: get().completions.filter((c) => c.routineId !== id),
      todayExecutions: get().todayExecutions.filter((e) => e.routineId !== id),
    });
  },

  duplicateRoutine: async (id) => {
    const source = get().routines.find((r) => r.id === id);
    if (!source) return;
    const timestamp = nowISO();
    const copy: Routine = {
      ...source,
      id: generateId(),
      title: `${source.title} Kopie`,
      isSample: false,
      steps: source.steps.map((step) => ({ ...step, id: generateId() })),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await get().saveRoutine(copy);
  },

  toggleRoutineActive: async (id) => {
    const routine = get().routines.find((r) => r.id === id);
    if (!routine) return;
    const updated: Routine = { ...routine, isActive: !routine.isActive, updatedAt: nowISO() };
    await get().saveRoutine(updated);
  },

  moveRoutineForToday: async (routineId, startTime) => {
    const { overrides, today } = get();
    const next = moveRoutineForDay(overrides, routineId, today, startTime);
    const changed = findOverride(next, routineId, today);
    if (changed) await db.saveOverride(changed);
    set({ overrides: next });
  },

  skipRoutineForToday: async (routineId, skipped = true) => {
    const { overrides, today } = get();
    const next = skipRoutineForDay(overrides, routineId, today, skipped);
    const changed = findOverride(next, routineId, today);
    if (changed) await db.saveOverride(changed);
    set({ overrides: next });
  },

  pauseRoutineForToday: async (routineId, paused = true) => {
    const { overrides, today } = get();
    const next = pauseRoutineForDay(overrides, routineId, today, paused);
    const changed = findOverride(next, routineId, today);
    if (changed) await db.saveOverride(changed);
    set({ overrides: next });
  },

  addRoutineForToday: async (routineId, startTime = null) => {
    const { overrides, today } = get();
    const next = addRoutineForDay(overrides, routineId, today, startTime);
    const changed = findOverride(next, routineId, today);
    if (changed) await db.saveOverride(changed);
    set({ overrides: next });
  },

  applyExecutionUpdate: async (execution) => {
    await db.saveExecution(execution);
    const existing = get().todayExecutions.findIndex((e) => e.id === execution.id);
    const todayExecutions =
      existing >= 0
        ? get().todayExecutions.map((e) => (e.id === execution.id ? execution : e))
        : [...get().todayExecutions, execution];
    set({ todayExecutions });
  },

  recordCompletion: async (completion) => {
    await db.saveCompletion(completion);
    const others = get().completions.filter(
      (c) => !(c.routineId === completion.routineId && c.date === completion.date),
    );
    set({ completions: [completion, ...others] });
  },

  resetSampleData: async () => {
    await db.clearAllData();
    for (const routine of buildSampleRoutines()) {
      await db.saveRoutine(routine);
    }
    set({ initialized: false });
    await get().refresh();
    set({ initialized: true });
  },

  clearAllData: async () => {
    await db.clearAllData();
    set({ routines: [], overrides: [], completions: [], todayExecutions: [] });
  },
}));

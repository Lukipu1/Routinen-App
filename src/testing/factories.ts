import type { Weekday } from '../types/common';
import type { RoutineCompletion } from '../types/completion';
import type { RoutineExecution } from '../types/execution';
import type {
  ReminderSettings,
  Routine,
  RoutineSchedule,
  RoutineStep,
} from '../types/routine';

type RoutineOverrides = Partial<Omit<Routine, 'schedule' | 'reminder' | 'steps'>> & {
  schedule?: Partial<RoutineSchedule>;
  reminder?: Partial<ReminderSettings>;
  steps?: RoutineStep[];
};

/**
 * Test data builders. Not used by the app itself — they keep tests concise and
 * consistent by providing sensible defaults that callers override per case.
 */

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

export function makeStep(overrides: Partial<RoutineStep> = {}): RoutineStep {
  return {
    id: overrides.id ?? nextId('step'),
    title: overrides.title ?? 'Schritt',
    durationInSeconds:
      'durationInSeconds' in overrides ? (overrides.durationInSeconds ?? null) : 60,
    order: overrides.order ?? 0,
    canSkip: overrides.canSkip ?? true,
    ...(overrides.note !== undefined ? { note: overrides.note } : {}),
    ...(overrides.icon !== undefined ? { icon: overrides.icon } : {}),
    ...(overrides.completionType !== undefined ? { completionType: overrides.completionType } : {}),
  };
}

export function makeRoutine(overrides: RoutineOverrides = {}): Routine {
  const steps = overrides.steps ?? [
    makeStep({ title: 'Erster', order: 0 }),
    makeStep({ title: 'Zweiter', order: 1, durationInSeconds: null }),
  ];
  const weekdays: Weekday[] = overrides.schedule?.weekdays ?? [0, 1, 2, 3, 4, 5, 6];
  return {
    id: overrides.id ?? nextId('routine'),
    title: overrides.title ?? 'Testroutine',
    icon: overrides.icon ?? 'sunrise',
    color: overrides.color ?? 'blue',
    category: overrides.category ?? 'morning',
    estimatedDuration:
      overrides.estimatedDuration ??
      steps.reduce((total, step) => total + (step.durationInSeconds ?? 0), 0),
    steps,
    schedule: {
      enabled: true,
      weekdays,
      startTime: '07:00',
      flexible: false,
      timeWindow: null,
      startDate: '2020-01-01',
      endDate: null,
      ...overrides.schedule,
    },
    reminder: {
      enabled: false,
      minutesBefore: 10,
      secondReminderMinutes: null,
      ...overrides.reminder,
    },
    isActive: overrides.isActive ?? true,
    isSample: overrides.isSample ?? false,
    createdAt: overrides.createdAt ?? '2020-01-01T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2020-01-01T00:00:00.000Z',
    ...(overrides.description !== undefined ? { description: overrides.description } : {}),
  };
}

export function makeCompletion(overrides: Partial<RoutineCompletion> = {}): RoutineCompletion {
  return {
    id: overrides.id ?? nextId('completion'),
    routineId: overrides.routineId ?? 'routine-1',
    date: overrides.date ?? '2026-07-22',
    completed: overrides.completed ?? true,
    completedSteps: overrides.completedSteps ?? 2,
    totalSteps: overrides.totalSteps ?? 2,
    durationInSeconds: overrides.durationInSeconds ?? 120,
    startedAt: overrides.startedAt ?? '2026-07-22T07:00:00.000Z',
    completedAt: overrides.completedAt ?? '2026-07-22T07:02:00.000Z',
  };
}

export function makeExecution(overrides: Partial<RoutineExecution> = {}): RoutineExecution {
  return {
    id: overrides.id ?? nextId('exec'),
    routineId: overrides.routineId ?? 'routine-1',
    scheduledDate: overrides.scheduledDate ?? '2026-07-22',
    startedAt: overrides.startedAt ?? '2026-07-22T07:00:00.000Z',
    completedAt: overrides.completedAt ?? null,
    currentStepIndex: overrides.currentStepIndex ?? 0,
    completedStepIds: overrides.completedStepIds ?? [],
    skippedStepIds: overrides.skippedStepIds ?? [],
    status: overrides.status ?? 'active',
    stepStartedAt: overrides.stepStartedAt ?? null,
    accumulatedStepSeconds: overrides.accumulatedStepSeconds ?? 0,
  };
}

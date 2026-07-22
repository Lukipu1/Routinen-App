import type { RoutineColorKey } from '../../constants/colors';
import type { IconKey } from '../../constants/icons';
import type { RoutineCategory } from '../../types/category';
import type { ReminderSettings, Routine, RoutineSchedule, RoutineStep } from '../../types/routine';
import { moveItem } from '../../utils/array';
import { todayISO, nowISO } from '../../utils/datetime';
import { generateId } from '../../utils/id';

/** Editable representation of a single step in the routine editor. */
export interface RoutineStepDraft {
  id: string;
  title: string;
  note: string;
  durationInSeconds: number | null;
  icon?: IconKey;
  canSkip: boolean;
}

/** Editable representation of a routine while it is being created or edited. */
export interface RoutineDraft {
  /** `null` for a new routine, otherwise the id being edited. */
  id: string | null;
  title: string;
  description: string;
  icon: IconKey;
  color: RoutineColorKey;
  category: RoutineCategory;
  steps: RoutineStepDraft[];
  schedule: RoutineSchedule;
  reminder: ReminderSettings;
  isActive: boolean;
}

export const DEFAULT_SCHEDULE: RoutineSchedule = {
  enabled: true,
  weekdays: [1, 2, 3, 4, 5],
  startTime: '07:00',
  flexible: false,
  timeWindow: null,
  startDate: todayISO(),
  endDate: null,
};

export const DEFAULT_REMINDER: ReminderSettings = {
  enabled: false,
  minutesBefore: 10,
  secondReminderMinutes: null,
};

export function createEmptyStepDraft(): RoutineStepDraft {
  return {
    id: generateId(),
    title: '',
    note: '',
    durationInSeconds: null,
    canSkip: true,
  };
}

export function createEmptyDraft(): RoutineDraft {
  return {
    id: null,
    title: '',
    description: '',
    icon: 'sunrise',
    color: 'blue',
    category: 'personal',
    steps: [createEmptyStepDraft()],
    schedule: { ...DEFAULT_SCHEDULE, startDate: todayISO() },
    reminder: { ...DEFAULT_REMINDER },
    isActive: true,
  };
}

/** Sum of timed step durations, in seconds. */
export function estimateDuration(steps: Pick<RoutineStepDraft, 'durationInSeconds'>[]): number {
  return steps.reduce((total, step) => total + (step.durationInSeconds ?? 0), 0);
}

export function addStep(draft: RoutineDraft, step?: RoutineStepDraft): RoutineDraft {
  return { ...draft, steps: [...draft.steps, step ?? createEmptyStepDraft()] };
}

export function updateStep(
  draft: RoutineDraft,
  stepId: string,
  patch: Partial<RoutineStepDraft>,
): RoutineDraft {
  return {
    ...draft,
    steps: draft.steps.map((step) => (step.id === stepId ? { ...step, ...patch } : step)),
  };
}

export function removeStep(draft: RoutineDraft, stepId: string): RoutineDraft {
  return { ...draft, steps: draft.steps.filter((step) => step.id !== stepId) };
}

export function duplicateStep(draft: RoutineDraft, stepId: string): RoutineDraft {
  const index = draft.steps.findIndex((step) => step.id === stepId);
  if (index === -1) return draft;
  const original = draft.steps[index];
  if (!original) return draft;
  const copy: RoutineStepDraft = { ...original, id: generateId() };
  const steps = [...draft.steps];
  steps.splice(index + 1, 0, copy);
  return { ...draft, steps };
}

export function moveStep(draft: RoutineDraft, from: number, to: number): RoutineDraft {
  return { ...draft, steps: moveItem(draft.steps, from, to) };
}

/** Converts an editor draft into a persistable Routine. */
export function routineFromDraft(draft: RoutineDraft, now: Date = new Date()): Routine {
  const timestamp = nowISO(now);
  const steps: RoutineStep[] = draft.steps.map((step, index) => ({
    id: step.id,
    title: step.title.trim(),
    note: step.note.trim() === '' ? undefined : step.note.trim(),
    durationInSeconds: step.durationInSeconds,
    order: index,
    icon: step.icon,
    canSkip: step.canSkip,
    completionType: step.durationInSeconds === null ? 'manual' : 'timed',
  }));
  return {
    id: draft.id ?? generateId(),
    title: draft.title.trim(),
    description: draft.description.trim() === '' ? undefined : draft.description.trim(),
    icon: draft.icon,
    color: draft.color,
    category: draft.category,
    estimatedDuration: estimateDuration(draft.steps),
    steps,
    schedule: draft.schedule,
    reminder: draft.reminder,
    isActive: draft.isActive,
    isSample: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/** Builds a draft from an existing routine for editing. */
export function draftFromRoutine(routine: Routine): RoutineDraft {
  return {
    id: routine.id,
    title: routine.title,
    description: routine.description ?? '',
    icon: routine.icon as IconKey,
    color: routine.color as RoutineColorKey,
    category: routine.category,
    steps: routine.steps
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((step) => ({
        id: step.id,
        title: step.title,
        note: step.note ?? '',
        durationInSeconds: step.durationInSeconds,
        icon: step.icon as IconKey | undefined,
        canSkip: step.canSkip,
      })),
    schedule: routine.schedule,
    reminder: routine.reminder,
    isActive: routine.isActive,
  };
}

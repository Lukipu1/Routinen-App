import type { Weekday } from '../types/common';
import type { RoutineCompletion } from '../types/completion';
import type { RoutineExecution } from '../types/execution';
import type { PlanOverride } from '../types/planning';
import type { ExecutionStatus } from '../types/status';
import type {
  ReminderSettings,
  Routine,
  RoutineSchedule,
  RoutineStep,
  StepCompletionType,
} from '../types/routine';
import type { RoutineCategory } from '../types/category';

/** Raw row shapes as returned by SQLite (numbers for booleans, text for JSON). */
export interface RoutineRow {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
  category: string;
  estimated_duration: number;
  reminder_enabled: number;
  reminder_minutes_before: number;
  reminder_second: number | null;
  schedule_enabled: number;
  schedule_weekdays: string;
  schedule_start_time: string | null;
  schedule_flexible: number;
  schedule_window: string | null;
  schedule_start_date: string;
  schedule_end_date: string | null;
  is_active: number;
  is_sample: number;
  created_at: string;
  updated_at: string;
}

export interface StepRow {
  id: string;
  routine_id: string;
  title: string;
  note: string | null;
  duration: number | null;
  position: number;
  icon: string | null;
  can_skip: number;
  completion_type: string | null;
}

export interface ExecutionRow {
  id: string;
  routine_id: string;
  scheduled_date: string;
  started_at: string;
  completed_at: string | null;
  current_step_index: number;
  completed_step_ids: string;
  skipped_step_ids: string;
  status: string;
  step_started_at: string | null;
  accumulated_step_seconds: number;
  active_seconds: number;
}

export interface CompletionRow {
  id: string;
  routine_id: string;
  date: string;
  completed: number;
  completed_steps: number;
  total_steps: number;
  duration: number;
  started_at: string;
  completed_at: string;
}

export interface OverrideRow {
  id: string;
  routine_id: string;
  date: string;
  added: number;
  skipped: number;
  paused: number;
  start_time_override: string | null;
}

function parseStringArray(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function parseWeekdays(value: string): Weekday[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v): v is Weekday => typeof v === 'number' && v >= 0 && v <= 6,
    );
  } catch {
    return [];
  }
}

function parseTimeWindow(value: string | null): RoutineSchedule['timeWindow'] {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      parsed &&
      typeof parsed === 'object' &&
      'start' in parsed &&
      'end' in parsed &&
      typeof (parsed as Record<string, unknown>).start === 'string' &&
      typeof (parsed as Record<string, unknown>).end === 'string'
    ) {
      return {
        start: (parsed as { start: string }).start,
        end: (parsed as { end: string }).end,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function rowToStep(row: StepRow): RoutineStep {
  const step: RoutineStep = {
    id: row.id,
    title: row.title,
    durationInSeconds: row.duration,
    order: row.position,
    canSkip: row.can_skip === 1,
  };
  if (row.note !== null) step.note = row.note;
  if (row.icon !== null) step.icon = row.icon;
  if (row.completion_type === 'manual' || row.completion_type === 'timed') {
    step.completionType = row.completion_type as StepCompletionType;
  }
  return step;
}

export function rowToRoutine(row: RoutineRow, stepRows: StepRow[]): Routine {
  const reminder: ReminderSettings = {
    enabled: row.reminder_enabled === 1,
    minutesBefore: row.reminder_minutes_before,
    secondReminderMinutes: row.reminder_second,
  };
  const schedule: RoutineSchedule = {
    enabled: row.schedule_enabled === 1,
    weekdays: parseWeekdays(row.schedule_weekdays),
    startTime: row.schedule_start_time,
    flexible: row.schedule_flexible === 1,
    timeWindow: parseTimeWindow(row.schedule_window),
    startDate: row.schedule_start_date,
    endDate: row.schedule_end_date,
  };
  const routine: Routine = {
    id: row.id,
    title: row.title,
    icon: row.icon,
    color: row.color,
    category: row.category as RoutineCategory,
    estimatedDuration: row.estimated_duration,
    steps: stepRows
      .slice()
      .sort((a, b) => a.position - b.position)
      .map(rowToStep),
    schedule,
    reminder,
    isActive: row.is_active === 1,
    isSample: row.is_sample === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (row.description !== null) routine.description = row.description;
  return routine;
}

export function rowToExecution(row: ExecutionRow): RoutineExecution {
  return {
    id: row.id,
    routineId: row.routine_id,
    scheduledDate: row.scheduled_date,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    currentStepIndex: row.current_step_index,
    completedStepIds: parseStringArray(row.completed_step_ids),
    skippedStepIds: parseStringArray(row.skipped_step_ids),
    status: row.status as ExecutionStatus,
    stepStartedAt: row.step_started_at,
    accumulatedStepSeconds: row.accumulated_step_seconds,
    activeSeconds: row.active_seconds ?? 0,
  };
}

export function rowToCompletion(row: CompletionRow): RoutineCompletion {
  return {
    id: row.id,
    routineId: row.routine_id,
    date: row.date,
    completed: row.completed === 1,
    completedSteps: row.completed_steps,
    totalSteps: row.total_steps,
    durationInSeconds: row.duration,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}

export function rowToOverride(row: OverrideRow): PlanOverride {
  return {
    id: row.id,
    routineId: row.routine_id,
    date: row.date,
    added: row.added === 1,
    skipped: row.skipped === 1,
    paused: row.paused === 1,
    startTimeOverride: row.start_time_override,
  };
}

export const serialize = {
  weekdays: (weekdays: Weekday[]): string => JSON.stringify(weekdays),
  timeWindow: (window: RoutineSchedule['timeWindow']): string | null =>
    window ? JSON.stringify(window) : null,
  stringArray: (values: string[]): string => JSON.stringify(values),
  bool: (value: boolean): number => (value ? 1 : 0),
};

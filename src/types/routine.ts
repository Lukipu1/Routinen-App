import type { RoutineCategory } from './category';
import type { ISODateString, ISODateTimeString, TimeString, Weekday } from './common';

/** How the user marks a step as done during execution. */
export type StepCompletionType = 'manual' | 'timed';

export interface RoutineStep {
  id: string;
  title: string;
  note?: string;
  /** Countdown length in seconds; `null` for an untimed, check-off step. */
  durationInSeconds: number | null;
  /** Position within the routine (0-based, contiguous). */
  order: number;
  icon?: string;
  canSkip: boolean;
  completionType?: StepCompletionType;
}

export interface ReminderSettings {
  enabled: boolean;
  /** Minutes before the start time to remind. 0 = exactly at start. */
  minutesBefore: number;
  /** Optional follow-up reminder this many minutes after start; `null` = none. */
  secondReminderMinutes: number | null;
}

export interface RoutineSchedule {
  enabled: boolean;
  /** Weekdays the routine recurs on. Empty = no fixed recurrence. */
  weekdays: Weekday[];
  /** Fixed start time `HH:mm`; `null` when the routine has a flexible time. */
  startTime: TimeString | null;
  /** True when the routine has no fixed clock time (do it whenever). */
  flexible: boolean;
  /** Optional soft time window for flexible routines. */
  timeWindow: { start: TimeString; end: TimeString } | null;
  /** First day the schedule is valid. */
  startDate: ISODateString;
  /** Optional last valid day (inclusive); `null` = open-ended. */
  endDate: ISODateString | null;
}

export interface Routine {
  id: string;
  title: string;
  description?: string;
  /** Icon key resolved through the icon registry. */
  icon: string;
  /** Accent colour key resolved through the colour palette. */
  color: string;
  category: RoutineCategory;
  /** Estimated total duration in seconds (sum of step durations). */
  estimatedDuration: number;
  steps: RoutineStep[];
  schedule: RoutineSchedule;
  reminder: ReminderSettings;
  isActive: boolean;
  /** Seed data flag so samples can be labelled and reset. */
  isSample: boolean;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

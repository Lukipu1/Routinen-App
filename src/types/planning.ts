import type { ISODateString, TimeString } from './common';
import type { RoutineCompletion } from './completion';
import type { RoutineExecution } from './execution';
import type { Routine } from './routine';
import type { TimelineStatus } from './status';

/**
 * Per-day adjustments layered on top of a routine's recurring schedule. One
 * record per (routineId, date). Editing the routine's schedule itself changes
 * all future days; an override only ever affects a single day.
 */
export interface PlanOverride {
  id: string;
  routineId: string;
  date: ISODateString;
  /** Routine added to this day ad-hoc, outside its normal recurrence. */
  added: boolean;
  /** Skipped just for this day (counts as an intentional skip, not a miss). */
  skipped: boolean;
  /** Paused just for this day (excused, neutral for streaks). */
  paused: boolean;
  /** Start time used only for this day (a "move only today"); `null` = unset. */
  startTimeOverride: TimeString | null;
}

/**
 * A routine resolved onto a specific day's timeline, combining schedule,
 * overrides, execution and completion into a single view-model.
 */
export interface PlannedRoutine {
  routine: Routine;
  date: ISODateString;
  /** Resolved start time (override wins over schedule); `null` = flexible. */
  startTime: TimeString | null;
  status: TimelineStatus;
  execution: RoutineExecution | null;
  completion: RoutineCompletion | null;
  /** True when present only via an ad-hoc override. */
  isAdHoc: boolean;
}

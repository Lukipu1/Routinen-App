import type { ISODateString, ISODateTimeString } from './common';

/**
 * A finished (or abandoned) run recorded for statistics. One completion per
 * routine per day at most.
 */
export interface RoutineCompletion {
  id: string;
  routineId: string;
  date: ISODateString;
  /** True when the run reached the end with at least one step actually done. */
  completed: boolean;
  completedSteps: number;
  totalSteps: number;
  /** Active duration in seconds (time spent paused is not counted). */
  durationInSeconds: number;
  startedAt: ISODateTimeString;
  completedAt: ISODateTimeString;
}

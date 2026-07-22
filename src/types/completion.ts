import type { ISODateString, ISODateTimeString } from './common';

/**
 * A finished (or abandoned) run recorded for statistics. One completion per
 * routine per day at most.
 */
export interface RoutineCompletion {
  id: string;
  routineId: string;
  date: ISODateString;
  /** True when every non-skipped step was done. */
  completed: boolean;
  completedSteps: number;
  totalSteps: number;
  /** Actual wall-clock duration in seconds. */
  durationInSeconds: number;
  startedAt: ISODateTimeString;
  completedAt: ISODateTimeString;
}

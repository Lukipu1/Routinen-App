import type { ISODateString, ISODateTimeString } from './common';
import type { ExecutionStatus } from './status';

/**
 * A run of a routine on a specific day. Persisted continuously so a paused or
 * in-progress routine can be fully restored after an app restart.
 */
export interface RoutineExecution {
  id: string;
  routineId: string;
  /** The calendar day this run belongs to. */
  scheduledDate: ISODateString;
  startedAt: ISODateTimeString;
  completedAt: ISODateTimeString | null;
  /** Index of the step currently shown. */
  currentStepIndex: number;
  completedStepIds: string[];
  skippedStepIds: string[];
  status: ExecutionStatus;
  /**
   * Timestamp the current step's timer (re)started, or `null` while paused.
   * Combined with `accumulatedStepSeconds` this reconstructs elapsed time
   * across pauses and restarts.
   */
  stepStartedAt: ISODateTimeString | null;
  /** Seconds already spent on the current step before the latest resume. */
  accumulatedStepSeconds: number;
}

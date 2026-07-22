/**
 * Lifecycle of a running routine, persisted with each execution.
 * - active: currently being performed
 * - paused: temporarily halted, resumable
 * - completed: finished (all steps handled)
 * - abandoned: ended early by the user
 */
export type ExecutionStatus = 'active' | 'paused' | 'completed' | 'abandoned';

/**
 * Status of a routine as it appears on a given day's timeline. Derived from
 * schedule, overrides, executions and completions.
 * - planned: scheduled later today, not yet due
 * - ready: due now / next up
 * - active: in progress
 * - paused: started but paused
 * - completed: done for the day
 * - skipped: intentionally skipped / paused for the day (not a failure)
 * - missed: its time passed without completion
 */
export type TimelineStatus =
  | 'planned'
  | 'ready'
  | 'active'
  | 'paused'
  | 'completed'
  | 'skipped'
  | 'missed';

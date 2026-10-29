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
 * - overdue: due earlier today and well past its slot, still doable ("Nachholen")
 * - active: in progress
 * - paused: started but paused
 * - completed: done for the day
 * - abandoned: a run was started and ended early (counts as not done)
 * - skipped: intentionally skipped / paused for the day (not a failure)
 * - missed: its day passed without completion
 */
export type TimelineStatus =
  | 'planned'
  | 'ready'
  | 'overdue'
  | 'active'
  | 'paused'
  | 'completed'
  | 'abandoned'
  | 'skipped'
  | 'missed';

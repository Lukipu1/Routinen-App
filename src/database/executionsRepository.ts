import type { ISODateString } from '../types/common';
import type { RoutineExecution } from '../types/execution';
import { getDatabase } from './client';
import { rowToExecution, serialize, type ExecutionRow } from './mappers';

export async function saveExecution(execution: RoutineExecution): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO executions (
      id, routine_id, scheduled_date, started_at, completed_at,
      current_step_index, completed_step_ids, skipped_step_ids,
      status, step_started_at, accumulated_step_seconds, active_seconds
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (id) DO UPDATE SET
      completed_at = excluded.completed_at,
      current_step_index = excluded.current_step_index,
      completed_step_ids = excluded.completed_step_ids,
      skipped_step_ids = excluded.skipped_step_ids,
      status = excluded.status,
      step_started_at = excluded.step_started_at,
      accumulated_step_seconds = excluded.accumulated_step_seconds,
      active_seconds = excluded.active_seconds;`,
    execution.id,
    execution.routineId,
    execution.scheduledDate,
    execution.startedAt,
    execution.completedAt,
    execution.currentStepIndex,
    serialize.stringArray(execution.completedStepIds),
    serialize.stringArray(execution.skippedStepIds),
    execution.status,
    execution.stepStartedAt,
    execution.accumulatedStepSeconds,
    execution.activeSeconds,
  );
}

export async function getExecutionsForDate(
  dateISO: ISODateString,
): Promise<RoutineExecution[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ExecutionRow>(
    'SELECT * FROM executions WHERE scheduled_date = ? ORDER BY started_at ASC;',
    dateISO,
  );
  return rows.map(rowToExecution);
}

/** Every in-progress or paused run, regardless of day (newest first). */
export async function getLiveExecutions(): Promise<RoutineExecution[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ExecutionRow>(
    "SELECT * FROM executions WHERE status IN ('active', 'paused') ORDER BY started_at DESC;",
  );
  return rows.map(rowToExecution);
}

/** The single in-progress or paused run for a day, used to restore state on launch. */
export async function getLiveExecution(dateISO: ISODateString): Promise<RoutineExecution | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ExecutionRow>(
    "SELECT * FROM executions WHERE scheduled_date = ? AND status IN ('active', 'paused') ORDER BY started_at DESC LIMIT 1;",
    dateISO,
  );
  return row ? rowToExecution(row) : null;
}

export async function getExecutionForRoutineDate(
  routineId: string,
  dateISO: ISODateString,
): Promise<RoutineExecution | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ExecutionRow>(
    'SELECT * FROM executions WHERE routine_id = ? AND scheduled_date = ? ORDER BY started_at DESC LIMIT 1;',
    routineId,
    dateISO,
  );
  return row ? rowToExecution(row) : null;
}

export async function deleteExecution(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM executions WHERE id = ?;', id);
}

/** Removes any lingering active/paused run for a routine on a day (dedupe). */
export async function clearLiveExecutionsForRoutineDate(
  routineId: string,
  dateISO: ISODateString,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "DELETE FROM executions WHERE routine_id = ? AND scheduled_date = ? AND status IN ('active', 'paused');",
    routineId,
    dateISO,
  );
}

/** Removes every run of a routine on a day, whatever its status. */
export async function deleteExecutionsForRoutineDate(
  routineId: string,
  dateISO: ISODateString,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'DELETE FROM executions WHERE routine_id = ? AND scheduled_date = ?;',
    routineId,
    dateISO,
  );
}

import type { ISODateString } from '../types/common';
import type { RoutineExecution } from '../types/execution';
import { getDatabase } from './client';
import { rowToExecution, serialize, type ExecutionRow } from './mappers';

export async function saveExecution(execution: RoutineExecution): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO executions (
      id, routine_id, scheduled_date, started_at, completed_at,
      current_step_index, completed_step_ids, skipped_step_ids,
      status, step_started_at, accumulated_step_seconds
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
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

/** The single in-progress or paused run, used to restore state on launch. */
export async function getLiveExecution(): Promise<RoutineExecution | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ExecutionRow>(
    "SELECT * FROM executions WHERE status IN ('active', 'paused') ORDER BY started_at DESC LIMIT 1;",
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

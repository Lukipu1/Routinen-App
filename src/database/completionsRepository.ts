import type { ISODateString } from '../types/common';
import type { RoutineCompletion } from '../types/completion';
import { getDatabase } from './client';
import { rowToCompletion, serialize, type CompletionRow } from './mappers';

/**
 * Inserts or replaces the completion for a routine on a day. The unique
 * (routine_id, date) index guarantees at most one record per routine per day,
 * preventing duplicated day instances.
 */
export async function saveCompletion(completion: RoutineCompletion): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO completions (
       id, routine_id, date, completed, completed_steps, total_steps,
       duration, started_at, completed_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (routine_id, date) DO UPDATE SET
       completed = excluded.completed,
       completed_steps = excluded.completed_steps,
       total_steps = excluded.total_steps,
       duration = excluded.duration,
       started_at = excluded.started_at,
       completed_at = excluded.completed_at;`,
    completion.id,
    completion.routineId,
    completion.date,
    serialize.bool(completion.completed),
    completion.completedSteps,
    completion.totalSteps,
    completion.durationInSeconds,
    completion.startedAt,
    completion.completedAt,
  );
}

export async function getAllCompletions(): Promise<RoutineCompletion[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CompletionRow>(
    'SELECT * FROM completions ORDER BY date DESC;',
  );
  return rows.map(rowToCompletion);
}

export async function getCompletionsForDate(
  dateISO: ISODateString,
): Promise<RoutineCompletion[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CompletionRow>(
    'SELECT * FROM completions WHERE date = ?;',
    dateISO,
  );
  return rows.map(rowToCompletion);
}

export async function getCompletionsInRange(
  startISO: ISODateString,
  endISO: ISODateString,
): Promise<RoutineCompletion[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CompletionRow>(
    'SELECT * FROM completions WHERE date >= ? AND date <= ? ORDER BY date ASC;',
    startISO,
    endISO,
  );
  return rows.map(rowToCompletion);
}

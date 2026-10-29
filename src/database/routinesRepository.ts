import type { Routine } from '../types/routine';
import { getDatabase, withWriteTransaction } from './client';
import {
  rowToRoutine,
  serialize,
  type RoutineRow,
  type StepRow,
} from './mappers';

function groupSteps(stepRows: StepRow[]): Map<string, StepRow[]> {
  const map = new Map<string, StepRow[]>();
  for (const row of stepRows) {
    const list = map.get(row.routine_id) ?? [];
    list.push(row);
    map.set(row.routine_id, list);
  }
  return map;
}

export async function getAllRoutines(): Promise<Routine[]> {
  const db = await getDatabase();
  const routineRows = await db.getAllAsync<RoutineRow>(
    'SELECT * FROM routines ORDER BY created_at ASC;',
  );
  const stepRows = await db.getAllAsync<StepRow>('SELECT * FROM routine_steps;');
  const stepsByRoutine = groupSteps(stepRows);
  return routineRows.map((row) => rowToRoutine(row, stepsByRoutine.get(row.id) ?? []));
}

export async function getRoutineById(id: string): Promise<Routine | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<RoutineRow>('SELECT * FROM routines WHERE id = ?;', id);
  if (!row) return null;
  const stepRows = await db.getAllAsync<StepRow>(
    'SELECT * FROM routine_steps WHERE routine_id = ? ORDER BY position ASC;',
    id,
  );
  return rowToRoutine(row, stepRows);
}

/**
 * Inserts or updates a routine together with its steps, atomically.
 *
 * This must be a true UPSERT: `INSERT OR REPLACE` would delete the existing
 * row first, and with `ON DELETE CASCADE` on every child table that silently
 * wipes the routine's completions, executions and overrides.
 */
export async function saveRoutine(routine: Routine): Promise<void> {
  const db = await getDatabase();
  await withWriteTransaction(db, async (txn) => {
    await txn.runAsync(
      `INSERT INTO routines (
        id, title, description, icon, color, category, estimated_duration,
        reminder_enabled, reminder_minutes_before, reminder_second,
        schedule_enabled, schedule_weekdays, schedule_start_time, schedule_flexible,
        schedule_window, schedule_start_date, schedule_end_date,
        is_active, is_sample, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (id) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        icon = excluded.icon,
        color = excluded.color,
        category = excluded.category,
        estimated_duration = excluded.estimated_duration,
        reminder_enabled = excluded.reminder_enabled,
        reminder_minutes_before = excluded.reminder_minutes_before,
        reminder_second = excluded.reminder_second,
        schedule_enabled = excluded.schedule_enabled,
        schedule_weekdays = excluded.schedule_weekdays,
        schedule_start_time = excluded.schedule_start_time,
        schedule_flexible = excluded.schedule_flexible,
        schedule_window = excluded.schedule_window,
        schedule_start_date = excluded.schedule_start_date,
        schedule_end_date = excluded.schedule_end_date,
        is_active = excluded.is_active,
        is_sample = excluded.is_sample,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at;`,
      routine.id,
      routine.title,
      routine.description ?? null,
      routine.icon,
      routine.color,
      routine.category,
      routine.estimatedDuration,
      serialize.bool(routine.reminder.enabled),
      routine.reminder.minutesBefore,
      routine.reminder.secondReminderMinutes,
      serialize.bool(routine.schedule.enabled),
      serialize.weekdays(routine.schedule.weekdays),
      routine.schedule.startTime,
      serialize.bool(routine.schedule.flexible),
      serialize.timeWindow(routine.schedule.timeWindow),
      routine.schedule.startDate,
      routine.schedule.endDate,
      serialize.bool(routine.isActive),
      serialize.bool(routine.isSample),
      routine.createdAt,
      routine.updatedAt,
    );

    await txn.runAsync('DELETE FROM routine_steps WHERE routine_id = ?;', routine.id);
    for (const step of routine.steps) {
      await txn.runAsync(
        `INSERT INTO routine_steps (
          id, routine_id, title, note, duration, position, icon, can_skip, completion_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        step.id,
        routine.id,
        step.title,
        step.note ?? null,
        step.durationInSeconds,
        step.order,
        step.icon ?? null,
        serialize.bool(step.canSkip),
        step.completionType ?? null,
      );
    }
  });
}

export async function deleteRoutine(id: string): Promise<void> {
  const db = await getDatabase();
  // Steps, executions, completions and overrides cascade via foreign keys.
  await db.runAsync('DELETE FROM routines WHERE id = ?;', id);
}

export async function setRoutineActive(id: string, isActive: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE routines SET is_active = ?, updated_at = ? WHERE id = ?;',
    serialize.bool(isActive),
    new Date().toISOString(),
    id,
  );
}

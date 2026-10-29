import type { ISODateString } from '../types/common';
import { getDatabase, withWriteTransaction } from './client';

/** Which routines were required on which day: `{ [date]: routineIds }`. */
export type DayPlanIndex = Record<ISODateString, string[]>;

/**
 * Replaces the snapshot of required routines for one day. The app writes
 * today's snapshot whenever the plan changes; past days are never touched, so
 * statistics keep seeing the plan as it was.
 */
export async function replaceDayPlan(
  dateISO: ISODateString,
  routineIds: Iterable<string>,
): Promise<void> {
  const db = await getDatabase();
  await withWriteTransaction(db, async (txn) => {
    await txn.runAsync('DELETE FROM day_plans WHERE date = ?;', dateISO);
    for (const routineId of routineIds) {
      await txn.runAsync(
        'INSERT OR IGNORE INTO day_plans (date, routine_id) VALUES (?, ?);',
        dateISO,
        routineId,
      );
    }
  });
}

export async function getAllDayPlans(): Promise<DayPlanIndex> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ date: string; routine_id: string }>(
    'SELECT date, routine_id FROM day_plans ORDER BY date ASC;',
  );
  const index: DayPlanIndex = {};
  for (const row of rows) {
    (index[row.date] ??= []).push(row.routine_id);
  }
  return index;
}

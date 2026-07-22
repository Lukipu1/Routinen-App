import type { ISODateString } from '../types/common';
import type { PlanOverride } from '../types/planning';
import { getDatabase } from './client';
import { rowToOverride, serialize, type OverrideRow } from './mappers';

export async function saveOverride(override: PlanOverride): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO plan_overrides (
       id, routine_id, date, added, skipped, paused, start_time_override
     ) VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (routine_id, date) DO UPDATE SET
       added = excluded.added,
       skipped = excluded.skipped,
       paused = excluded.paused,
       start_time_override = excluded.start_time_override;`,
    override.id,
    override.routineId,
    override.date,
    serialize.bool(override.added),
    serialize.bool(override.skipped),
    serialize.bool(override.paused),
    override.startTimeOverride,
  );
}

export async function getAllOverrides(): Promise<PlanOverride[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<OverrideRow>('SELECT * FROM plan_overrides;');
  return rows.map(rowToOverride);
}

export async function getOverridesForDate(
  dateISO: ISODateString,
): Promise<PlanOverride[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<OverrideRow>(
    'SELECT * FROM plan_overrides WHERE date = ?;',
    dateISO,
  );
  return rows.map(rowToOverride);
}

export async function deleteOverride(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM plan_overrides WHERE id = ?;', id);
}

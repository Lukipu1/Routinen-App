import type { PlanOverride } from '../types/planning';
import { getDatabase } from './client';
import { mapValid, rowToOverride, serialize, validOverride, type OverrideRow } from './mappers';

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
  return mapValid(rows, rowToOverride, validOverride);
}

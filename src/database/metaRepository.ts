import { getDatabase } from './client';

interface MetaRow {
  value: string;
}

export async function getMeta(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<MetaRow>('SELECT value FROM meta WHERE key = ?;', key);
  return row?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO meta (key, value) VALUES (?, ?)
     ON CONFLICT (key) DO UPDATE SET value = excluded.value;`,
    key,
    value,
  );
}

export async function countRoutines(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM routines;',
  );
  return row?.count ?? 0;
}

/** Wipes all user data. Routines cascade to steps/executions/completions/overrides. */
export async function clearAllData(): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.execAsync(
      `DELETE FROM plan_overrides;
       DELETE FROM completions;
       DELETE FROM executions;
       DELETE FROM routine_steps;
       DELETE FROM routines;
       DELETE FROM meta;`,
    );
  });
}

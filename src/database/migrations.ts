import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Schema migrations. Each migration has a version and idempotent SQL. On
 * startup, `runMigrations` applies every migration newer than the database's
 * current `PRAGMA user_version` inside a transaction, then bumps the version.
 * To evolve the schema, append a new entry — never edit an existing one.
 */

const V1_SQL = `
CREATE TABLE IF NOT EXISTS routines (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  category TEXT NOT NULL,
  estimated_duration INTEGER NOT NULL DEFAULT 0,
  reminder_enabled INTEGER NOT NULL DEFAULT 0,
  reminder_minutes_before INTEGER NOT NULL DEFAULT 10,
  reminder_second INTEGER,
  schedule_enabled INTEGER NOT NULL DEFAULT 1,
  schedule_weekdays TEXT NOT NULL DEFAULT '[]',
  schedule_start_time TEXT,
  schedule_flexible INTEGER NOT NULL DEFAULT 0,
  schedule_window TEXT,
  schedule_start_date TEXT NOT NULL,
  schedule_end_date TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_sample INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS routine_steps (
  id TEXT PRIMARY KEY NOT NULL,
  routine_id TEXT NOT NULL,
  title TEXT NOT NULL,
  note TEXT,
  duration INTEGER,
  position INTEGER NOT NULL,
  icon TEXT,
  can_skip INTEGER NOT NULL DEFAULT 1,
  completion_type TEXT,
  FOREIGN KEY (routine_id) REFERENCES routines (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_steps_routine ON routine_steps (routine_id);

CREATE TABLE IF NOT EXISTS executions (
  id TEXT PRIMARY KEY NOT NULL,
  routine_id TEXT NOT NULL,
  scheduled_date TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  current_step_index INTEGER NOT NULL DEFAULT 0,
  completed_step_ids TEXT NOT NULL DEFAULT '[]',
  skipped_step_ids TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL,
  step_started_at TEXT,
  accumulated_step_seconds REAL NOT NULL DEFAULT 0,
  FOREIGN KEY (routine_id) REFERENCES routines (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_exec_routine_date ON executions (routine_id, scheduled_date);

CREATE TABLE IF NOT EXISTS completions (
  id TEXT PRIMARY KEY NOT NULL,
  routine_id TEXT NOT NULL,
  date TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  completed_steps INTEGER NOT NULL DEFAULT 0,
  total_steps INTEGER NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  FOREIGN KEY (routine_id) REFERENCES routines (id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_completion_routine_date ON completions (routine_id, date);
CREATE INDEX IF NOT EXISTS idx_completion_date ON completions (date);

CREATE TABLE IF NOT EXISTS plan_overrides (
  id TEXT PRIMARY KEY NOT NULL,
  routine_id TEXT NOT NULL,
  date TEXT NOT NULL,
  added INTEGER NOT NULL DEFAULT 0,
  skipped INTEGER NOT NULL DEFAULT 0,
  paused INTEGER NOT NULL DEFAULT 0,
  start_time_override TEXT,
  FOREIGN KEY (routine_id) REFERENCES routines (id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_override_routine_date ON plan_overrides (routine_id, date);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
`;

interface Migration {
  version: number;
  sql: string;
}

const MIGRATIONS: readonly Migration[] = [{ version: 1, sql: V1_SQL }];

/** The schema version a freshly migrated database ends up at. */
export const SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1]?.version ?? 0;

export class DatabaseTooNewError extends Error {
  constructor(found: number) {
    super(
      `Die Datenbank stammt aus einer neueren App-Version (Schema ${found}, erwartet ${SCHEMA_VERSION}).`,
    );
    this.name = 'DatabaseTooNewError';
  }
}

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const current = versionRow?.user_version ?? 0;
  if (current > SCHEMA_VERSION) throw new DatabaseTooNewError(current);

  for (const migration of MIGRATIONS) {
    if (migration.version > current) {
      // Schema change and version bump commit together, so a crash in between
      // can never leave a half-applied migration that looks finished.
      await db.withExclusiveTransactionAsync(async (txn) => {
        await txn.execAsync(migration.sql);
        // PRAGMA does not accept bound parameters; the version is a trusted int.
        await txn.execAsync(`PRAGMA user_version = ${migration.version};`);
      });
    }
  }
}

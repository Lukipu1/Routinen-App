import * as SQLite from 'expo-sqlite';

import { DATABASE_NAME } from '../constants/app';
import { runMigrations } from './migrations';

/**
 * Opens the SQLite database exactly once and runs migrations before first use.
 * All repositories await this, so the schema is guaranteed to exist.
 */
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DATABASE_NAME)
      .then(async (db) => {
        await runMigrations(db);
        return db;
      })
      .catch((error: unknown) => {
        // Don't cache a failed open: the next call (e.g. "Erneut versuchen")
        // should get a fresh attempt instead of the same rejection.
        dbPromise = null;
        throw error;
      });
  }
  return dbPromise;
}

/** Test/reset helper: drops the cached connection handle. */
export function resetDatabaseHandle(): void {
  dbPromise = null;
}

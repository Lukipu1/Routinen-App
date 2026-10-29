import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

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

/**
 * Runs `task` inside a write transaction. On native the transaction is
 * exclusive, so interleaved writes from elsewhere cannot slip in between the
 * statements; on web expo-sqlite has no exclusive mode, so the plain
 * transaction is used there.
 */
export async function withWriteTransaction(
  db: SQLite.SQLiteDatabase,
  task: (tx: SQLite.SQLiteDatabase) => Promise<void>,
): Promise<void> {
  if (Platform.OS === 'web') {
    await db.withTransactionAsync(() => task(db));
    return;
  }
  await db.withExclusiveTransactionAsync((txn) => task(txn));
}

/** Test/reset helper: drops the cached connection handle. */
export function resetDatabaseHandle(): void {
  dbPromise = null;
}

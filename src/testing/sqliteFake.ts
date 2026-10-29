import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

/**
 * A faithful stand-in for `expo-sqlite` backed by Node's built-in SQLite
 * (`node:sqlite`, Node ≥ 22.13). Repository tests run their real SQL against a
 * real engine — foreign keys, cascades, UPSERTs and unique indexes included —
 * instead of a no-op mock that would let data-loss bugs through.
 *
 * Only the subset of the expo-sqlite API used by `src/database` is provided.
 */

type Params = SQLInputValue[];

function bind(params: unknown[]): Params {
  return params.map((value) => {
    if (value === undefined) return null;
    if (typeof value === 'boolean') return value ? 1 : 0;
    return value as SQLInputValue;
  });
}

export class FakeSQLiteDatabase {
  private readonly db: DatabaseSync;

  constructor(db: DatabaseSync = new DatabaseSync(':memory:')) {
    this.db = db;
  }

  async execAsync(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  async runAsync(
    sql: string,
    ...params: unknown[]
  ): Promise<{ lastInsertRowId: number; changes: number }> {
    const result = this.db.prepare(sql).run(...bind(params));
    return { lastInsertRowId: Number(result.lastInsertRowid), changes: Number(result.changes) };
  }

  async getAllAsync<T>(sql: string, ...params: unknown[]): Promise<T[]> {
    return this.db.prepare(sql).all(...bind(params)) as T[];
  }

  async getFirstAsync<T>(sql: string, ...params: unknown[]): Promise<T | null> {
    const row = this.db.prepare(sql).get(...bind(params));
    return (row as T | undefined) ?? null;
  }

  async withTransactionAsync(task: () => Promise<void>): Promise<void> {
    await this.runInTransaction(() => task());
  }

  async withExclusiveTransactionAsync(
    task: (txn: FakeSQLiteDatabase) => Promise<void>,
  ): Promise<void> {
    await this.runInTransaction(() => task(this));
  }

  async closeAsync(): Promise<void> {
    this.db.close();
  }

  private async runInTransaction(task: () => Promise<void>): Promise<void> {
    this.db.exec('BEGIN;');
    try {
      await task();
      this.db.exec('COMMIT;');
    } catch (error) {
      this.db.exec('ROLLBACK;');
      throw error;
    }
  }
}

/**
 * Factory for `jest.mock('expo-sqlite', () => createExpoSqliteMock())`.
 * Every `openDatabaseAsync` call returns the same in-memory database until
 * `reset()` is called, mirroring one persistent file per app install.
 */
export function createExpoSqliteMock(): {
  openDatabaseAsync: () => Promise<FakeSQLiteDatabase>;
  reset: () => void;
  /** Makes the next `openDatabaseAsync` reject, to test startup failures. */
  failNextOpen: (error: Error) => void;
} {
  let shared: FakeSQLiteDatabase | null = null;
  let pendingFailure: Error | null = null;
  return {
    openDatabaseAsync: async () => {
      if (pendingFailure) {
        const error = pendingFailure;
        pendingFailure = null;
        throw error;
      }
      if (!shared) shared = new FakeSQLiteDatabase();
      return shared;
    },
    reset: () => {
      shared = null;
      pendingFailure = null;
    },
    failNextOpen: (error) => {
      pendingFailure = error;
    },
  };
}

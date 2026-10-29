/**
 * Repository tests against a real SQLite engine (node:sqlite). These exercise
 * the actual SQL — foreign keys, cascades, UPSERT conflict handling and unique
 * indexes — which a no-op mock cannot.
 */
import * as db from '..';
import { DatabaseTooNewError, SCHEMA_VERSION } from '../migrations';
import { makeCompletion, makeExecution, makeRoutine, makeStep } from '../../testing/factories';
import type { PlanOverride } from '../../types/planning';

const DATE = '2026-07-22';

function override(routineId: string, patch: Partial<PlanOverride> = {}): PlanOverride {
  return {
    id: `ov-${routineId}-${patch.date ?? DATE}`,
    routineId,
    date: DATE,
    added: false,
    skipped: false,
    paused: false,
    startTimeOverride: null,
    ...patch,
  };
}

async function count(table: string): Promise<number> {
  const handle = await db.getDatabase();
  const row = await handle.getFirstAsync<{ c: number }>(`SELECT COUNT(*) AS c FROM ${table};`);
  return row?.c ?? 0;
}

beforeEach(async () => {
  // Fresh in-memory database per test.
  const sqlite = jest.requireMock('expo-sqlite') as { reset: () => void };
  sqlite.reset();
  db.resetDatabaseHandle();
  await db.getDatabase();
});

describe('migrations', () => {
  it('brings a fresh database to the current schema version', async () => {
    const handle = await db.getDatabase();
    const row = await handle.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
    expect(row?.user_version).toBe(SCHEMA_VERSION);
    expect(SCHEMA_VERSION).toBeGreaterThan(0);
  });

  it('refuses a database written by a newer app version', async () => {
    const handle = await db.getDatabase();
    await handle.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION + 1};`);
    await expect(db.runMigrations(handle)).rejects.toBeInstanceOf(DatabaseTooNewError);
  });
});

describe('saveRoutine', () => {
  it('round-trips a routine with its steps in order', async () => {
    const routine = makeRoutine({
      id: 'r1',
      description: 'Beschreibung',
      steps: [
        makeStep({ id: 's1', order: 0, title: 'Eins', durationInSeconds: 60, note: 'Hinweis' }),
        makeStep({ id: 's2', order: 1, title: 'Zwei', durationInSeconds: null }),
      ],
      schedule: { weekdays: [1, 3, 5], timeWindow: { start: '06:00', end: '09:00' } },
    });
    await db.saveRoutine(routine);
    expect(await db.getRoutineById('r1')).toEqual(routine);
    expect(await db.getAllRoutines()).toHaveLength(1);
  });

  it('keeps completions, executions and overrides when the routine is saved again', async () => {
    // Regression: INSERT OR REPLACE deleted the parent row first, and the
    // ON DELETE CASCADE foreign keys silently wiped every child record.
    const routine = makeRoutine({ id: 'r1' });
    await db.saveRoutine(routine);
    await db.saveCompletion(makeCompletion({ routineId: 'r1', date: DATE }));
    await db.saveExecution(makeExecution({ routineId: 'r1', scheduledDate: DATE }));
    await db.saveOverride(override('r1', { skipped: true }));

    await db.saveRoutine({ ...routine, title: 'Umbenannt', updatedAt: '2026-07-22T10:00:00.000Z' });
    await db.saveRoutine({ ...routine, isActive: false });

    expect(await count('completions')).toBe(1);
    expect(await count('executions')).toBe(1);
    expect(await count('plan_overrides')).toBe(1);
    expect((await db.getRoutineById('r1'))?.isActive).toBe(false);
  });

  it('replaces the step list on update (removed steps disappear)', async () => {
    const routine = makeRoutine({
      id: 'r1',
      steps: [makeStep({ id: 'a', order: 0 }), makeStep({ id: 'b', order: 1 })],
    });
    await db.saveRoutine(routine);
    await db.saveRoutine({ ...routine, steps: [makeStep({ id: 'c', order: 0 })] });
    expect((await db.getRoutineById('r1'))?.steps.map((s) => s.id)).toEqual(['c']);
    expect(await count('routine_steps')).toBe(1);
  });

  it('rolls the whole save back when a step insert fails', async () => {
    const routine = makeRoutine({ id: 'r1', steps: [makeStep({ id: 'a', order: 0 })] });
    await db.saveRoutine(routine);
    const broken = makeRoutine({
      id: 'r2',
      // Duplicate step primary key across routines violates the PK.
      steps: [makeStep({ id: 'a', order: 0 })],
    });
    await expect(db.saveRoutine(broken)).rejects.toThrow();
    expect(await db.getRoutineById('r2')).toBeNull();
    expect(await count('routines')).toBe(1);
  });
});

describe('deleteRoutine', () => {
  it('cascades to steps, executions, completions and overrides', async () => {
    await db.saveRoutine(makeRoutine({ id: 'r1' }));
    await db.saveRoutine(makeRoutine({ id: 'r2' }));
    await db.saveCompletion(makeCompletion({ routineId: 'r1', date: DATE }));
    await db.saveCompletion(makeCompletion({ routineId: 'r2', date: DATE }));
    await db.saveExecution(makeExecution({ routineId: 'r1', scheduledDate: DATE }));
    await db.saveOverride(override('r1'));

    await db.deleteRoutine('r1');

    expect(await db.getAllRoutines()).toHaveLength(1);
    expect(await count('routine_steps')).toBe(2);
    expect(await count('completions')).toBe(1);
    expect(await count('executions')).toBe(0);
    expect(await count('plan_overrides')).toBe(0);
  });
});

describe('completions and overrides', () => {
  it('stores at most one completion per routine and day', async () => {
    await db.saveRoutine(makeRoutine({ id: 'r1' }));
    await db.saveCompletion(makeCompletion({ id: 'c1', routineId: 'r1', date: DATE, completed: false }));
    await db.saveCompletion(makeCompletion({ id: 'c2', routineId: 'r1', date: DATE, completed: true }));
    const all = await db.getAllCompletions();
    expect(all).toHaveLength(1);
    expect(all[0]?.completed).toBe(true);
  });

  it('merges overrides per routine and day', async () => {
    await db.saveRoutine(makeRoutine({ id: 'r1' }));
    await db.saveOverride(override('r1', { skipped: true }));
    await db.saveOverride(override('r1', { skipped: false, startTimeOverride: '09:30' }));
    const all = await db.getAllOverrides();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ skipped: false, startTimeOverride: '09:30' });
  });

  it('rejects children of a routine that does not exist', async () => {
    await expect(db.saveCompletion(makeCompletion({ routineId: 'ghost', date: DATE }))).rejects.toThrow();
  });
});

describe('executions', () => {
  it('updates a run in place and lists live runs across days', async () => {
    await db.saveRoutine(makeRoutine({ id: 'r1' }));
    const run = makeExecution({ id: 'e1', routineId: 'r1', scheduledDate: '2026-07-21', status: 'paused' });
    await db.saveExecution(run);
    await db.saveExecution({ ...run, currentStepIndex: 1, activeSeconds: 42.5 });
    await db.saveExecution(makeExecution({ id: 'e2', routineId: 'r1', scheduledDate: DATE, status: 'completed' }));

    expect(await count('executions')).toBe(2);
    const live = await db.getLiveExecutions();
    expect(live.map((e) => e.id)).toEqual(['e1']);
    expect(live[0]?.currentStepIndex).toBe(1);
    expect(live[0]?.activeSeconds).toBe(42.5);
    expect(await db.getExecutionsForDate(DATE)).toHaveLength(1);
  });

  it('clears only live runs of the given routine and day', async () => {
    await db.saveRoutine(makeRoutine({ id: 'r1' }));
    await db.saveExecution(makeExecution({ id: 'live', routineId: 'r1', scheduledDate: DATE, status: 'active' }));
    await db.saveExecution(makeExecution({ id: 'done', routineId: 'r1', scheduledDate: DATE, status: 'completed' }));
    await db.clearLiveExecutionsForRoutineDate('r1', DATE);
    expect((await db.getExecutionsForDate(DATE)).map((e) => e.id)).toEqual(['done']);
  });
});

describe('day plans', () => {
  it('replaces one day without touching other days and cascades on delete', async () => {
    await db.saveRoutine(makeRoutine({ id: 'r1' }));
    await db.saveRoutine(makeRoutine({ id: 'r2' }));
    await db.replaceDayPlan('2026-07-21', ['r1', 'r2']);
    await db.replaceDayPlan(DATE, ['r1']);
    await db.replaceDayPlan(DATE, ['r2', 'r2']);

    expect(await db.getAllDayPlans()).toEqual({ '2026-07-21': ['r1', 'r2'], [DATE]: ['r2'] });

    await db.deleteRoutine('r2');
    expect(await db.getAllDayPlans()).toEqual({ '2026-07-21': ['r1'] });
  });
});

describe('meta and clearAllData', () => {
  it('wipes user data but keeps the meta table', async () => {
    await db.saveRoutine(makeRoutine({ id: 'r1' }));
    await db.saveCompletion(makeCompletion({ routineId: 'r1', date: DATE }));
    await db.setMeta(db.META_KEYS.sampleDataSeeded, '1');

    await db.clearAllData();

    expect(await db.countRoutines()).toBe(0);
    expect(await count('completions')).toBe(0);
    expect(await db.getMeta(db.META_KEYS.sampleDataSeeded)).toBe('1');
  });
});

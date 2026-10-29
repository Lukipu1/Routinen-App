import * as db from '../../database';
import { makeCompletion, makeRoutine } from '../../testing/factories';
import { buildBackup, parseBackup, restoreBackup } from '../backup';

jest.mock('expo-file-system', () => ({ File: jest.fn(), Paths: { cache: '/cache' } }));
jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));
jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));

beforeEach(async () => {
  (jest.requireMock('expo-sqlite') as { reset: () => void }).reset();
  db.resetDatabaseHandle();
  await db.getDatabase();
});

describe('backup', () => {
  it('round-trips routines, completions, overrides and day plans', async () => {
    const routine = makeRoutine({ id: 'r1', title: 'Morgen' });
    await db.saveRoutine(routine);
    await db.saveCompletion(makeCompletion({ routineId: 'r1', date: '2026-07-21' }));
    await db.saveOverride({
      id: 'o1',
      routineId: 'r1',
      date: '2026-07-22',
      added: false,
      skipped: true,
      paused: false,
      startTimeOverride: null,
    });
    await db.replaceDayPlan('2026-07-21', ['r1']);

    const text = JSON.stringify(await buildBackup(new Date('2026-07-22T10:00:00Z')));
    const backup = parseBackup(text);

    // Wipe, then restore from the text.
    await db.clearAllData();
    expect(await db.getAllRoutines()).toHaveLength(0);
    const summary = await restoreBackup(backup);

    expect(summary).toEqual({ routines: 1, completions: 1, overrides: 1 });
    expect(await db.getRoutineById('r1')).toEqual(routine);
    expect(await db.getAllCompletions()).toHaveLength(1);
    expect(await db.getAllOverrides()).toHaveLength(1);
    expect(await db.getAllDayPlans()).toEqual({ '2026-07-21': ['r1'] });
    expect(await db.getMeta(db.META_KEYS.sampleDataSeeded)).toBe('1');
  });

  it('rejects files that are not a backup', () => {
    expect(() => parseBackup('not json')).toThrow('kein gültiges JSON');
    expect(() => parseBackup(JSON.stringify({ format: 'other' }))).toThrow('keine gültige');
    expect(() =>
      parseBackup(
        JSON.stringify({
          format: 'routinen-backup',
          version: 1,
          exportedAt: 'x',
          routines: [{ id: 'broken' }],
          completions: [],
          overrides: [],
        }),
      ),
    ).toThrow('keine gültige');
  });

  it('drops records that point at routines missing from the file', async () => {
    const backup = parseBackup(
      JSON.stringify({
        format: 'routinen-backup',
        version: 1,
        exportedAt: '2026-07-22T10:00:00.000Z',
        routines: [makeRoutine({ id: 'r1' })],
        completions: [makeCompletion({ routineId: 'ghost', date: '2026-07-21' })],
        overrides: [],
        dayPlans: { '2026-07-21': ['r1', 'ghost'] },
      }),
    );
    const summary = await restoreBackup(backup);
    expect(summary.completions).toBe(0);
    expect(await db.getAllDayPlans()).toEqual({ '2026-07-21': ['r1'] });
  });
});

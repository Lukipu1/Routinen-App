import { makeCompletion, makeExecution, makeRoutine } from '../../../testing/factories';
import type { PlanOverride } from '../../../types/planning';
import {
  buildPlannedRoutines,
  computeDayProgress,
  selectNextRoutine,
} from '../today';

const TODAY = '2026-07-22';
const YESTERDAY = '2026-07-21';
// Local 09:00 on TODAY, timezone-independent.
const NOW = new Date(2026, 6, 22, 9, 0, 0);

function override(routineId: string, patch: Partial<PlanOverride>): PlanOverride {
  return {
    id: `ov-${routineId}`,
    routineId,
    date: TODAY,
    added: false,
    skipped: false,
    paused: false,
    startTimeOverride: null,
    ...patch,
  };
}

describe('buildPlannedRoutines', () => {
  it('marks a due routine as ready and a later one as planned', () => {
    const due = makeRoutine({ id: 'a', schedule: { startTime: '08:30' } });
    const later = makeRoutine({ id: 'b', schedule: { startTime: '12:00' } });
    const planned = buildPlannedRoutines({
      routines: [due, later],
      dateISO: TODAY,
      overrides: [],
      executions: [],
      completions: [],
      now: NOW,
    });
    expect(planned.find((p) => p.routine.id === 'a')?.status).toBe('ready');
    expect(planned.find((p) => p.routine.id === 'b')?.status).toBe('planned');
  });

  it('sorts by start time with flexible routines last', () => {
    const late = makeRoutine({ id: 'late', schedule: { startTime: '20:00' } });
    const early = makeRoutine({ id: 'early', schedule: { startTime: '06:00' } });
    const flexible = makeRoutine({ id: 'flex', schedule: { flexible: true, startTime: null } });
    const planned = buildPlannedRoutines({
      routines: [late, flexible, early],
      dateISO: TODAY,
      overrides: [],
      executions: [],
      completions: [],
      now: NOW,
    });
    expect(planned.map((p) => p.routine.id)).toEqual(['early', 'late', 'flex']);
  });

  it('uses a completion to mark a routine completed', () => {
    const routine = makeRoutine({ id: 'a' });
    const planned = buildPlannedRoutines({
      routines: [routine],
      dateISO: TODAY,
      overrides: [],
      executions: [],
      completions: [makeCompletion({ routineId: 'a', date: TODAY, completed: true })],
      now: NOW,
    });
    expect(planned[0]?.status).toBe('completed');
  });

  it('reflects a paused execution', () => {
    const routine = makeRoutine({ id: 'a' });
    const planned = buildPlannedRoutines({
      routines: [routine],
      dateISO: TODAY,
      overrides: [],
      executions: [makeExecution({ routineId: 'a', scheduledDate: TODAY, status: 'paused' })],
      completions: [],
      now: NOW,
    });
    expect(planned[0]?.status).toBe('paused');
  });

  it('treats a skip override as skipped, not missed', () => {
    const routine = makeRoutine({ id: 'a', schedule: { startTime: '06:00' } });
    const planned = buildPlannedRoutines({
      routines: [routine],
      dateISO: TODAY,
      overrides: [override('a', { skipped: true })],
      executions: [],
      completions: [],
      now: NOW,
    });
    expect(planned[0]?.status).toBe('skipped');
  });

  it('marks a past, unfinished routine as missed', () => {
    const routine = makeRoutine({ id: 'a' });
    const planned = buildPlannedRoutines({
      routines: [routine],
      dateISO: YESTERDAY,
      overrides: [],
      executions: [],
      completions: [],
      now: NOW,
    });
    expect(planned[0]?.status).toBe('missed');
  });

  it('includes ad-hoc added routines outside their recurrence', () => {
    const routine = makeRoutine({ id: 'a', schedule: { weekdays: [] } });
    const planned = buildPlannedRoutines({
      routines: [routine],
      dateISO: TODAY,
      overrides: [override('a', { added: true, startTimeOverride: '10:00' })],
      executions: [],
      completions: [],
      now: NOW,
    });
    expect(planned).toHaveLength(1);
    expect(planned[0]?.isAdHoc).toBe(true);
    expect(planned[0]?.startTime).toBe('10:00');
  });

  it('excludes inactive routines that were not added', () => {
    const routine = makeRoutine({ id: 'a', isActive: false });
    const planned = buildPlannedRoutines({
      routines: [routine],
      dateISO: TODAY,
      overrides: [],
      executions: [],
      completions: [],
      now: NOW,
    });
    expect(planned).toHaveLength(0);
  });
});

describe('selectNextRoutine', () => {
  it('prefers an in-progress routine over an upcoming one', () => {
    const active = makeRoutine({ id: 'active', schedule: { startTime: '08:00' } });
    const upcoming = makeRoutine({ id: 'upcoming', schedule: { startTime: '18:00' } });
    const planned = buildPlannedRoutines({
      routines: [active, upcoming],
      dateISO: TODAY,
      overrides: [],
      executions: [makeExecution({ routineId: 'active', scheduledDate: TODAY, status: 'active' })],
      completions: [],
      now: NOW,
    });
    expect(selectNextRoutine(planned)?.routine.id).toBe('active');
  });
});

describe('computeDayProgress', () => {
  it('counts completed routines over the total planned', () => {
    const a = makeRoutine({ id: 'a' });
    const b = makeRoutine({ id: 'b' });
    const planned = buildPlannedRoutines({
      routines: [a, b],
      dateISO: TODAY,
      overrides: [],
      executions: [],
      completions: [makeCompletion({ routineId: 'a', date: TODAY, completed: true })],
      now: NOW,
    });
    const progress = computeDayProgress(planned);
    expect(progress).toEqual({ completed: 1, total: 2, skipped: 0, fraction: 0.5 });
  });

  it('leaves routines skipped for the day out of the total', () => {
    const a = makeRoutine({ id: 'a' });
    const b = makeRoutine({ id: 'b' });
    const planned = buildPlannedRoutines({
      routines: [a, b],
      dateISO: TODAY,
      overrides: [override('b', { skipped: true })],
      executions: [],
      completions: [makeCompletion({ routineId: 'a', date: TODAY, completed: true })],
      now: NOW,
    });
    expect(computeDayProgress(planned)).toEqual({ completed: 1, total: 1, skipped: 1, fraction: 1 });
  });
});

describe('late-day statuses', () => {
  const LATE = new Date(2026, 6, 22, 22, 0, 0); // 22:00 today

  it('turns a routine overdue once its slot plus grace has passed', () => {
    const morning = makeRoutine({ id: 'm', schedule: { startTime: '07:00' }, estimatedDuration: 600 });
    const evening = makeRoutine({ id: 'e', schedule: { startTime: '21:30' }, estimatedDuration: 600 });
    const planned = buildPlannedRoutines({
      routines: [morning, evening],
      dateISO: TODAY,
      overrides: [],
      executions: [],
      completions: [],
      now: LATE,
    });
    expect(planned.find((p) => p.routine.id === 'm')?.status).toBe('overdue');
    expect(planned.find((p) => p.routine.id === 'e')?.status).toBe('ready');
    // The due one wins over the overdue one.
    expect(selectNextRoutine(planned)?.routine.id).toBe('e');
  });

  it('suggests the most recent overdue routine when nothing is due', () => {
    const morning = makeRoutine({ id: 'm', schedule: { startTime: '07:00' } });
    const noon = makeRoutine({ id: 'n', schedule: { startTime: '12:00' } });
    const planned = buildPlannedRoutines({
      routines: [morning, noon],
      dateISO: TODAY,
      overrides: [],
      executions: [],
      completions: [],
      now: LATE,
    });
    expect(planned.map((p) => p.status)).toEqual(['overdue', 'overdue']);
    expect(selectNextRoutine(planned)?.routine.id).toBe('n');
  });

  it('shows an ended run as abandoned, not skipped', () => {
    const routine = makeRoutine({ id: 'a' });
    const planned = buildPlannedRoutines({
      routines: [routine],
      dateISO: TODAY,
      overrides: [],
      executions: [makeExecution({ routineId: 'a', scheduledDate: TODAY, status: 'abandoned' })],
      completions: [makeCompletion({ routineId: 'a', date: TODAY, completed: false })],
      now: NOW,
    });
    expect(planned[0]?.status).toBe('abandoned');
    expect(computeDayProgress(planned)).toMatchObject({ completed: 0, total: 1 });
  });
});

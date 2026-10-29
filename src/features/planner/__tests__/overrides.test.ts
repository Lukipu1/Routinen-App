import { makeRoutine } from '../../../testing/factories';
import { buildPlannedRoutines } from '../today';
import {
  addRoutineForDay,
  findOverride,
  moveRoutineForDay,
  pauseRoutineForDay,
  skipRoutineForDay,
  upsertOverride,
} from '../overrides';

const TODAY = '2026-07-22';
const TOMORROW = '2026-07-23';
const NOW = new Date(2026, 6, 22, 9, 0, 0);

describe('plan overrides', () => {
  it('creates and merges overrides for a (routine, date)', () => {
    let overrides = skipRoutineForDay([], 'r', TODAY);
    expect(findOverride(overrides, 'r', TODAY)?.skipped).toBe(true);
    overrides = moveRoutineForDay(overrides, 'r', TODAY, '10:30');
    const merged = findOverride(overrides, 'r', TODAY);
    expect(merged?.skipped).toBe(true);
    expect(merged?.startTimeOverride).toBe('10:30');
    expect(overrides).toHaveLength(1);
  });

  it('supports skip, pause and ad-hoc add', () => {
    expect(findOverride(pauseRoutineForDay([], 'r', TODAY), 'r', TODAY)?.paused).toBe(true);
    const added = findOverride(addRoutineForDay([], 'r', TODAY, '08:00'), 'r', TODAY);
    expect(added?.added).toBe(true);
    expect(added?.startTimeOverride).toBe('08:00');
  });

  it('planning a routine for a day lifts a skip and keeps a moved time', () => {
    let overrides = skipRoutineForDay([], 'r', TODAY);
    overrides = moveRoutineForDay(overrides, 'r', TODAY, '09:30');
    overrides = addRoutineForDay(overrides, 'r', TODAY);
    const result = findOverride(overrides, 'r', TODAY);
    expect(result).toMatchObject({ added: true, skipped: false, startTimeOverride: '09:30' });
  });

  it('upsert keeps a single record per (routine, date)', () => {
    let overrides = upsertOverride([], 'r', TODAY, { skipped: true });
    overrides = upsertOverride(overrides, 'r', TODAY, { paused: true });
    expect(overrides).toHaveLength(1);
  });

  it('moving only today does not change future days', () => {
    const routine = makeRoutine({ id: 'r', schedule: { startTime: '07:00' } });
    const overrides = moveRoutineForDay([], 'r', TODAY, '11:00');

    const todayPlan = buildPlannedRoutines({
      routines: [routine],
      dateISO: TODAY,
      overrides: overrides.filter((o) => o.date === TODAY),
      executions: [],
      completions: [],
      now: NOW,
    });
    const tomorrowPlan = buildPlannedRoutines({
      routines: [routine],
      dateISO: TOMORROW,
      overrides: overrides.filter((o) => o.date === TOMORROW),
      executions: [],
      completions: [],
      now: NOW,
    });

    expect(todayPlan[0]?.startTime).toBe('11:00');
    expect(tomorrowPlan[0]?.startTime).toBe('07:00');
  });
});

import { makeRoutine } from '../../../testing/factories';
import { buildPlannedRoutines } from '../today';
import { detectOverlaps, hasOverlaps } from '../overlaps';

const TODAY = '2026-07-22';
const NOW = new Date(2026, 6, 22, 9, 0, 0);

function planFor(routines: ReturnType<typeof makeRoutine>[]) {
  return buildPlannedRoutines({
    routines,
    dateISO: TODAY,
    overrides: [],
    executions: [],
    completions: [],
    now: NOW,
  });
}

describe('detectOverlaps', () => {
  it('detects overlapping timed routines', () => {
    const a = makeRoutine({ id: 'a', estimatedDuration: 1800, schedule: { startTime: '07:00' } });
    const b = makeRoutine({ id: 'b', estimatedDuration: 1800, schedule: { startTime: '07:15' } });
    const conflicts = detectOverlaps(planFor([a, b]));
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.overlapMinutes).toBe(15);
  });

  it('returns none for back-to-back routines', () => {
    const a = makeRoutine({ id: 'a', estimatedDuration: 1800, schedule: { startTime: '07:00' } });
    const b = makeRoutine({ id: 'b', estimatedDuration: 1800, schedule: { startTime: '07:30' } });
    expect(hasOverlaps(planFor([a, b]))).toBe(false);
  });

  it('ignores flexible routines', () => {
    const a = makeRoutine({ id: 'a', estimatedDuration: 1800, schedule: { startTime: '07:00' } });
    const flex = makeRoutine({ id: 'flex', estimatedDuration: 1800, schedule: { flexible: true, startTime: null } });
    expect(hasOverlaps(planFor([a, flex]))).toBe(false);
  });
});

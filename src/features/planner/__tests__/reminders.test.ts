import { makeCompletion, makeRoutine } from '../../../testing/factories';
import type { PlanOverride } from '../../../types/planning';
import { MAX_SCHEDULED_REMINDERS, planReminders } from '../reminders';

const TODAY = '2026-07-22'; // Wednesday
const NOW = new Date(2026, 6, 22, 6, 0, 0); // 06:00 local

function override(routineId: string, date: string, patch: Partial<PlanOverride>): PlanOverride {
  return {
    id: `ov-${routineId}-${date}`,
    routineId,
    date,
    added: false,
    skipped: false,
    paused: false,
    startTimeOverride: null,
    ...patch,
  };
}

const daily = makeRoutine({
  id: 'r',
  title: 'Morgen',
  schedule: { startTime: '07:00' },
  reminder: { enabled: true, minutesBefore: 10, secondReminderMinutes: null },
});

function plan(
  routines = [daily],
  overrides: PlanOverride[] = [],
  completions = [] as ReturnType<typeof makeCompletion>[],
  days = 3,
) {
  return planReminders({ routines, overrides, completions, fromISO: TODAY, days, now: NOW });
}

describe('planReminders', () => {
  it('fires minutesBefore the start on each planned day', () => {
    const result = plan();
    expect(result.map((r) => r.dateISO)).toEqual(['2026-07-22', '2026-07-23', '2026-07-24']);
    expect(result[0]?.fireAt).toEqual(new Date(2026, 6, 22, 6, 50, 0));
  });

  it('skips days the routine is skipped, paused or already completed', () => {
    const result = plan(
      [daily],
      [override('r', '2026-07-22', { skipped: true }), override('r', '2026-07-23', { paused: true })],
      [makeCompletion({ routineId: 'r', date: '2026-07-24', completed: true })],
    );
    expect(result).toEqual([]);
  });

  it('uses the moved time for a day and includes ad-hoc additions', () => {
    const weekend = makeRoutine({
      id: 'w',
      title: 'Wochenende',
      schedule: { weekdays: [0, 6], startTime: '10:00' },
      reminder: { enabled: true, minutesBefore: 0, secondReminderMinutes: null },
    });
    const result = plan(
      [daily, weekend],
      [
        override('r', '2026-07-22', { startTimeOverride: '09:00' }),
        override('w', '2026-07-22', { added: true }),
      ],
      [],
      1,
    );
    expect(result.map((r) => [r.routineId, r.fireAt.getHours(), r.fireAt.getMinutes()])).toEqual([
      ['r', 8, 50],
      ['w', 10, 0],
    ]);
  });

  it('leaves out reminders that are already in the past', () => {
    const late = new Date(2026, 6, 22, 7, 30, 0);
    const result = planReminders({
      routines: [daily],
      overrides: [],
      completions: [],
      fromISO: TODAY,
      days: 1,
      now: late,
    });
    expect(result).toEqual([]);
  });

  it('ignores flexible, inactive and reminder-less routines', () => {
    const flexible = makeRoutine({
      id: 'f',
      schedule: { flexible: true, startTime: null },
      reminder: { enabled: true, minutesBefore: 5, secondReminderMinutes: null },
    });
    const inactive = makeRoutine({ id: 'i', isActive: false, reminder: { enabled: true } });
    const silent = makeRoutine({ id: 's', reminder: { enabled: false } });
    expect(plan([flexible, inactive, silent])).toEqual([]);
  });

  it('adds the optional follow-up reminder and caps the total', () => {
    const withSecond = makeRoutine({
      id: 'r2',
      schedule: { startTime: '07:00' },
      reminder: { enabled: true, minutesBefore: 10, secondReminderMinutes: 15 },
    });
    const one = plan([withSecond], [], [], 1);
    expect(one.map((r) => r.fireAt.getMinutes())).toEqual([50, 15]);

    const many = plan([withSecond], [], [], 60);
    expect(many).toHaveLength(MAX_SCHEDULED_REMINDERS);
    // Soonest first: nothing later than the cutoff sneaks in ahead of earlier ones.
    for (let i = 1; i < many.length; i += 1) {
      expect(many[i]!.fireAt.getTime()).toBeGreaterThanOrEqual(many[i - 1]!.fireAt.getTime());
    }
  });
});

import { makeCompletion, makeRoutine } from '../../../testing/factories';
import type { PlanOverride } from '../../../types/planning';
import {
  computeCurrentStreak,
  computeLongestStreak,
  weeklyOverview,
} from '../stats';

const TODAY = '2026-07-22';

function completedOn(dates: string[]) {
  return dates.map((date) => makeCompletion({ routineId: 'r', date, completed: true }));
}

function pausedOn(date: string): PlanOverride {
  return {
    id: `p-${date}`,
    routineId: 'r',
    date,
    added: false,
    skipped: false,
    paused: true,
    startTimeOverride: null,
  };
}

describe('streaks', () => {
  const routine = makeRoutine({ id: 'r' }); // daily

  it('counts consecutive completed days ending today', () => {
    const completions = completedOn(['2026-07-20', '2026-07-21', '2026-07-22']);
    expect(computeCurrentStreak([routine], completions, [], TODAY)).toBe(3);
  });

  it('does not break the streak for an unfinished today', () => {
    const completions = completedOn(['2026-07-20', '2026-07-21']);
    expect(computeCurrentStreak([routine], completions, [], TODAY)).toBe(2);
  });

  it('treats a paused day as excused, keeping the streak alive', () => {
    const completions = completedOn(['2026-07-20', '2026-07-22']);
    const overrides = [pausedOn('2026-07-21')];
    expect(computeCurrentStreak([routine], completions, overrides, TODAY)).toBe(2);
  });

  it('breaks the streak on a genuinely missed past day', () => {
    const completions = completedOn(['2026-07-22', '2026-07-20']);
    // 2026-07-21 required but neither completed nor excused -> break.
    expect(computeCurrentStreak([routine], completions, [], TODAY)).toBe(1);
  });

  it('computes the longest streak across a range', () => {
    const completions = completedOn([
      '2026-07-10',
      '2026-07-11',
      '2026-07-12',
      // gap on 13
      '2026-07-15',
      '2026-07-16',
    ]);
    expect(computeLongestStreak([routine], completions, [], '2026-07-10', TODAY)).toBe(3);
  });
});

describe('weeklyOverview', () => {
  it('returns seven days with planned and completed counts', () => {
    const routine = makeRoutine({ id: 'r' });
    const week = weeklyOverview([routine], completedOn([TODAY]), [], TODAY, 1);
    expect(week).toHaveLength(7);
    const today = week.find((d) => d.date === TODAY);
    expect(today?.plannedCount).toBe(1);
    expect(today?.completedCount).toBe(1);
    expect(today?.isToday).toBe(true);
  });
});

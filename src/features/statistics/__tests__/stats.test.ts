import { makeCompletion, makeRoutine } from '../../../testing/factories';
import type { PlanOverride } from '../../../types/planning';
import type { Routine } from '../../../types/routine';
import type { RoutineCompletion } from '../../../types/completion';
import {
  computeCurrentStreak,
  computeLongestStreak,
  computeOverallStats,
  requiredRoutineIdsForDay,
  routineStats,
  weeklyOverview,
  type StatsInput,
} from '../stats';

const TODAY = '2026-07-22';

function completedOn(dates: string[], routineId = 'r'): RoutineCompletion[] {
  return dates.map((date) => makeCompletion({ routineId, date, completed: true }));
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

function input(
  routines: Routine[],
  completions: RoutineCompletion[],
  overrides: PlanOverride[] = [],
  dayPlans?: StatsInput['dayPlans'],
): StatsInput {
  return { routines, completions, overrides, dayPlans, todayISO: TODAY };
}

describe('streaks', () => {
  const routine = makeRoutine({ id: 'r' }); // daily

  it('counts consecutive completed days ending today', () => {
    const completions = completedOn(['2026-07-20', '2026-07-21', '2026-07-22']);
    expect(computeCurrentStreak(input([routine], completions))).toBe(3);
  });

  it('does not break the streak for an unfinished today', () => {
    const completions = completedOn(['2026-07-20', '2026-07-21']);
    expect(computeCurrentStreak(input([routine], completions))).toBe(2);
  });

  it('treats a paused day as excused, keeping the streak alive', () => {
    const completions = completedOn(['2026-07-20', '2026-07-22']);
    const overrides = [pausedOn('2026-07-21')];
    expect(computeCurrentStreak(input([routine], completions, overrides))).toBe(2);
  });

  it('breaks the streak on a genuinely missed past day', () => {
    const completions = completedOn(['2026-07-22', '2026-07-20']);
    // 2026-07-21 required but neither completed nor excused -> break.
    expect(computeCurrentStreak(input([routine], completions))).toBe(1);
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
    expect(computeLongestStreak(input([routine], completions), '2026-07-10')).toBe(3);
  });
});

describe('day snapshots keep history stable', () => {
  it('judges past days by their snapshot, not by the current schedule', () => {
    // Routine was Mon–Fri when the days happened and the user completed all of
    // them; it has since been switched to daily.
    const routine = makeRoutine({ id: 'r', schedule: { weekdays: [0, 1, 2, 3, 4, 5, 6] } });
    const completions = completedOn(['2026-07-20', '2026-07-21', '2026-07-22']); // Mon, Tue, Wed
    const dayPlans = {
      '2026-07-17': ['r'], // Fri
      '2026-07-18': [], // Sat – nothing required back then
      '2026-07-19': [], // Sun
      '2026-07-20': ['r'],
      '2026-07-21': ['r'],
    };
    const withSnapshots = input([routine], [...completions, ...completedOn(['2026-07-17'])], [], dayPlans);
    expect(computeCurrentStreak(withSnapshots)).toBe(4);
    // Without snapshots the weekend would count as missed.
    expect(computeCurrentStreak(input([routine], withSnapshots.completions))).toBe(3);
  });

  it('does not require a routine on past days it was inactive, given a snapshot', () => {
    const routine = makeRoutine({ id: 'r', isActive: true });
    const dayPlans = { '2026-07-21': [] };
    expect(requiredRoutineIdsForDay(input([routine], [], [], dayPlans), '2026-07-21').size).toBe(0);
    // Today is always computed live.
    expect(requiredRoutineIdsForDay(input([routine], [], [], { [TODAY]: [] }), TODAY).has('r')).toBe(true);
  });

  it('ignores snapshot ids of routines that no longer exist', () => {
    const routine = makeRoutine({ id: 'r' });
    const dayPlans = { '2026-07-21': ['r', 'deleted'] };
    expect([...requiredRoutineIdsForDay(input([routine], [], [], dayPlans), '2026-07-21')]).toEqual(['r']);
  });
});

describe('weeklyOverview', () => {
  it('returns seven days with planned and completed counts', () => {
    const routine = makeRoutine({ id: 'r' });
    const week = weeklyOverview(input([routine], completedOn([TODAY])), 1);
    expect(week).toHaveLength(7);
    const today = week.find((d) => d.date === TODAY);
    expect(today?.plannedCount).toBe(1);
    expect(today?.completedCount).toBe(1);
    expect(today?.isToday).toBe(true);
  });
});

describe('computeOverallStats', () => {
  it("does not count today's unfinished routines as misses", () => {
    const a = makeRoutine({ id: 'a' });
    const b = makeRoutine({ id: 'b' });
    // Monday 20th and Tuesday 21st fully done; Wednesday (today) half done.
    const completions = [
      ...completedOn(['2026-07-20', '2026-07-21'], 'a'),
      ...completedOn(['2026-07-20', '2026-07-21', TODAY], 'b'),
    ];
    const stats = computeOverallStats(input([a, b], completions), 1);
    expect(stats.successRate).toBe(1);
    expect(stats.completedThisWeek).toBe(5);
  });
});

describe('routineStats', () => {
  it('measures success against the days the routine was required', () => {
    const routine = makeRoutine({ id: 'r', schedule: { startDate: '2026-07-13' } }); // daily
    // Required 13.–21. (9 days) plus today once done; completed on 3 of them.
    const completions = completedOn(['2026-07-13', '2026-07-14', '2026-07-20']);
    const stats = routineStats(input([routine], completions), routine);
    expect(stats.requiredDays).toBe(9);
    expect(stats.completionCount).toBe(3);
    expect(stats.successRate).toBeCloseTo(3 / 9);
  });

  it('counts today only once it is done', () => {
    const routine = makeRoutine({ id: 'r', schedule: { startDate: '2026-07-21' } });
    expect(routineStats(input([routine], completedOn(['2026-07-21'])), routine)).toMatchObject({
      requiredDays: 1,
      successRate: 1,
    });
    expect(routineStats(input([routine], completedOn(['2026-07-21', TODAY])), routine)).toMatchObject({
      requiredDays: 2,
      successRate: 1,
    });
  });

  it('reports 0 % with no required days instead of dividing by zero', () => {
    const routine = makeRoutine({ id: 'r', schedule: { startDate: '2026-08-01' } });
    expect(routineStats(input([routine], []), routine).successRate).toBe(0);
  });
});

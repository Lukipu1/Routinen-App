import { useMemo } from 'react';

import {
  computeOverallStats,
  routineStats,
  weeklyOverview,
  type OverallStats,
  type RoutineStats,
  type StatsInput,
  type WeekDayStat,
} from '../features/statistics/stats';
import { useAppStore } from '../store/appStore';
import { usePreferencesStore } from '../store/preferencesStore';

export interface StatisticsViewModel {
  overall: OverallStats;
  weekly: WeekDayStat[];
  perRoutine: { routineId: string; title: string; color: string; stats: RoutineStats }[];
}

/** Aggregated statistics for the Progress screen. */
export function useStatistics(): StatisticsViewModel {
  const routines = useAppStore((s) => s.routines);
  const completions = useAppStore((s) => s.completions);
  const overrides = useAppStore((s) => s.overrides);
  const dayPlans = useAppStore((s) => s.dayPlans);
  const today = useAppStore((s) => s.today);
  const weekStartsOn = usePreferencesStore((s) => s.preferences.weekStartsOn);

  return useMemo(() => {
    const input: StatsInput = { routines, completions, overrides, dayPlans, todayISO: today };
    return {
      overall: computeOverallStats(input, weekStartsOn),
      weekly: weeklyOverview(input, weekStartsOn),
      perRoutine: routines.map((routine) => ({
        routineId: routine.id,
        title: routine.title,
        color: routine.color,
        stats: routineStats(input, routine),
      })),
    };
  }, [routines, completions, overrides, dayPlans, today, weekStartsOn]);
}

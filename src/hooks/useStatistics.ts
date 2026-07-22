import { useMemo } from 'react';

import {
  computeOverallStats,
  routineStats,
  weeklyOverview,
  type OverallStats,
  type RoutineStats,
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
  const today = useAppStore((s) => s.today);
  const weekStartsOn = usePreferencesStore((s) => s.preferences.weekStartsOn);

  return useMemo(
    () => ({
      overall: computeOverallStats(routines, completions, overrides, today, weekStartsOn),
      weekly: weeklyOverview(routines, completions, overrides, today, weekStartsOn),
      perRoutine: routines.map((routine) => ({
        routineId: routine.id,
        title: routine.title,
        color: routine.color,
        stats: routineStats(routine.id, completions),
      })),
    }),
    [routines, completions, overrides, today, weekStartsOn],
  );
}

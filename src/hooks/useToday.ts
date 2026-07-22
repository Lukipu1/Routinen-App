import { useMemo } from 'react';

import { detectOverlaps, type ScheduleConflict } from '../features/planner/overlaps';
import {
  computeDayProgress,
  selectNextRoutine,
  type DayProgress,
} from '../features/planner/today';
import type { PlannedRoutine } from '../types/planning';
import { greetingForHour, formatLongDate } from '../utils/format';
import { parseISODate } from '../utils/datetime';
import { useAppStore } from '../store/appStore';
import { useDayPlan } from './useDayPlan';
import { useNow } from './useNow';

export interface TodayViewModel {
  dateISO: string;
  dateLabel: string;
  greeting: string;
  planned: PlannedRoutine[];
  next: PlannedRoutine | null;
  progress: DayProgress;
  conflicts: ScheduleConflict[];
  now: Date;
}

/** Aggregated view-model for the Today screen. */
export function useToday(): TodayViewModel {
  const today = useAppStore((s) => s.today);
  const now = useNow(60_000);
  const planned = useDayPlan(today, now);

  return useMemo(
    () => ({
      dateISO: today,
      dateLabel: formatLongDate(parseISODate(today)),
      greeting: greetingForHour(now.getHours()),
      planned,
      next: selectNextRoutine(planned),
      progress: computeDayProgress(planned),
      conflicts: detectOverlaps(planned),
      now,
    }),
    [today, planned, now],
  );
}

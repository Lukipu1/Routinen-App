import { useMemo } from 'react';

import { buildPlannedRoutines } from '../features/planner/today';
import type { ISODateString } from '../types/common';
import type { PlannedRoutine } from '../types/planning';
import { useAppStore } from '../store/appStore';

/** Builds the ordered timeline of routines for a given day from store state. */
export function useDayPlan(dateISO: ISODateString, now: Date): PlannedRoutine[] {
  const routines = useAppStore((s) => s.routines);
  const overrides = useAppStore((s) => s.overrides);
  const completions = useAppStore((s) => s.completions);
  const todayExecutions = useAppStore((s) => s.todayExecutions);

  return useMemo(
    () =>
      buildPlannedRoutines({
        routines,
        dateISO,
        overrides: overrides.filter((o) => o.date === dateISO),
        executions: todayExecutions.filter((e) => e.scheduledDate === dateISO),
        completions: completions.filter((c) => c.date === dateISO),
        now,
      }),
    [routines, overrides, completions, todayExecutions, dateISO, now],
  );
}

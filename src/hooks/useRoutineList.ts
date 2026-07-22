import { useMemo } from 'react';

import { nextOccurrence } from '../features/planner/recurrence';
import type { ISODateString } from '../types/common';
import type { RoutineCategory } from '../types/category';
import type { Routine } from '../types/routine';
import { useAppStore } from '../store/appStore';

export interface RoutineListItem {
  routine: Routine;
  nextOccurrence: ISODateString | null;
}

/** Filtered, searched and sorted routine list for the Routines screen. */
export function useRoutineList(
  search: string,
  category: RoutineCategory | null,
): RoutineListItem[] {
  const routines = useAppStore((s) => s.routines);
  const today = useAppStore((s) => s.today);

  return useMemo(() => {
    const query = search.trim().toLowerCase();
    return routines
      .filter((r) => (category ? r.category === category : true))
      .filter((r) => (query ? r.title.toLowerCase().includes(query) : true))
      .map((r) => ({ routine: r, nextOccurrence: nextOccurrence(r, today) }))
      .sort((a, b) => a.routine.title.localeCompare(b.routine.title, 'de'));
  }, [routines, today, search, category]);
}

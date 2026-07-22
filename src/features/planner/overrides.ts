import type { ISODateString, TimeString } from '../../types/common';
import type { PlanOverride } from '../../types/planning';
import { generateId } from '../../utils/id';

function emptyOverride(routineId: string, date: ISODateString): PlanOverride {
  return {
    id: generateId(),
    routineId,
    date,
    added: false,
    skipped: false,
    paused: false,
    startTimeOverride: null,
  };
}

export function findOverride(
  overrides: PlanOverride[],
  routineId: string,
  date: ISODateString,
): PlanOverride | undefined {
  return overrides.find((o) => o.routineId === routineId && o.date === date);
}

/** Merges a patch into the (routineId, date) override, creating one if needed. */
export function upsertOverride(
  overrides: PlanOverride[],
  routineId: string,
  date: ISODateString,
  patch: Partial<Omit<PlanOverride, 'id' | 'routineId' | 'date'>>,
): PlanOverride[] {
  const existing = findOverride(overrides, routineId, date);
  const base = existing ?? emptyOverride(routineId, date);
  const merged: PlanOverride = { ...base, ...patch };
  if (existing) {
    return overrides.map((o) => (o.id === existing.id ? merged : o));
  }
  return [...overrides, merged];
}

/** Moves a routine to a new time for this day only. */
export function moveRoutineForDay(
  overrides: PlanOverride[],
  routineId: string,
  date: ISODateString,
  startTime: TimeString | null,
): PlanOverride[] {
  return upsertOverride(overrides, routineId, date, { startTimeOverride: startTime });
}

/** Skips a routine just for this day. */
export function skipRoutineForDay(
  overrides: PlanOverride[],
  routineId: string,
  date: ISODateString,
  skipped = true,
): PlanOverride[] {
  return upsertOverride(overrides, routineId, date, { skipped });
}

/** Pauses (excuses) a routine just for this day. */
export function pauseRoutineForDay(
  overrides: PlanOverride[],
  routineId: string,
  date: ISODateString,
  paused = true,
): PlanOverride[] {
  return upsertOverride(overrides, routineId, date, { paused });
}

/** Adds a routine to a specific day ad-hoc, outside its recurrence. */
export function addRoutineForDay(
  overrides: PlanOverride[],
  routineId: string,
  date: ISODateString,
  startTime: TimeString | null = null,
): PlanOverride[] {
  return upsertOverride(overrides, routineId, date, {
    added: true,
    startTimeOverride: startTime,
  });
}

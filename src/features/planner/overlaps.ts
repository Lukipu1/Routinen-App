import type { PlannedRoutine } from '../../types/planning';
import { timeToMinutes } from '../../utils/datetime';

export interface ScheduleConflict {
  a: PlannedRoutine;
  b: PlannedRoutine;
  /** Overlap length in minutes. */
  overlapMinutes: number;
}

interface Interval {
  item: PlannedRoutine;
  start: number;
  end: number;
}

function toInterval(item: PlannedRoutine): Interval | null {
  if (item.startTime === null) return null;
  if (item.status === 'completed' || item.status === 'skipped' || item.status === 'missed') {
    return null;
  }
  const start = timeToMinutes(item.startTime);
  const durationMinutes = Math.max(1, Math.round(item.routine.estimatedDuration / 60));
  return { item, start, end: start + durationMinutes };
}

/**
 * Finds pairs of timed routines whose time windows overlap. Only surfaces a
 * warning — planning never rearranges routines automatically.
 */
export function detectOverlaps(items: PlannedRoutine[]): ScheduleConflict[] {
  const intervals = items
    .map(toInterval)
    .filter((value): value is Interval => value !== null)
    .sort((a, b) => a.start - b.start);

  const conflicts: ScheduleConflict[] = [];
  for (let i = 0; i < intervals.length; i += 1) {
    for (let j = i + 1; j < intervals.length; j += 1) {
      const first = intervals[i];
      const second = intervals[j];
      if (!first || !second) continue;
      if (second.start >= first.end) break; // sorted: no later item can overlap
      const overlap = Math.min(first.end, second.end) - second.start;
      if (overlap > 0) {
        conflicts.push({ a: first.item, b: second.item, overlapMinutes: overlap });
      }
    }
  }
  return conflicts;
}

export function hasOverlaps(items: PlannedRoutine[]): boolean {
  return detectOverlaps(items).length > 0;
}

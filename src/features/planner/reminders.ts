import type { ISODateString } from '../../types/common';
import type { RoutineCompletion } from '../../types/completion';
import type { PlanOverride } from '../../types/planning';
import type { Routine } from '../../types/routine';
import { addDaysISO, combineDateAndTime } from '../../utils/datetime';
import { isRoutineScheduledOn } from './recurrence';

/** One concrete reminder to fire. */
export interface ReminderOccurrence {
  routineId: string;
  title: string;
  dateISO: ISODateString;
  fireAt: Date;
}

export interface PlanRemindersInput {
  routines: Routine[];
  overrides: PlanOverride[];
  completions: RoutineCompletion[];
  /** First day to plan (usually today). */
  fromISO: ISODateString;
  /** How many days ahead to plan. */
  days: number;
  now: Date;
}

/**
 * iOS keeps at most 64 pending local notifications per app. Reminders are
 * capped below that so step-end alerts and the system still have room; a
 * re-sync on each app start keeps the rolling window moving.
 */
export const MAX_SCHEDULED_REMINDERS = 56;

/**
 * Turns schedules into concrete reminders for the next `days` days. Unlike a
 * repeating weekly trigger this honours everything that happens to a single
 * day: a routine skipped or paused for today, moved to another time, added
 * ad hoc, or already completed produces exactly the reminders it should.
 */
export function planReminders(input: PlanRemindersInput): ReminderOccurrence[] {
  const { routines, overrides, completions, fromISO, days, now } = input;
  const occurrences: ReminderOccurrence[] = [];

  for (let offset = 0; offset < days; offset += 1) {
    const dateISO = addDaysISO(fromISO, offset);
    const dayOverrides = overrides.filter((o) => o.date === dateISO);
    const done = new Set(
      completions.filter((c) => c.date === dateISO && c.completed).map((c) => c.routineId),
    );

    for (const routine of routines) {
      const { reminder, schedule } = routine;
      if (!reminder.enabled || !routine.isActive || !schedule.enabled || schedule.flexible) continue;
      if (done.has(routine.id)) continue;

      const override = dayOverrides.find((o) => o.routineId === routine.id);
      if (override?.skipped || override?.paused) continue;
      const planned = isRoutineScheduledOn(routine, dateISO) || override?.added === true;
      if (!planned) continue;

      const startTime = override?.startTimeOverride ?? schedule.startTime;
      if (startTime === null) continue;
      const start = combineDateAndTime(dateISO, startTime).getTime();

      const push = (offsetMinutes: number): void => {
        const fireAt = new Date(start + offsetMinutes * 60 * 1000);
        if (fireAt.getTime() > now.getTime()) {
          occurrences.push({ routineId: routine.id, title: routine.title, dateISO, fireAt });
        }
      };
      push(-reminder.minutesBefore);
      if (reminder.secondReminderMinutes !== null) push(reminder.secondReminderMinutes);
    }
  }

  return occurrences
    .sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime())
    .slice(0, MAX_SCHEDULED_REMINDERS);
}

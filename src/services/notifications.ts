import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Weekday } from '../types/common';
import type { Routine } from '../types/routine';
import { timeToMinutes } from '../utils/datetime';

/**
 * Local notification scheduling for routine reminders. Everything is wrapped so
 * a notification failure can never block the app. Reminders are tagged with the
 * routine id in their payload so they can be cancelled without a mapping table.
 */

const ANDROID_CHANNEL_ID = 'routine-reminders';

let handlerConfigured = false;

/** Configures the foreground handler and Android channel. Safe to call twice. */
export async function configureNotifications(): Promise<void> {
  if (!handlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    handlerConfigured = true;
  }
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: 'Routine-Erinnerungen',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    } catch {
      // Channel setup is best-effort.
    }
  }
}

export async function getNotificationPermission(): Promise<boolean> {
  try {
    const { granted } = await Notifications.getPermissionsAsync();
    return granted;
  } catch {
    return false;
  }
}

/** Requests permission. Call only after explaining the benefit to the user. */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { granted } = await Notifications.requestPermissionsAsync();
    return granted;
  } catch {
    return false;
  }
}

/** JS weekday (0=Sun) → expo weekly trigger weekday (1=Sun). */
function toExpoWeekday(weekday: Weekday): number {
  return weekday + 1;
}

interface ReminderSlot {
  weekday: Weekday;
  hour: number;
  minute: number;
}

/** Computes the concrete weekly reminder slots for a routine. */
export function computeReminderSlots(routine: Routine): ReminderSlot[] {
  const { schedule, reminder } = routine;
  if (
    !reminder.enabled ||
    !routine.isActive ||
    !schedule.enabled ||
    schedule.flexible ||
    schedule.startTime === null
  ) {
    return [];
  }

  const startMinutes = timeToMinutes(schedule.startTime);
  const slots: ReminderSlot[] = [];

  const buildSlot = (weekday: Weekday, offsetMinutes: number): ReminderSlot => {
    let absolute = startMinutes + offsetMinutes;
    let dayShift = 0;
    while (absolute < 0) {
      absolute += 24 * 60;
      dayShift -= 1;
    }
    while (absolute >= 24 * 60) {
      absolute -= 24 * 60;
      dayShift += 1;
    }
    const shiftedWeekday = (((weekday + dayShift) % 7) + 7) % 7;
    return {
      weekday: shiftedWeekday as Weekday,
      hour: Math.floor(absolute / 60),
      minute: absolute % 60,
    };
  };

  for (const weekday of schedule.weekdays) {
    slots.push(buildSlot(weekday, -reminder.minutesBefore));
    if (reminder.secondReminderMinutes !== null) {
      slots.push(buildSlot(weekday, reminder.secondReminderMinutes));
    }
  }
  return slots;
}

export async function cancelRoutineReminders(routineId: string): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.content.data?.routineId === routineId)
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
  } catch {
    // Ignore — reminders are non-critical.
  }
}

/** Cancels then reschedules all reminders for a routine. */
export async function scheduleRoutineReminders(routine: Routine): Promise<void> {
  await cancelRoutineReminders(routine.id);
  const slots = computeReminderSlots(routine);
  if (slots.length === 0) return;
  try {
    await Promise.all(
      slots.map((slot) =>
        Notifications.scheduleNotificationAsync({
          content: {
            title: routine.title,
            body: 'Zeit für deine Routine.',
            data: { routineId: routine.id },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: toExpoWeekday(slot.weekday),
            hour: slot.hour,
            minute: slot.minute,
            channelId: ANDROID_CHANNEL_ID,
          },
        }),
      ),
    );
  } catch {
    // Ignore scheduling errors.
  }
}

/** Reschedules reminders for every routine (e.g. after toggling the setting). */
export async function rescheduleAllReminders(routines: Routine[]): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Ignore.
  }
  for (const routine of routines) {
    await scheduleRoutineReminders(routine);
  }
}

export async function cancelAllReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Ignore.
  }
}

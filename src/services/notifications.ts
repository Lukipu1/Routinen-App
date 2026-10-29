import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';

import type { ReminderOccurrence } from '../features/planner/reminders';

/**
 * Local notifications: routine reminders (planned per day by the reminder
 * planner) and a single "step finished" alert while a timed step runs in the
 * background. Everything is wrapped so a notification failure can never block
 * the app. Each notification carries a `kind` so they can be managed without
 * a mapping table.
 */

const REMINDER_CHANNEL_ID = 'routine-reminders';
const STEP_CHANNEL_ID = 'step-alerts';

export type NotificationKind = 'reminder' | 'step';

export interface NotificationPayload extends Record<string, unknown> {
  kind: NotificationKind;
  routineId: string;
  /** Calendar day a reminder belongs to. */
  dateISO?: string;
}

let handlerConfigured = false;

/** Configures the foreground handler and Android channels. Safe to call twice. */
export async function configureNotifications(): Promise<void> {
  if (!handlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const data = notification.request.content.data as Partial<NotificationPayload> | undefined;
        // While the run screen is open the step alert is redundant as a banner;
        // the on-screen countdown and haptic already cover it.
        const suppressBanner = data?.kind === 'step' && AppState.currentState === 'active';
        return {
          shouldShowAlert: !suppressBanner,
          shouldPlaySound: !suppressBanner,
          shouldSetBadge: false,
          shouldShowBanner: !suppressBanner,
          shouldShowList: true,
        };
      },
    });
    handlerConfigured = true;
  }
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
        name: 'Routine-Erinnerungen',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
      await Notifications.setNotificationChannelAsync(STEP_CHANNEL_ID, {
        name: 'Timer-Ende',
        importance: Notifications.AndroidImportance.HIGH,
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

async function cancelByKind(kind: NotificationKind): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => (n.content.data as Partial<NotificationPayload> | undefined)?.kind === kind)
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
  } catch {
    // Ignore — notifications are non-critical.
  }
}

/**
 * Replaces all scheduled reminders with the given occurrences (one-shot date
 * triggers). Called whenever the plan changes and on every app start, so the
 * rolling window stays fresh and single-day changes are respected.
 */
export async function syncReminders(occurrences: ReminderOccurrence[]): Promise<void> {
  await cancelByKind('reminder');
  for (const occurrence of occurrences) {
    const payload: NotificationPayload = {
      kind: 'reminder',
      routineId: occurrence.routineId,
      dateISO: occurrence.dateISO,
    };
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: occurrence.title,
          body: 'Zeit für deine Routine. Tippe, um sie zu starten.',
          data: payload,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: occurrence.fireAt,
          channelId: REMINDER_CHANNEL_ID,
        },
      });
    } catch {
      // Ignore scheduling errors for a single reminder.
    }
  }
}

export async function cancelAllReminders(): Promise<void> {
  await cancelByKind('reminder');
}

/**
 * Schedules the one alert for the end of the current timed step, replacing
 * any previous one. Pass `null` to just cancel (step changed, paused, left).
 */
export async function syncStepEndAlert(
  alert: { routineId: string; routineTitle: string; stepTitle: string; at: Date } | null,
): Promise<void> {
  await cancelByKind('step');
  if (!alert || alert.at.getTime() <= Date.now()) return;
  const payload: NotificationPayload = { kind: 'step', routineId: alert.routineId };
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: alert.routineTitle,
        body: `„${alert.stepTitle}“ ist fertig – weiter geht’s.`,
        data: payload,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: alert.at,
        channelId: STEP_CHANNEL_ID,
      },
    });
  } catch {
    // Ignore.
  }
}

/** Extracts our payload from a tapped notification, if it is one of ours. */
export function payloadFromResponse(
  response: Notifications.NotificationResponse,
): NotificationPayload | null {
  const data = response.notification.request.content.data as
    | Partial<NotificationPayload>
    | undefined;
  if (!data || typeof data.routineId !== 'string') return null;
  if (data.kind !== 'reminder' && data.kind !== 'step') return null;
  return { kind: data.kind, routineId: data.routineId, dateISO: data.dateISO };
}

export const addNotificationResponseListener = Notifications.addNotificationResponseReceivedListener;
export const getLastNotificationResponse = Notifications.getLastNotificationResponseAsync;

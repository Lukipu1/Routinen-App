import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import type { NotificationResponse } from 'expo-notifications';

import {
  addNotificationResponseListener,
  getLastNotificationResponse,
  payloadFromResponse,
} from '../services/notifications';
import { useAppStore } from '../store/appStore';
import { useExecutionStore } from '../store/executionStore';

/**
 * Makes tapping a notification do something: a reminder opens the run for
 * that routine (resuming a live run if there is one), a step alert returns to
 * the running routine. Handles both the cold-start response and live taps.
 */
export function useReminderResponse(enabled: boolean): void {
  const router = useRouter();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    // Local notifications are not available on web; the module throws
    // synchronously there rather than rejecting.
    if (!enabled || Platform.OS === 'web') return;

    const handle = async (response: NotificationResponse): Promise<void> => {
      const id = response.notification.request.identifier;
      if (handled.current === id) return;
      handled.current = id;

      const payload = payloadFromResponse(response);
      if (!payload) return;
      const app = useAppStore.getState();
      const routine = app.routines.find((r) => r.id === payload.routineId);
      if (!routine) return;

      const execution = useExecutionStore.getState();
      if (execution.execution && execution.routine?.id === routine.id) {
        router.push('/run');
        return;
      }
      const live = app.todayExecutions.find(
        (e) => e.routineId === routine.id && (e.status === 'active' || e.status === 'paused'),
      );
      if (live) {
        await useExecutionStore.getState().attach(routine, live);
      } else {
        const done = app.completions.some(
          (c) => c.routineId === routine.id && c.date === app.today && c.completed,
        );
        if (done) {
          router.navigate('/');
          return;
        }
        await useExecutionStore.getState().start(routine, app.today);
      }
      router.push('/run');
    };

    let subscription: { remove: () => void } | null = null;
    try {
      subscription = addNotificationResponseListener((response) => {
        void handle(response);
      });
      void getLastNotificationResponse()
        .then((response) => {
          if (response) void handle(response);
        })
        .catch(() => undefined);
    } catch {
      // Notifications unavailable on this platform; nothing to wire up.
    }
    return () => subscription?.remove();
  }, [enabled, router]);
}

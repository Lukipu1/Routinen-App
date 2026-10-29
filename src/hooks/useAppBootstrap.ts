import { useCallback, useEffect, useState } from 'react';

import { configureNotifications } from '../services/notifications';
import { useAppStore } from '../store/appStore';
import { useExecutionStore } from '../store/executionStore';
import { usePreferencesStore } from '../store/preferencesStore';

export interface BootstrapState {
  /** True once the app can render its screens. */
  ready: boolean;
  /** A startup failure the user should see (with a retry), or `null`. */
  error: string | null;
  retry: () => void;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unbekannter Fehler';
}

/**
 * Runs one-time app startup: configures notifications, opens the database and
 * seeds sample data, then restores any in-progress routine run. A failure in
 * any step surfaces as `error` instead of leaving the app on the boot screen.
 */
export function useAppBootstrap(): BootstrapState {
  const initialize = useAppStore((s) => s.initialize);
  const initialized = useAppStore((s) => s.initialized);
  const storeError = useAppStore((s) => s.error);
  const prefsHydrated = usePreferencesStore((s) => s.hydrated);
  const restore = useExecutionStore((s) => s.restore);
  const [restoreDone, setRestoreDone] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        await configureNotifications();
        await initialize();
        if (useAppStore.getState().initialized) await restore();
      } catch (error) {
        if (mounted) setLocalError(errorMessage(error));
      } finally {
        if (mounted) setRestoreDone(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [initialize, restore, attempt]);

  const retry = useCallback(() => {
    setRestoreDone(false);
    setLocalError(null);
    useAppStore.setState({ error: null });
    setAttempt((count) => count + 1);
  }, []);

  const error = storeError ?? localError;
  return {
    ready: initialized && prefsHydrated && restoreDone && error === null,
    error,
    retry,
  };
}

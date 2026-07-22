import { useEffect, useState } from 'react';

import { configureNotifications } from '../services/notifications';
import { useAppStore } from '../store/appStore';
import { useExecutionStore } from '../store/executionStore';
import { usePreferencesStore } from '../store/preferencesStore';

/**
 * Runs one-time app startup: configures notifications, opens the database and
 * seeds sample data, then restores any in-progress routine run. Returns `true`
 * once the app is ready to render its screens.
 */
export function useAppBootstrap(): boolean {
  const initialize = useAppStore((s) => s.initialize);
  const initialized = useAppStore((s) => s.initialized);
  const prefsHydrated = usePreferencesStore((s) => s.hydrated);
  const restore = useExecutionStore((s) => s.restore);
  const [restoreDone, setRestoreDone] = useState(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      await configureNotifications();
      await initialize();
      await restore();
      if (mounted) setRestoreDone(true);
    })();
    return () => {
      mounted = false;
    };
  }, [initialize, restore]);

  return initialized && prefsHydrated && restoreDone;
}

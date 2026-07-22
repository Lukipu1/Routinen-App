import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import type { UserPreferences } from '../types/preferences';
import { usePreferencesStore } from '../store/preferencesStore';

export function usePreferences(): UserPreferences {
  return usePreferencesStore((s) => s.preferences);
}

export function useUpdatePreferences(): (patch: Partial<UserPreferences>) => void {
  return usePreferencesStore((s) => s.update);
}

/**
 * True when motion should be reduced — honouring both the app preference and
 * the OS-level "Reduce Motion" accessibility setting.
 */
export function useReducedMotion(): boolean {
  const preference = usePreferencesStore((s) => s.preferences.reducedMotion);
  const [systemReduced, setSystemReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) setSystemReduced(value);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setSystemReduced,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return preference || systemReduced;
}

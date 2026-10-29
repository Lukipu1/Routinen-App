import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useAppStore } from '../store/appStore';

/** Milliseconds until just after the next local midnight. */
function msUntilNextMidnight(now: Date): number {
  const next = new Date(now);
  next.setHours(24, 0, 1, 0);
  return Math.max(1000, next.getTime() - now.getTime());
}

/**
 * Keeps the store's `today` in sync with the calendar: re-checks when the app
 * returns to the foreground (it may have slept through midnight) and on a timer
 * armed for the next midnight while it stays open.
 */
export function useDayRollover(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const check = (): void => {
      void useAppStore.getState().ensureToday();
    };
    const arm = (): void => {
      timer = setTimeout(() => {
        check();
        arm();
      }, msUntilNextMidnight(new Date()));
    };

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    check();
    arm();

    return () => {
      subscription.remove();
      if (timer) clearTimeout(timer);
    };
  }, [enabled]);
}

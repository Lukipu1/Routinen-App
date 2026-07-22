import { useEffect, useState } from 'react';

/**
 * Returns the current time, re-rendering on an interval. Use a coarse interval
 * (e.g. 60s) for timelines and a 1s interval only where a live countdown is
 * shown, to keep re-renders cheap.
 */
export function useNow(intervalMs = 60_000, active = true): Date {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, active]);
  return now;
}

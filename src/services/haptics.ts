import * as Haptics from 'expo-haptics';

import { createLogger } from '../utils/logger';

const log = createLogger('haptics');

/**
 * Thin, preference-gated wrapper around expo-haptics. The preferences store
 * calls `setHapticsEnabled` so this module can stay free of store imports
 * (avoiding a cycle). All calls are best-effort and never throw.
 */
let hapticsEnabled = true;

export function setHapticsEnabled(enabled: boolean): void {
  hapticsEnabled = enabled;
}

async function safe(run: () => Promise<void>): Promise<void> {
  if (!hapticsEnabled) return;
  try {
    await run();
  } catch (error) {
    // Haptics are non-critical: unsupported devices just stay silent.
    log.debug('haptic feedback unavailable', error);
  }
}

export const haptics = {
  light: (): Promise<void> =>
    safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: (): Promise<void> =>
    safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  selection: (): Promise<void> => safe(() => Haptics.selectionAsync()),
  success: (): Promise<void> =>
    safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: (): Promise<void> =>
    safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};

import React, { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { useReducedMotion } from '../../hooks/usePreferences';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

type ToastTone = 'default' | 'success' | 'error';

export interface ToastAction {
  label: string;
  onPress: () => void;
}

interface ToastState {
  message: string | null;
  tone: ToastTone;
  action: ToastAction | null;
  show: (message: string, tone?: ToastTone, action?: ToastAction) => void;
  hide: () => void;
}

const DURATION_MS = 2500;
/** Toasts with an action (e.g. "Rückgängig") stay long enough to be tapped. */
const DURATION_WITH_ACTION_MS = 5000;

let hideTimer: ReturnType<typeof setTimeout> | null = null;

const useToastStore = create<ToastState>((set) => ({
  message: null,
  tone: 'default',
  action: null,
  show: (message, tone = 'default', action) => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ message, tone, action: action ?? null });
    hideTimer = setTimeout(
      () => set({ message: null, action: null }),
      action ? DURATION_WITH_ACTION_MS : DURATION_MS,
    );
  },
  hide: () => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ message: null, action: null });
  },
}));

/** Returns a `show(message, tone?, action?)` function for lightweight feedback. */
export function useToast(): (message: string, tone?: ToastTone, action?: ToastAction) => void {
  return useToastStore((s) => s.show);
}

const TONE_ICON: Record<ToastTone, string> = {
  default: 'sparkles',
  success: 'check',
  error: 'close',
};

/** Renders the active toast. Mount once near the app root. */
export function ToastHost(): React.ReactElement | null {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const message = useToastStore((s) => s.message);
  const tone = useToastStore((s) => s.tone);
  const action = useToastStore((s) => s.action);
  const hide = useToastStore((s) => s.hide);

  // Toasts are visual-only otherwise; screen readers need the text announced.
  useEffect(() => {
    if (message) AccessibilityInfo.announceForAccessibility(message);
  }, [message]);

  if (!message) return null;

  const toneColor =
    tone === 'success'
      ? theme.colors.successText
      : tone === 'error'
        ? theme.colors.error
        : theme.colors.accent;

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom: insets.bottom + 90 }]}>
      <Animated.View
        entering={(reducedMotion ? FadeIn : FadeInDown).duration(reducedMotion ? 80 : 200)}
        exiting={(reducedMotion ? FadeOut : FadeOutDown).duration(reducedMotion ? 80 : 200)}
        accessibilityLiveRegion="polite"
        style={[
          styles.toast,
          theme.shadows.elevated,
          { backgroundColor: theme.colors.elevatedBackground, borderRadius: theme.radii.pill },
        ]}
      >
        <Icon name={TONE_ICON[tone]} size={18} color={toneColor} />
        <AppText variant="callout" weight="600" style={styles.text} numberOfLines={2}>
          {message}
        </AppText>
        {action ? (
          <PressableScale
            onPress={() => {
              hide();
              action.onPress();
            }}
            accessibilityRole="button"
            hitSlop={8}
            style={styles.action}
          >
            <AppText variant="callout" weight="700" style={{ color: theme.colors.accent }}>
              {action.label}
            </AppText>
          </PressableScale>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '90%',
  },
  text: { flexShrink: 1 },
  action: { paddingHorizontal: 6, paddingVertical: 4 },
});

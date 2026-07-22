import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './AppText';
import { Icon } from './Icon';

type ToastTone = 'default' | 'success' | 'error';

interface ToastState {
  message: string | null;
  tone: ToastTone;
  show: (message: string, tone?: ToastTone) => void;
  hide: () => void;
}

let hideTimer: ReturnType<typeof setTimeout> | null = null;

const useToastStore = create<ToastState>((set) => ({
  message: null,
  tone: 'default',
  show: (message, tone = 'default') => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ message, tone });
    hideTimer = setTimeout(() => set({ message: null }), 2500);
  },
  hide: () => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ message: null });
  },
}));

/** Returns a `show(message, tone?)` function for lightweight feedback. */
export function useToast(): (message: string, tone?: ToastTone) => void {
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
  const message = useToastStore((s) => s.message);
  const tone = useToastStore((s) => s.tone);

  if (!message) return null;

  const toneColor =
    tone === 'success'
      ? theme.colors.success
      : tone === 'error'
        ? theme.colors.error
        : theme.colors.accent;

  return (
    <View pointerEvents="none" style={[styles.wrapper, { bottom: insets.bottom + 90 }]}>
      <Animated.View
        entering={FadeInDown.duration(200)}
        exiting={FadeOutDown.duration(200)}
        style={[
          styles.toast,
          theme.shadows.elevated,
          { backgroundColor: theme.colors.elevatedBackground, borderRadius: theme.radii.pill },
        ]}
      >
        <Icon name={TONE_ICON[tone]} size={18} color={toneColor} />
        <AppText variant="callout" weight="600">
          {message}
        </AppText>
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
});

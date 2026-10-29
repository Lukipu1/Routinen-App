import React from 'react';
import {
  Pressable,
  StyleSheet,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '../../hooks/usePreferences';
import { haptics } from '../../services/haptics';

type HapticKind = keyof typeof haptics;

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: HapticKind;
  children: React.ReactNode;
}

/**
 * Style keys that position the element within its parent. They must live on
 * the outer `Pressable` (the actual flex item); everything else styles the
 * animated inner view. Without this split, `flex: 1` or `alignSelf` on a
 * button would silently have no effect.
 */
const LAYOUT_KEYS = new Set<keyof ViewStyle>([
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'alignSelf',
  'width',
  'minWidth',
  'maxWidth',
  'height',
  'minHeight',
  'maxHeight',
  'aspectRatio',
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginHorizontal',
  'marginVertical',
  'marginStart',
  'marginEnd',
  'position',
  'top',
  'bottom',
  'left',
  'right',
  'zIndex',
]);

function splitStyle(style: StyleProp<ViewStyle>): { outer: ViewStyle; inner: ViewStyle } {
  const flat = StyleSheet.flatten(style) ?? {};
  const outer: ViewStyle = {};
  const inner: ViewStyle = {};
  for (const [key, value] of Object.entries(flat) as [keyof ViewStyle, unknown][]) {
    if (LAYOUT_KEYS.has(key)) {
      (outer as Record<string, unknown>)[key] = value;
    } else {
      (inner as Record<string, unknown>)[key] = value;
    }
  }
  // When the outer box has an explicit size, let the inner surface fill it.
  if (outer.height !== undefined || outer.flex !== undefined || outer.aspectRatio !== undefined) {
    inner.flex = 1;
  }
  return { outer, inner };
}

/**
 * Pressable with a subtle press-scale animation and optional haptic feedback.
 * Honours the reduced-motion preference by skipping the scale.
 */
export function PressableScale({
  style,
  scaleTo = 0.97,
  haptic,
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  children,
  ...rest
}: PressableScaleProps): React.ReactElement {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const { outer, inner } = splitStyle(style);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      disabled={disabled}
      onPressIn={(event) => {
        if (!reducedMotion) scale.value = withTiming(scaleTo, { duration: 80 });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        if (!reducedMotion) scale.value = withTiming(1, { duration: 120 });
        onPressOut?.(event);
      }}
      onPress={(event: GestureResponderEvent) => {
        if (haptic) void haptics[haptic]();
        onPress?.(event);
      }}
      style={outer}
      {...rest}
    >
      <Animated.View style={[animatedStyle, inner]}>{children}</Animated.View>
    </Pressable>
  );
}

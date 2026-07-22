import React from 'react';
import {
  Pressable,
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
      {...rest}
    >
      <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
    </Pressable>
  );
}

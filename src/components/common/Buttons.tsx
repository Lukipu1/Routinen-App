import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { Button } from './Button';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

type CommonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  iconName?: string;
  accentColor?: string;
  fullWidth?: boolean;
  pill?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton(props: CommonProps): React.ReactElement {
  return <Button variant="primary" {...props} />;
}

export function SecondaryButton(props: CommonProps): React.ReactElement {
  return <Button variant="secondary" {...props} />;
}

interface IconButtonProps {
  iconName: string;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  disabled?: boolean;
}

/** Minimum comfortable touch target (Apple HIG / Material). */
const MIN_TARGET = 44;

/**
 * Circular icon-only button with a neutral fill by default. Visually it can
 * be smaller than 44pt; the touch target is padded out with `hitSlop`.
 */
export function IconButton({
  iconName,
  onPress,
  accessibilityLabel,
  size = 40,
  color,
  backgroundColor,
  disabled = false,
}: IconButtonProps): React.ReactElement {
  const theme = useTheme();
  const slop = Math.max(0, (MIN_TARGET - size) / 2);
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      haptic="light"
      hitSlop={slop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={[
        styles.iconButton,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: backgroundColor ?? theme.colors.fill,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Icon name={iconName} size={size * 0.5} color={color ?? theme.colors.primaryText} />
    </PressableScale>
  );
}

interface FabProps {
  onPress: () => void;
  accessibilityLabel: string;
  iconName?: string;
  color?: string;
}

/** Floating action button, positioned by its parent container. */
export function FloatingActionButton({
  onPress,
  accessibilityLabel,
  iconName = 'plus',
  color,
}: FabProps): React.ReactElement {
  const theme = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      haptic="medium"
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[styles.fab, theme.shadows.floating, { backgroundColor: color ?? theme.colors.accent }]}
    >
      <View style={styles.fabInner}>
        <Icon name={iconName} size={28} color={theme.colors.onAccent} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  fabInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

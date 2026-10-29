import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { haptics } from '../../services/haptics';
import { useTheme } from '../../theme/ThemeProvider';
import { Button } from './Button';
import { Icon } from './Icon';

type CommonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  iconName?: string;
  fullWidth?: boolean;
  size?: 'regular' | 'compact';
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
  /** `tinted` colours the circle with the accent for the one primary bar action. */
  tone?: 'neutral' | 'tinted';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Minimum comfortable touch target (Apple HIG). */
const MIN_TARGET = 44;

/**
 * Circular icon-only button, like the close/edit buttons in iOS sheets.
 * Visually it can be smaller than 44pt; the touch target is padded out.
 */
export function IconButton({
  iconName,
  onPress,
  accessibilityLabel,
  size = 36,
  color,
  backgroundColor,
  tone = 'neutral',
  disabled = false,
  style,
}: IconButtonProps): React.ReactElement {
  const theme = useTheme();
  const slop = Math.max(0, (MIN_TARGET - size) / 2);
  const tinted = tone === 'tinted';
  return (
    <Pressable
      onPress={() => {
        void haptics.light();
        onPress();
      }}
      disabled={disabled}
      hitSlop={slop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.iconButton,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: backgroundColor ?? (tinted ? theme.colors.accentMuted : theme.colors.fill),
          opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
        },
        style,
      ]}
    >
      <Icon
        name={iconName}
        size={Math.round(size * 0.5)}
        color={color ?? (tinted ? theme.colors.accent : theme.colors.secondaryText)}
        strokeWidth={2.5}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

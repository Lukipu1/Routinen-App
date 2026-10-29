import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { haptics } from '../../services/haptics';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './AppText';
import { Icon } from './Icon';

/**
 * iOS button hierarchy: one `primary` (filled with the accent) per view for
 * the most likely action, `secondary` (tinted) for the rest, `ghost` (plain
 * text) for tertiary actions, and `destructive` (tinted red) which is never
 * the default. All share the same size — style, not size, tells them apart.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  iconName?: string;
  fullWidth?: boolean;
  /** Compact height for buttons inside rows or sheets. */
  size?: 'regular' | 'compact';
  style?: StyleProp<ViewStyle>;
}

/** Base themed button used by the primary/secondary/etc. wrappers. */
export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  iconName,
  fullWidth = true,
  size = 'regular',
  style,
}: ButtonProps): React.ReactElement {
  const theme = useTheme();
  const { colors } = theme;

  const background: Record<ButtonVariant, string> = {
    primary: colors.accent,
    secondary: colors.accentMuted,
    ghost: 'transparent',
    destructive: colors.errorMuted,
  };
  const foreground: Record<ButtonVariant, string> = {
    primary: colors.onAccent,
    secondary: colors.accent,
    ghost: colors.accent,
    destructive: colors.error,
  };

  const isDisabled = disabled || loading;
  const textColor = foreground[variant];

  return (
    <Pressable
      onPress={() => {
        void haptics.light();
        onPress();
      }}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={title}
      hitSlop={size === 'compact' ? 4 : 0}
      style={({ pressed }) => [
        styles.base,
        size === 'compact' ? styles.compact : styles.regular,
        {
          backgroundColor: background[variant],
          borderRadius: theme.radii.pill,
          // iOS press feedback: the control dims, it does not shrink.
          opacity: isDisabled ? 0.4 : pressed ? 0.65 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <>
            {iconName ? <Icon name={iconName} size={size === 'compact' ? 18 : 20} color={textColor} /> : null}
            <AppText
              variant={size === 'compact' ? 'callout' : 'headline'}
              weight="600"
              style={{ color: textColor }}
              numberOfLines={1}
              maxFontSizeMultiplier={1.4}
            >
              {title}
            </AppText>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  regular: { minHeight: 50 },
  compact: { minHeight: 40, paddingHorizontal: 16 },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});

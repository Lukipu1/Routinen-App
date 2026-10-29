import React from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { onColorForHex } from '../../constants/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  iconName?: string;
  /** Accent colour override (e.g. a routine's colour) for the primary variant. */
  accentColor?: string;
  fullWidth?: boolean;
  pill?: boolean;
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
  accentColor,
  fullWidth = true,
  pill = false,
  style,
}: ButtonProps): React.ReactElement {
  const theme = useTheme();
  const accent = accentColor ?? theme.colors.accent;

  const backgroundColor: Record<ButtonVariant, string> = {
    primary: accent,
    secondary: theme.colors.fill,
    ghost: 'transparent',
    destructive: theme.colors.error,
  };
  const textColorToken: Record<ButtonVariant, string> = {
    // A routine colour as accent may need dark text to stay readable.
    primary: accentColor ? onColorForHex(accentColor) : theme.colors.onAccent,
    secondary: theme.colors.primaryText,
    ghost: accent,
    destructive: theme.colors.onAccent,
  };

  const isDisabled = disabled || loading;
  const textColor = textColorToken[variant];

  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      haptic="light"
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={title}
      style={[
        styles.base,
        {
          backgroundColor: backgroundColor[variant],
          borderRadius: pill ? theme.radii.pill : theme.radii.md,
          paddingHorizontal: theme.spacing.lg,
          opacity: isDisabled ? 0.5 : 1,
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
            {iconName ? <Icon name={iconName} size={20} color={textColor} /> : null}
            <AppText variant="headline" style={{ color: textColor }}>
              {title}
            </AppText>
          </>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});

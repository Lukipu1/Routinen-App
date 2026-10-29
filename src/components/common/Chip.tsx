import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { haptics } from '../../services/haptics';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './AppText';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** `radio` for one-of-many choices, `checkbox` for toggles. */
  role?: 'radio' | 'checkbox' | 'button';
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Selectable capsule for filters and option pickers. The selected one takes
 * the accent colour (it is the interactive state); the rest stay in the
 * neutral fill. Announces role and state, keeps a 40pt+ touch target.
 */
export function Chip({
  label,
  selected,
  onPress,
  role = 'radio',
  accessibilityLabel,
  disabled = false,
  style,
}: ChipProps): React.ReactElement {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => {
        void haptics.selection();
        onPress();
      }}
      disabled={disabled}
      hitSlop={{ top: 4, bottom: 4 }}
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected, checked: role === 'checkbox' ? selected : undefined, disabled }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.colors.accent : theme.colors.fill,
          borderRadius: theme.radii.pill,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <AppText
        variant="callout"
        weight={selected ? '600' : '500'}
        style={{ color: selected ? theme.colors.onAccent : theme.colors.primaryText }}
        maxFontSizeMultiplier={1.4}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

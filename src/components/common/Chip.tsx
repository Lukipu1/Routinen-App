import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { onColorForHex } from '../../constants/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Accent used for the selected fill; text picks a readable colour on it. */
  accentColor?: string;
  /** `radio` for one-of-many choices, `checkbox` for toggles. */
  role?: 'radio' | 'checkbox' | 'button';
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Selectable pill used for filters and option pickers. Announces its role and
 * selected state to screen readers and keeps a 40pt+ touch target.
 */
export function Chip({
  label,
  selected,
  onPress,
  accentColor,
  role = 'radio',
  accessibilityLabel,
  disabled = false,
  style,
}: ChipProps): React.ReactElement {
  const theme = useTheme();
  const accent = accentColor ?? theme.colors.accent;
  const textColor = selected ? onColorForHex(accent) : theme.colors.primaryText;
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      haptic="selection"
      scaleTo={0.95}
      hitSlop={{ top: 4, bottom: 4 }}
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected, checked: role === 'checkbox' ? selected : undefined, disabled }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? accent : theme.colors.fill,
          borderRadius: theme.radii.pill,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <AppText variant="callout" weight="600" style={{ color: textColor }} maxFontSizeMultiplier={1.4}>
        {label}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

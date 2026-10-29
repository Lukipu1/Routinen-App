import React from 'react';
import { Platform, Switch } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';

interface AppSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Spoken name of the setting; a bare "Schalter, aus" tells the user nothing. */
  accessibilityLabel: string;
  disabled?: boolean;
}

/**
 * System switch in the app's single tint colour, with a named accessibility
 * label, a visible "off" track and a consistent thumb on every platform.
 */
export function AppSwitch({
  value,
  onValueChange,
  accessibilityLabel,
  disabled = false,
}: AppSwitchProps): React.ReactElement {
  const theme = useTheme();
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      trackColor={{ true: theme.colors.success, false: theme.colors.fillStrong }}
      ios_backgroundColor={theme.colors.fillStrong}
      thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
      style={disabled ? { opacity: 0.4 } : undefined}
    />
  );
}

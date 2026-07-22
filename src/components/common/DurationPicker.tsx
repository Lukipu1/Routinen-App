import React from 'react';
import { StyleSheet, View } from 'react-native';

import { DURATION_PRESETS } from '../../constants/durations';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

interface DurationPickerProps {
  /** Selected duration in seconds, or `null` for an untimed step. */
  value: number | null;
  onChange: (seconds: number | null) => void;
  accentColor?: string;
}

interface Choice {
  label: string;
  value: number | null;
}

/** Quick-pick duration selector including an "untimed" option. */
export function DurationPicker({
  value,
  onChange,
  accentColor,
}: DurationPickerProps): React.ReactElement {
  const theme = useTheme();
  const accent = accentColor ?? theme.colors.accent;
  const choices: Choice[] = [
    { label: 'Ohne', value: null },
    ...DURATION_PRESETS.map((preset) => ({ label: preset.label, value: preset.seconds })),
  ];

  return (
    <View style={styles.row}>
      {choices.map((choice) => {
        const isSelected = value === choice.value;
        return (
          <PressableScale
            key={choice.label}
            onPress={() => onChange(choice.value)}
            haptic="selection"
            scaleTo={0.94}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? accent : theme.colors.fill,
                borderRadius: theme.radii.pill,
              },
            ]}
          >
            <AppText
              variant="callout"
              weight="600"
              style={{ color: isSelected ? theme.colors.onAccent : theme.colors.primaryText }}
            >
              {choice.label}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});

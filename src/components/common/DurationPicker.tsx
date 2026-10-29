import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DURATION_PRESETS } from '../../constants/durations';
import { useTheme } from '../../theme/ThemeProvider';
import { formatDuration } from '../../utils/format';
import { AppText } from './AppText';
import { BottomSheet } from './BottomSheet';
import { PrimaryButton } from './Buttons';
import { Chip } from './Chip';
import { TextField } from './TextField';

interface DurationPickerProps {
  /** Selected duration in seconds, or `null` for an untimed step. */
  value: number | null;
  onChange: (seconds: number | null) => void;
  accentColor?: string;
}

const MAX_MINUTES = 240;

/**
 * Quick-pick duration selector with an "untimed" option and a free minute
 * entry ("Andere…"). A value outside the presets (e.g. a template's 25 min)
 * is shown as its own selected chip instead of silently appearing unselected.
 */
export function DurationPicker({
  value,
  onChange,
  accentColor,
}: DurationPickerProps): React.ReactElement {
  const theme = useTheme();
  const accent = accentColor ?? theme.colors.accent;
  const [customOpen, setCustomOpen] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const [customError, setCustomError] = useState<string | undefined>();

  const isPreset = value === null || DURATION_PRESETS.some((p) => p.seconds === value);

  const openCustom = (): void => {
    setCustomMinutes(value !== null && !isPreset ? String(Math.round(value / 60)) : '');
    setCustomError(undefined);
    setCustomOpen(true);
  };

  const confirmCustom = (): void => {
    const minutes = Number.parseInt(customMinutes.replace(/\D/g, ''), 10);
    if (!Number.isFinite(minutes) || minutes <= 0 || minutes > MAX_MINUTES) {
      setCustomError(`Bitte 1 bis ${MAX_MINUTES} Minuten eingeben.`);
      return;
    }
    onChange(minutes * 60);
    setCustomOpen(false);
  };

  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      <Chip
        label="Ohne"
        accessibilityLabel="Ohne Zeitvorgabe"
        selected={value === null}
        onPress={() => onChange(null)}
        accentColor={accent}
      />
      {DURATION_PRESETS.map((preset) => (
        <Chip
          key={preset.seconds}
          label={preset.label}
          accessibilityLabel={`${preset.label}uten`}
          selected={value === preset.seconds}
          onPress={() => onChange(preset.seconds)}
          accentColor={accent}
        />
      ))}
      <Chip
        label={!isPreset && value !== null ? formatDuration(value) : 'Andere…'}
        accessibilityLabel="Eigene Dauer"
        selected={!isPreset && value !== null}
        onPress={openCustom}
        accentColor={accent}
      />

      <BottomSheet visible={customOpen} onClose={() => setCustomOpen(false)} title="Eigene Dauer">
        <View style={{ gap: theme.spacing.md }}>
          <TextField
            label="Minuten"
            value={customMinutes}
            onChangeText={setCustomMinutes}
            keyboardType="number-pad"
            placeholder="z. B. 25"
            autoFocus
            error={customError}
            returnKeyType="done"
            onSubmitEditing={confirmCustom}
          />
          <AppText variant="caption" color="secondaryText">
            Der Schritt läuft dann als Countdown über diese Zeit.
          </AppText>
          <PrimaryButton title="Übernehmen" onPress={confirmCustom} accentColor={accent} />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});

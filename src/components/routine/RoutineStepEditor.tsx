import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { RoutineStepDraft } from '../../features/routines/draft';
import { useTheme } from '../../theme/ThemeProvider';
import { AppSwitch } from '../common/AppSwitch';
import { AppText } from '../common/AppText';
import { IconButton } from '../common/Buttons';
import { DurationPicker } from '../common/DurationPicker';
import { TextField } from '../common/TextField';

interface RoutineStepEditorProps {
  step: RoutineStepDraft;
  index: number;
  total: number;
  error?: string;
  onChange: (patch: Partial<RoutineStepDraft>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

/** Editable step as one grouped cell: name, duration, note, required switch. */
export function RoutineStepEditor({
  step,
  index,
  total,
  error,
  onChange,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: RoutineStepEditorProps): React.ReactElement {
  const theme = useTheme();
  const label = step.title.trim() || `Schritt ${index + 1}`;
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.secondaryBackground,
          borderRadius: theme.radii.lg,
          padding: theme.spacing.base,
          gap: theme.spacing.md,
        },
      ]}
    >
      <View style={styles.header}>
        <AppText variant="headline">Schritt {index + 1}</AppText>
        <View style={styles.actions}>
          <IconButton
            iconName="chevronUp"
            accessibilityLabel={`${label} nach oben`}
            onPress={onMoveUp}
            disabled={index === 0}
            size={32}
          />
          <IconButton
            iconName="chevronDown"
            accessibilityLabel={`${label} nach unten`}
            onPress={onMoveDown}
            disabled={index === total - 1}
            size={32}
          />
          <IconButton
            iconName="copy"
            accessibilityLabel={`${label} duplizieren`}
            onPress={onDuplicate}
            size={32}
          />
          <IconButton
            iconName="trash"
            accessibilityLabel={`${label} löschen`}
            onPress={onRemove}
            size={32}
            color={theme.colors.error}
            backgroundColor={theme.colors.errorMuted}
          />
        </View>
      </View>
      <TextField
        placeholder="Schrittname"
        value={step.title}
        onChangeText={(title) => onChange({ title })}
        error={error}
        returnKeyType="done"
        accessibilityLabel={`Name von Schritt ${index + 1}`}
      />
      <View style={{ gap: 6 }}>
        <AppText variant="caption" color="secondaryText" style={{ marginLeft: 4 }}>
          Dauer
        </AppText>
        <DurationPicker
          value={step.durationInSeconds}
          onChange={(durationInSeconds) => onChange({ durationInSeconds })}
        />
      </View>
      <TextField
        placeholder="Kurzer Hinweis (optional)"
        value={step.note}
        onChangeText={(note) => onChange({ note })}
        accessibilityLabel={`Hinweis zu Schritt ${index + 1}`}
      />
      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <AppText variant="body">Pflichtschritt</AppText>
          <AppText variant="caption" color="secondaryText">
            Kann beim Ausführen nicht übersprungen werden
          </AppText>
        </View>
        <AppSwitch
          value={!step.canSkip}
          onValueChange={(required) => onChange({ canSkip: !required })}
          accessibilityLabel={`${label} ist Pflichtschritt`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchText: { flex: 1, gap: 2 },
});

import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { RoutineStepDraft } from '../../features/routines/draft';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from '../common/AppText';
import { IconButton } from '../common/Buttons';
import { DurationPicker } from '../common/DurationPicker';
import { TextField } from '../common/TextField';

interface RoutineStepEditorProps {
  step: RoutineStepDraft;
  index: number;
  total: number;
  accentColor: string;
  error?: string;
  onChange: (patch: Partial<RoutineStepDraft>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

/** Editable step card with reordering, duplication and deletion. */
export function RoutineStepEditor({
  step,
  index,
  total,
  accentColor,
  error,
  onChange,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: RoutineStepEditorProps): React.ReactElement {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.secondaryBackground,
          borderRadius: theme.radii.md,
          padding: theme.spacing.md,
          gap: theme.spacing.sm,
        },
      ]}
    >
      <View style={styles.header}>
        <AppText variant="headline" style={{ color: accentColor }}>
          Schritt {index + 1}
        </AppText>
        <View style={styles.actions}>
          <IconButton
            iconName="chevronUp"
            accessibilityLabel="Nach oben"
            onPress={onMoveUp}
            disabled={index === 0}
            size={32}
          />
          <IconButton
            iconName="chevronDown"
            accessibilityLabel="Nach unten"
            onPress={onMoveDown}
            disabled={index === total - 1}
            size={32}
          />
          <IconButton
            iconName="copy"
            accessibilityLabel="Schritt duplizieren"
            onPress={onDuplicate}
            size={32}
          />
          <IconButton
            iconName="trash"
            accessibilityLabel="Schritt löschen"
            onPress={onRemove}
            size={32}
            color={theme.colors.error}
          />
        </View>
      </View>

      <TextField
        placeholder="Schrittname"
        value={step.title}
        onChangeText={(title) => onChange({ title })}
        error={error}
        returnKeyType="done"
      />

      <DurationPicker
        value={step.durationInSeconds}
        onChange={(durationInSeconds) => onChange({ durationInSeconds })}
        accentColor={accentColor}
      />

      <TextField
        placeholder="Kurzer Hinweis (optional)"
        value={step.note}
        onChangeText={(note) => onChange({ note })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actions: {
    flexDirection: 'row',
    gap: 4,
  },
});

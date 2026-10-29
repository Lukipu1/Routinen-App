import React from 'react';
import { View } from 'react-native';

import { SecondaryButton } from '../../../components/common/Buttons';
import { useToast } from '../../../components/common/Toast';
import { RoutineStepEditor } from '../../../components/routine/RoutineStepEditor';
import { useTheme } from '../../../theme/ThemeProvider';
import {
  addStep,
  duplicateStep,
  moveStep,
  removeStep,
  updateStep,
  type RoutineDraft,
  type RoutineStepDraft,
} from '../draft';

interface Props {
  draft: RoutineDraft;
  setDraft: React.Dispatch<React.SetStateAction<RoutineDraft>>;
  accent: string;
  /** Per-step errors, shown only after the user tried to continue. */
  errors?: Record<string, string>;
}

/** Page 2: the ordered list of steps. */
export function StepSteps({ draft, setDraft, accent, errors }: Props): React.ReactElement {
  const theme = useTheme();
  const toast = useToast();

  const remove = (step: RoutineStepDraft, index: number): void => {
    setDraft((current) => removeStep(current, step.id));
    // Deleting is one tap next to "duplicate"; give the user a way back.
    toast('Schritt gelöscht', 'default', {
      label: 'Rückgängig',
      onPress: () =>
        setDraft((current) => {
          if (current.steps.some((s) => s.id === step.id)) return current;
          const steps = [...current.steps];
          steps.splice(Math.min(index, steps.length), 0, step);
          return { ...current, steps };
        }),
    });
  };

  return (
    <View style={{ gap: theme.spacing.md }}>
      {draft.steps.map((stepDraft, index) => (
        <RoutineStepEditor
          key={stepDraft.id}
          step={stepDraft}
          index={index}
          total={draft.steps.length}
          accentColor={accent}
          error={errors?.[stepDraft.id]}
          onChange={(p) => setDraft((current) => updateStep(current, stepDraft.id, p))}
          onRemove={() => remove(stepDraft, index)}
          onDuplicate={() => setDraft((current) => duplicateStep(current, stepDraft.id))}
          onMoveUp={() => setDraft((current) => moveStep(current, index, index - 1))}
          onMoveDown={() => setDraft((current) => moveStep(current, index, index + 1))}
        />
      ))}
      <SecondaryButton
        title="Schritt hinzufügen"
        iconName="plus"
        onPress={() => setDraft((current) => addStep(current))}
      />
    </View>
  );
}

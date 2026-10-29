import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { AppText } from '../../components/common/AppText';
import { BottomSheet } from '../../components/common/BottomSheet';
import { PrimaryButton, SecondaryButton } from '../../components/common/Buttons';
import { Icon } from '../../components/common/Icon';
import { PressableScale } from '../../components/common/PressableScale';
import { useToast } from '../../components/common/Toast';
import { resolveOnRoutineColor, resolveRoutineColor } from '../../constants/colors';
import type { PlannedRoutine } from '../../types/planning';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppStore } from '../../store/appStore';

interface AddToDaySheetProps {
  visible: boolean;
  onClose: () => void;
  /** Today's plan, to mark routines that are already on it. */
  planned: PlannedRoutine[];
  /** Opens directly on the list of existing routines. */
  initialMode?: 'choice' | 'existing';
}

/** Sheet to either create a new routine or add an existing one to today. */
export function AddToDaySheet({
  visible,
  onClose,
  planned,
  initialMode = 'choice',
}: AddToDaySheetProps): React.ReactElement {
  const router = useRouter();
  const theme = useTheme();
  const toast = useToast();
  const routines = useAppStore((s) => s.routines);
  const addForToday = useAppStore((s) => s.addRoutineForToday);
  const [mode, setMode] = useState<'choice' | 'existing'>(initialMode);

  const close = (): void => {
    setMode(initialMode);
    onClose();
  };

  const planExisting = async (routineId: string): Promise<void> => {
    await addForToday(routineId);
    toast('Für heute eingeplant', 'success');
    close();
  };

  return (
    <BottomSheet visible={visible} onClose={close} title="Zum Tag hinzufügen">
      {mode === 'choice' ? (
        <View style={{ gap: 10 }}>
          <PrimaryButton
            title="Neue Routine erstellen"
            iconName="plus"
            onPress={() => {
              close();
              router.push({ pathname: '/editor', params: { forToday: '1' } });
            }}
          />
          <SecondaryButton
            title="Vorhandene für heute einplanen"
            iconName="calendar"
            onPress={() => setMode('existing')}
          />
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {routines.length === 0 ? (
            <AppText variant="body" color="secondaryText">
              Noch keine Routinen vorhanden.
            </AppText>
          ) : (
            <ScrollView style={{ maxHeight: 320 }}>
              {routines.map((routine) => {
                const color = resolveRoutineColor(routine.color);
                const entry = planned.find((p) => p.routine.id === routine.id);
                // Skipped routines can be planned again; everything else that is
                // already on today's list has nothing to gain from another tap.
                const alreadyPlanned = entry !== undefined && entry.status !== 'skipped';
                const hint = alreadyPlanned
                  ? 'Heute bereits geplant'
                  : entry?.status === 'skipped'
                    ? 'Heute übersprungen – wieder einplanen'
                    : !routine.isActive
                      ? 'Inaktiv – nur für heute einplanen'
                      : null;
                return (
                  <PressableScale
                    key={routine.id}
                    onPress={() => planExisting(routine.id)}
                    disabled={alreadyPlanned}
                    scaleTo={0.98}
                    accessibilityRole="button"
                    accessibilityLabel={`${routine.title} für heute einplanen`}
                    accessibilityState={{ disabled: alreadyPlanned }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingVertical: 10,
                      minHeight: 48,
                      opacity: alreadyPlanned ? 0.5 : 1,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: color,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon name={routine.icon} size={18} color={resolveOnRoutineColor(routine.color)} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText variant="body">{routine.title}</AppText>
                      {hint ? (
                        <AppText variant="caption" color="secondaryText">
                          {hint}
                        </AppText>
                      ) : null}
                    </View>
                    <Icon
                      name={alreadyPlanned ? 'check' : 'plus'}
                      size={20}
                      color={alreadyPlanned ? theme.colors.secondaryText : theme.colors.accent}
                    />
                  </PressableScale>
                );
              })}
            </ScrollView>
          )}
          {initialMode === 'choice' ? (
            <SecondaryButton title="Zurück" onPress={() => setMode('choice')} />
          ) : null}
        </View>
      )}
    </BottomSheet>
  );
}

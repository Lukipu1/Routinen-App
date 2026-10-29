import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/common/AppText';
import { BottomSheet } from '../../components/common/BottomSheet';
import { PrimaryButton, SecondaryButton } from '../../components/common/Buttons';
import { Icon } from '../../components/common/Icon';
import { useToast } from '../../components/common/Toast';
import { photoForCategory } from '../../constants/photos';
import { haptics } from '../../services/haptics';
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
        <View style={{ gap: 12 }}>
          {routines.length === 0 ? (
            <AppText variant="body" color="secondaryText">
              Noch keine Routinen vorhanden.
            </AppText>
          ) : (
            <ScrollView style={{ maxHeight: 320 }}>
              {routines.map((routine, index) => {
                const entry = planned.find((p) => p.routine.id === routine.id);
                // Skipped routines can be planned again; everything else that is
                // already on today's list has nothing to gain from another tap.
                const alreadyPlanned = entry !== undefined && entry.status !== 'skipped';
                const last = index === routines.length - 1;
                const hint = alreadyPlanned
                  ? 'Heute bereits geplant'
                  : entry?.status === 'skipped'
                    ? 'Heute übersprungen – wieder einplanen'
                    : !routine.isActive
                      ? 'Inaktiv – nur für heute einplanen'
                      : null;
                return (
                  <Pressable
                    key={routine.id}
                    onPress={() => {
                      void haptics.light();
                      void planExisting(routine.id);
                    }}
                    disabled={alreadyPlanned}
                    accessibilityRole="button"
                    accessibilityLabel={`${routine.title} für heute einplanen`}
                    accessibilityState={{ disabled: alreadyPlanned }}
                    style={({ pressed }) => [
                      styles.row,
                      { opacity: alreadyPlanned ? 0.5 : pressed ? 0.6 : 1 },
                    ]}
                  >
                    <Image source={photoForCategory(routine.category)} style={styles.thumb} accessibilityIgnoresInvertColors />
                    <View
                      style={[
                        styles.body,
                        { borderBottomColor: theme.colors.separator, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth },
                      ]}
                    >
                      <View style={{ flex: 1, gap: 2 }}>
                        <AppText variant="body" numberOfLines={1}>
                          {routine.title}
                        </AppText>
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
                        strokeWidth={2.5}
                      />
                    </View>
                  </Pressable>
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

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumb: { width: 44, height: 44, borderRadius: 10, marginRight: 12, backgroundColor: '#D1D1D6' },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    minHeight: 56,
  },
});

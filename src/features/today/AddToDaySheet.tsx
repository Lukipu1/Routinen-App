import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { AppText } from '../../components/common/AppText';
import { BottomSheet } from '../../components/common/BottomSheet';
import { PrimaryButton, SecondaryButton } from '../../components/common/Buttons';
import { Icon } from '../../components/common/Icon';
import { PressableScale } from '../../components/common/PressableScale';
import { useToast } from '../../components/common/Toast';
import { resolveRoutineColor } from '../../constants/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppStore } from '../../store/appStore';

interface AddToDaySheetProps {
  visible: boolean;
  onClose: () => void;
}

/** Sheet to either create a new routine or add an existing one to today. */
export function AddToDaySheet({ visible, onClose }: AddToDaySheetProps): React.ReactElement {
  const router = useRouter();
  const theme = useTheme();
  const toast = useToast();
  const routines = useAppStore((s) => s.routines);
  const addForToday = useAppStore((s) => s.addRoutineForToday);
  const [mode, setMode] = useState<'choice' | 'existing'>('choice');

  const close = (): void => {
    setMode('choice');
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
              router.push('/editor');
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
                return (
                  <PressableScale
                    key={routine.id}
                    onPress={() => planExisting(routine.id)}
                    scaleTo={0.98}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingVertical: 10,
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
                      <Icon name={routine.icon} size={18} color={theme.colors.onAccent} />
                    </View>
                    <AppText variant="body" style={{ flex: 1 }}>
                      {routine.title}
                    </AppText>
                    <Icon name="plus" size={20} color={theme.colors.accent} />
                  </PressableScale>
                );
              })}
            </ScrollView>
          )}
          <SecondaryButton title="Zurück" onPress={() => setMode('choice')} />
        </View>
      )}
    </BottomSheet>
  );
}

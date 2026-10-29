import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '../../components/common/AppText';
import { BottomSheet } from '../../components/common/BottomSheet';
import { PrimaryButton, SecondaryButton } from '../../components/common/Buttons';
import { Button } from '../../components/common/Button';
import { TimePickerField } from '../../components/common/TimePickerField';
import { useToast } from '../../components/common/Toast';
import type { PlannedRoutine } from '../../types/planning';
import type { Routine } from '../../types/routine';
import { formatDuration } from '../../utils/format';
import { nowISO } from '../../utils/datetime';
import { useAppStore } from '../../store/appStore';

interface PlannedActionsSheetProps {
  planned: PlannedRoutine | null;
  onClose: () => void;
  onStart: (planned: PlannedRoutine) => void;
}

/** Bottom sheet of per-day actions for a routine on the timeline. */
export function PlannedActionsSheet({
  planned,
  onClose,
  onStart,
}: PlannedActionsSheetProps): React.ReactElement {
  const router = useRouter();
  const toast = useToast();
  const moveForToday = useAppStore((s) => s.moveRoutineForToday);
  const saveRoutine = useAppStore((s) => s.saveRoutine);
  const skipForToday = useAppStore((s) => s.skipRoutineForToday);
  const undoCompletion = useAppStore((s) => s.undoCompletionForToday);
  const [moving, setMoving] = useState(false);
  const [moveTime, setMoveTime] = useState('08:00');

  const close = (): void => {
    setMoving(false);
    onClose();
  };

  if (!planned) {
    return <BottomSheet visible={false} onClose={close} />;
  }

  const { routine, status, completion } = planned;
  const isDone = status === 'completed';
  const isSkipped = status === 'skipped';
  const isAbandoned = status === 'abandoned';
  const isRunning = status === 'active' || status === 'paused';
  const startLabel = isRunning
    ? 'Fortsetzen'
    : isDone || isAbandoned
      ? 'Erneut starten'
      : status === 'missed' || status === 'overdue'
        ? 'Nachholen'
        : 'Starten';

  const applyMoveToday = async (): Promise<void> => {
    await moveForToday(routine.id, moveTime);
    toast('Für heute verschoben', 'success');
    close();
  };

  const applyMoveAllDays = async (): Promise<void> => {
    const updated: Routine = {
      ...routine,
      schedule: { ...routine.schedule, startTime: moveTime, flexible: false },
      updatedAt: nowISO(),
    };
    await saveRoutine(updated);
    toast('Alle Tage aktualisiert', 'success');
    close();
  };

  const toggleSkip = async (): Promise<void> => {
    await skipForToday(routine.id, !isSkipped);
    toast(isSkipped ? 'Wieder eingeplant' : 'Für heute übersprungen');
    close();
  };

  const undo = async (): Promise<void> => {
    await undoCompletion(routine.id);
    toast('Abschluss zurückgenommen');
    close();
  };

  return (
    <BottomSheet visible onClose={close} title={routine.title}>
      <View style={{ gap: 10 }}>
        {moving ? (
          <>
            <AppText variant="callout" color="secondaryText">
              Neue Uhrzeit wählen
            </AppText>
            <TimePickerField value={moveTime} onChange={setMoveTime} />
            <PrimaryButton title="Nur heute" onPress={applyMoveToday} />
            <SecondaryButton title="Alle zukünftigen Tage" onPress={applyMoveAllDays} />
            <SecondaryButton title="Zurück" onPress={() => setMoving(false)} />
          </>
        ) : (
          <>
            {isDone && completion ? (
              <AppText variant="callout" color="secondaryText">
                Heute erledigt · {formatDuration(completion.durationInSeconds)} ·{' '}
                {completion.completedSteps} von {completion.totalSteps} Schritten
              </AppText>
            ) : null}
            <PrimaryButton
              title={startLabel}
              iconName="play"
              onPress={() => onStart(planned)}
             
            />
            {isDone ? (
              <SecondaryButton title="Abschluss zurücknehmen" iconName="arrowLeft" onPress={undo} />
            ) : null}
            {!isDone ? (
              <SecondaryButton
                title="Verschieben"
                iconName="clock"
                onPress={() => {
                  setMoveTime(planned.startTime ?? '08:00');
                  setMoving(true);
                }}
              />
            ) : null}
            {!isDone && !isAbandoned && !isRunning ? (
              <SecondaryButton
                title={isSkipped ? 'Wieder einplanen' : 'Für heute überspringen'}
                iconName={isSkipped ? 'check' : 'skip'}
                onPress={toggleSkip}
              />
            ) : null}
            <Button
              variant="ghost"
              title="Routine bearbeiten"
              iconName="edit"
              onPress={() => {
                close();
                router.push({ pathname: '/editor', params: { id: routine.id } });
              }}
            />
          </>
        )}
      </View>
    </BottomSheet>
  );
}

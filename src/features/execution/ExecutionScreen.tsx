import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../components/common/AppText';
import { PrimaryButton, SecondaryButton, IconButton } from '../../components/common/Buttons';
import { Button } from '../../components/common/Button';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { Icon } from '../../components/common/Icon';
import { ProgressRing } from '../../components/progress/ProgressRing';
import { resolveRoutineColor } from '../../constants/colors';
import {
  currentStep,
  executionProgress,
  remainingTotalSeconds,
  stepElapsedSeconds,
  stepRemainingSeconds,
} from './executionLogic';
import { haptics } from '../../services/haptics';
import { clamp } from '../../utils/array';
import { formatClock, formatDuration } from '../../utils/format';
import { useNow } from '../../hooks/useNow';
import { useExecutionStore } from '../../store/executionStore';
import { useTheme } from '../../theme/ThemeProvider';

export function ExecutionScreen(): React.ReactElement {
  const router = useRouter();
  const theme = useTheme();
  const routine = useExecutionStore((s) => s.routine);
  const execution = useExecutionStore((s) => s.execution);
  const finished = useExecutionStore((s) => s.finished);
  const completeStep = useExecutionStore((s) => s.completeStep);
  const skipStep = useExecutionStore((s) => s.skipStep);
  const pause = useExecutionStore((s) => s.pause);
  const resume = useExecutionStore((s) => s.resume);
  const addTime = useExecutionStore((s) => s.addTime);
  const abandon = useExecutionStore((s) => s.abandon);
  const clear = useExecutionStore((s) => s.clear);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const firedStep = useRef(-1);

  const isActive = execution?.status === 'active';
  const now = useNow(1000, isActive);

  const remaining = routine && execution ? stepRemainingSeconds(routine, execution, now) : null;
  const isTimed = remaining !== null;

  useEffect(() => {
    if (
      execution &&
      isActive &&
      remaining !== null &&
      remaining <= 0 &&
      firedStep.current !== execution.currentStepIndex
    ) {
      firedStep.current = execution.currentStepIndex;
      void haptics.warning();
    }
  }, [execution, isActive, remaining]);

  if (finished && routine && execution) {
    return (
      <SuccessView
        accent={resolveRoutineColor(routine.color)}
        durationSeconds={finished.durationInSeconds}
        completedSteps={finished.completedSteps}
        totalSteps={finished.totalSteps}
        skippedSteps={execution.skippedStepIds.length}
        onDone={() => {
          clear();
          router.back();
        }}
      />
    );
  }

  if (!routine || !execution) {
    return (
      <SafeAreaView style={[styles.flex, styles.center, { backgroundColor: theme.colors.background }]}>
        <AppText variant="title">Keine aktive Routine</AppText>
        <View style={{ marginTop: 16, alignSelf: 'stretch', paddingHorizontal: 24 }}>
          <PrimaryButton title="Zurück" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const accent = resolveRoutineColor(routine.color);
  const step = currentStep(routine, execution);
  const stepDuration = step?.durationInSeconds ?? null;
  const elapsed = stepElapsedSeconds(execution, now);
  const ringProgress =
    isTimed && stepDuration ? clamp(elapsed / stepDuration, 0, 1) : executionProgress(routine, execution);
  const remainingTotal = remainingTotalSeconds(routine, execution, now);

  const endEarly = async (): Promise<void> => {
    setConfirmEnd(false);
    await abandon();
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <IconButton
          iconName="close"
          accessibilityLabel="Routine beenden"
          onPress={() => setConfirmEnd(true)}
        />
        <AppText variant="headline" numberOfLines={1} style={styles.headerTitle}>
          {routine.title}
        </AppText>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.body}>
        <AppText variant="callout" color="secondaryText">
          Schritt {execution.currentStepIndex + 1} von {routine.steps.length}
        </AppText>

        <ProgressRing progress={ringProgress} size={220} strokeWidth={14} color={accent}>
          <View style={styles.ringCenter}>
            {isTimed ? (
              <AppText variant="display">{formatClock(remaining ?? 0)}</AppText>
            ) : (
              <Icon name={step?.icon ?? routine.icon} size={64} color={accent} />
            )}
          </View>
        </ProgressRing>

        <AppText variant="title" center numberOfLines={2} style={styles.stepTitle}>
          {step?.title ?? ''}
        </AppText>
        {step?.note ? (
          <AppText variant="body" color="secondaryText" center>
            {step.note}
          </AppText>
        ) : null}
        <AppText variant="caption" color="tertiaryText">
          Noch {formatDuration(remainingTotal)} gesamt
        </AppText>
      </View>

      <View style={styles.controls}>
        <PrimaryButton title="Erledigt" iconName="check" accentColor={accent} onPress={completeStep} />
        <View style={styles.controlRow}>
          <SecondaryButton
            title={isActive ? 'Pause' : 'Fortsetzen'}
            iconName={isActive ? 'pause' : 'play'}
            onPress={isActive ? pause : resume}
            fullWidth={false}
            style={styles.grow}
          />
          {step?.canSkip ? (
            <SecondaryButton
              title="Überspringen"
              iconName="skip"
              onPress={skipStep}
              fullWidth={false}
              style={styles.grow}
            />
          ) : null}
        </View>
        {isTimed ? (
          <Button variant="ghost" title="+1 Minute" onPress={() => addTime(60)} />
        ) : null}
      </View>

      <ConfirmationDialog
        visible={confirmEnd}
        title="Routine beenden?"
        message="Dein bisheriger Fortschritt wird gespeichert."
        confirmLabel="Beenden"
        cancelLabel="Weitermachen"
        destructive
        onConfirm={endEarly}
        onCancel={() => setConfirmEnd(false)}
      />
    </SafeAreaView>
  );
}

function SuccessView({
  accent,
  durationSeconds,
  completedSteps,
  totalSteps,
  skippedSteps,
  onDone,
}: {
  accent: string;
  durationSeconds: number;
  completedSteps: number;
  totalSteps: number;
  skippedSteps: number;
  onDone: () => void;
}): React.ReactElement {
  const theme = useTheme();
  const scale = useSharedValue(0.6);
  useEffect(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 120 });
  }, [scale]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <View style={styles.successBody}>
        <Animated.View style={[styles.successIcon, { backgroundColor: accent }, animatedStyle]}>
          <Icon name="check" size={64} color={theme.colors.onAccent} />
        </Animated.View>
        <Animated.View entering={FadeIn.delay(150)} style={styles.successText}>
          <AppText variant="largeTitle" center>
            Geschafft!
          </AppText>
          <AppText variant="body" color="secondaryText" center>
            {formatDuration(durationSeconds)} · {completedSteps} von {totalSteps} Schritten
            {skippedSteps > 0 ? ` · ${skippedSteps} übersprungen` : ''}
          </AppText>
        </Animated.View>
      </View>
      <View style={styles.controls}>
        <PrimaryButton title="Fertig" onPress={onDone} accentColor={accent} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerTitle: { flex: 1, textAlign: 'center' },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  ringCenter: { alignItems: 'center', justifyContent: 'center' },
  stepTitle: { marginTop: 8 },
  controls: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 10,
  },
  controlRow: { flexDirection: 'row', gap: 10 },
  grow: { flex: 1 },
  successBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: { gap: 8, alignItems: 'center' },
});

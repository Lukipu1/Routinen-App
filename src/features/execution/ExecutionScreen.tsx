import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../components/common/AppText';
import { BottomSheet } from '../../components/common/BottomSheet';
import { PrimaryButton, SecondaryButton, IconButton } from '../../components/common/Buttons';
import { Button } from '../../components/common/Button';
import { Icon } from '../../components/common/Icon';
import { ProgressRing } from '../../components/progress/ProgressRing';
import { resolveRoutineColor } from '../../constants/colors';
import { useReducedMotion } from '../../hooks/usePreferences';
import {
  currentStep,
  executionProgress,
  remainingTotalSeconds,
  stepElapsedSeconds,
  stepRemainingSeconds,
} from './executionLogic';
import { haptics } from '../../services/haptics';
import { clamp } from '../../utils/array';
import { formatClock, formatDuration, pluralize } from '../../utils/format';
import { useNow } from '../../hooks/useNow';
import { useExecutionStore } from '../../store/executionStore';
import { useTheme } from '../../theme/ThemeProvider';

const KEEP_AWAKE_TAG = 'routine-run';

export function ExecutionScreen(): React.ReactElement {
  const router = useRouter();
  const theme = useTheme();
  const routine = useExecutionStore((s) => s.routine);
  const execution = useExecutionStore((s) => s.execution);
  const finished = useExecutionStore((s) => s.finished);
  const completeStep = useExecutionStore((s) => s.completeStep);
  const skipStep = useExecutionStore((s) => s.skipStep);
  const goBack = useExecutionStore((s) => s.goBack);
  const pause = useExecutionStore((s) => s.pause);
  const resume = useExecutionStore((s) => s.resume);
  const addTime = useExecutionStore((s) => s.addTime);
  const abandon = useExecutionStore((s) => s.abandon);
  const reopen = useExecutionStore((s) => s.reopen);
  const leave = useExecutionStore((s) => s.leave);
  const clear = useExecutionStore((s) => s.clear);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const firedStep = useRef(-1);

  const isLive = execution?.status === 'active' || execution?.status === 'paused';
  const isActive = execution?.status === 'active';
  const now = useNow(1000, isActive);
  const remaining = routine && execution ? stepRemainingSeconds(routine, execution, now) : null;
  const isTimed = remaining !== null;
  const timeUp = isTimed && remaining <= 0;

  // Keep the screen on while a step is actually running (not while paused or
  // on the summary), so long timed steps don't end behind a locked screen.
  useEffect(() => {
    if (isActive) void activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => undefined);
    else void deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
    return () => {
      void deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
    };
  }, [isActive]);

  // One haptic nudge when a timer runs out.
  useEffect(() => {
    if (execution && isActive && timeUp && firedStep.current !== execution.currentStepIndex) {
      firedStep.current = execution.currentStepIndex;
      void haptics.warning();
    }
  }, [execution, isActive, timeUp]);

  // Android back behaves like the X: offer to continue later or end.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isLive) {
        setLeaveOpen(true);
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [isLive]);

  const exit = (): void => {
    clear();
    router.back();
  };

  if (finished && routine && execution) {
    return (
      <SummaryView
        accent={resolveRoutineColor(routine.color)}
        completed={finished.completed}
        durationSeconds={finished.durationInSeconds}
        completedSteps={finished.completedSteps}
        totalSteps={finished.totalSteps}
        skippedSteps={execution.skippedStepIds.length}
        onUndo={execution.status === 'completed' ? () => void reopen() : undefined}
        onDone={exit}
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
  const nextStep = routine.steps[execution.currentStepIndex + 1];
  const stepDuration = step?.durationInSeconds ?? null;
  const elapsed = stepElapsedSeconds(execution, now);
  const ringProgress =
    isTimed && stepDuration ? clamp(elapsed / stepDuration, 0, 1) : executionProgress(routine, execution);
  const remainingTotal = remainingTotalSeconds(routine, execution, now);
  const canGoBack = execution.currentStepIndex > 0;

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <IconButton
          iconName="close"
          accessibilityLabel="Routine verlassen oder beenden"
          onPress={() => setLeaveOpen(true)}
        />
        <AppText variant="headline" numberOfLines={1} style={styles.headerTitle} accessibilityRole="header">
          {routine.title}
        </AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <AppText variant="callout" color="secondaryText">
          Schritt {execution.currentStepIndex + 1} von {routine.steps.length}
        </AppText>

        <ProgressRing
          progress={ringProgress}
          size={220}
          strokeWidth={14}
          color={timeUp ? theme.colors.warning : accent}
        >
          <View style={styles.ringCenter}>
            {isTimed ? (
              <AppText
                variant="display"
                accessibilityLabel={`Noch ${formatDuration(remaining)}`}
                accessibilityLiveRegion="polite"
                adjustsFontSizeToFit
                numberOfLines={1}
              >
                {formatClock(remaining)}
              </AppText>
            ) : (
              <Icon name={step?.icon ?? routine.icon} size={64} color={accent} />
            )}
          </View>
        </ProgressRing>

        <AppText variant="title" center numberOfLines={2} style={styles.stepTitle} accessibilityRole="header">
          {step?.title ?? ''}
        </AppText>
        {step?.note ? (
          <AppText variant="body" color="secondaryText" center>
            {step.note}
          </AppText>
        ) : null}

        {timeUp ? (
          <AppText variant="callout" weight="600" center style={{ color: theme.colors.warningText }}>
            Zeit ist um – bereit für den nächsten Schritt?
          </AppText>
        ) : execution.status === 'paused' ? (
          <AppText variant="callout" weight="600" center style={{ color: theme.colors.warningText }}>
            Pausiert
          </AppText>
        ) : null}

        <View style={styles.metaRow}>
          <AppText variant="caption" color="secondaryText">
            Noch {formatDuration(remainingTotal)} gesamt
          </AppText>
          {nextStep ? (
            <AppText variant="caption" color="secondaryText" numberOfLines={1}>
              Danach: {nextStep.title}
            </AppText>
          ) : (
            <AppText variant="caption" color="secondaryText">
              Letzter Schritt
            </AppText>
          )}
        </View>
      </ScrollView>

      <View style={styles.controls}>
        <PrimaryButton title="Erledigt" iconName="check" onPress={completeStep} />
        <View style={styles.controlRow}>
          <SecondaryButton
            title={isActive ? 'Pause' : 'Fortsetzen'}
            onPress={isActive ? pause : resume}
            fullWidth={false}
            style={styles.grow}
          />
          {step?.canSkip ? (
            <SecondaryButton title="Überspringen" onPress={skipStep} fullWidth={false} style={styles.grow} />
          ) : null}
        </View>
        <View style={styles.controlRow}>
          <Button
            variant="ghost"
            title="Schritt zurück"
            onPress={goBack}
            disabled={!canGoBack}
            fullWidth={false}
            style={styles.grow}
          />
          {isTimed ? (
            <Button variant="ghost" title="+1 Min" onPress={() => addTime(60)} fullWidth={false} style={styles.grow} />
          ) : null}
        </View>
      </View>

      <BottomSheet visible={leaveOpen} onClose={() => setLeaveOpen(false)} title="Routine verlassen?">
        <View style={{ gap: 10 }}>
          <AppText variant="body" color="secondaryText">
            Du kannst später bei „{step?.title ?? routine.title}“ weitermachen oder die Routine für
            heute beenden.
          </AppText>
          <PrimaryButton
            title="Später fortsetzen"
            iconName="pause"
           
            onPress={() => {
              setLeaveOpen(false);
              void leave().then(() => router.back());
            }}
          />
          <Button
            variant="destructive"
            title="Routine beenden"
            iconName="close"
            onPress={() => {
              setLeaveOpen(false);
              void abandon();
            }}
          />
          <SecondaryButton title="Weitermachen" onPress={() => setLeaveOpen(false)} />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

/** End-of-run screen: a celebration when done, a calm summary when ended early. */
function SummaryView({
  accent,
  completed,
  durationSeconds,
  completedSteps,
  totalSteps,
  skippedSteps,
  onUndo,
  onDone,
}: {
  accent: string;
  completed: boolean;
  durationSeconds: number;
  completedSteps: number;
  totalSteps: number;
  skippedSteps: number;
  onUndo?: () => void;
  onDone: () => void;
}): React.ReactElement {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(reducedMotion ? 1 : 0.6);
  useEffect(() => {
    if (!reducedMotion) scale.value = withSpring(1, { damping: 10, stiffness: 120 });
  }, [scale, reducedMotion]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const iconBackground = completed ? accent : theme.colors.fillStrong;
  const iconColor = completed ? theme.colors.onAccent : theme.colors.secondaryText;
  const stepsLabel = `${completedSteps} von ${totalSteps} ${pluralize(totalSteps, 'Schritt', 'Schritten')}`;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <View style={styles.successBody}>
        <Animated.View style={[styles.successIcon, { backgroundColor: iconBackground }, animatedStyle]}>
          <Icon name={completed ? 'check' : 'pause'} size={64} color={iconColor} />
        </Animated.View>
        <Animated.View entering={reducedMotion ? undefined : FadeIn.delay(150)} style={styles.successText}>
          <AppText variant="largeTitle" center accessibilityRole="header">
            {completed ? 'Geschafft!' : 'Routine beendet'}
          </AppText>
          <AppText variant="body" color="secondaryText" center>
            {formatDuration(durationSeconds)} · {stepsLabel}
            {skippedSteps > 0 ? ` · ${skippedSteps} übersprungen` : ''}
          </AppText>
          {!completed ? (
            <AppText variant="callout" color="secondaryText" center>
              Du kannst die Routine heute jederzeit erneut starten.
            </AppText>
          ) : null}
        </Animated.View>
      </View>
      <View style={styles.controls}>
        <PrimaryButton title="Fertig" onPress={onDone} />
        {onUndo ? <Button variant="ghost" title="Rückgängig – letzten Schritt wiederholen" onPress={onUndo} /> : null}
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
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  ringCenter: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  stepTitle: { marginTop: 8 },
  metaRow: { alignItems: 'center', gap: 4 },
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
    padding: 24,
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

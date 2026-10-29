import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppHeader } from '../../components/common/AppHeader';
import { AppText } from '../../components/common/AppText';
import { BottomSheet } from '../../components/common/BottomSheet';
import { IconButton, PrimaryButton, SecondaryButton } from '../../components/common/Buttons';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { Icon } from '../../components/common/Icon';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { SectionHeader } from '../../components/common/SectionHeader';
import { ProgressRing } from '../../components/progress/ProgressRing';
import { NextRoutineCard } from '../../components/timeline/NextRoutineCard';
import { TimelineItem } from '../../components/timeline/TimelineItem';
import { useToday } from '../../hooks/useToday';
import type { PlannedRoutine } from '../../types/planning';
import { pluralize } from '../../utils/format';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppStore } from '../../store/appStore';
import { useExecutionStore } from '../../store/executionStore';
import { AddToDaySheet } from './AddToDaySheet';
import { PlannedActionsSheet } from './PlannedActionsSheet';

function DayProgressCard({
  completed,
  total,
  skipped,
  fraction,
}: {
  completed: number;
  total: number;
  skipped: number;
  fraction: number;
}): React.ReactElement {
  const summary = `${completed} von ${total} ${pluralize(total, 'Routine', 'Routinen')} erledigt${
    skipped > 0 ? ` · ${skipped} übersprungen` : ''
  }`;
  return (
    <Card style={styles.progressCard} accessibilityLabel={`Tagesfortschritt: ${summary}`}>
      <ProgressRing progress={fraction} size={56} strokeWidth={7}>
        <AppText variant="caption" weight="600">{`${completed}/${total}`}</AppText>
      </ProgressRing>
      <View style={styles.progressText}>
        <AppText variant="headline">Tagesfortschritt</AppText>
        <AppText variant="callout" color="secondaryText">
          {summary}
        </AppText>
      </View>
    </Card>
  );
}

export function TodayScreen(): React.ReactElement {
  const router = useRouter();
  const theme = useTheme();
  const { dateISO, dateLabel, greeting, planned, next, progress, conflicts } = useToday();
  const hasRoutines = useAppStore((s) => s.routines.length > 0);
  const [actionItem, setActionItem] = useState<PlannedRoutine | null>(null);
  const [addMode, setAddMode] = useState<'closed' | 'choice' | 'existing'>('closed');
  /** A different routine is still live while the user wants to start this one. */
  const [conflict, setConflict] = useState<{ wanted: PlannedRoutine; running: PlannedRoutine } | null>(null);

  const openRun = async (item: PlannedRoutine): Promise<void> => {
    const execution = item.execution;
    if (execution && (execution.status === 'active' || execution.status === 'paused')) {
      await useExecutionStore.getState().attach(item.routine, execution);
    } else {
      await useExecutionStore.getState().start(item.routine, dateISO);
    }
    setActionItem(null);
    router.push({ pathname: '/run', params: { routineId: item.routine.id, date: dateISO } });
  };

  const startOrResume = async (item: PlannedRoutine): Promise<void> => {
    const running = planned.find(
      (p) => p.routine.id !== item.routine.id && (p.status === 'active' || p.status === 'paused'),
    );
    if (running) {
      setActionItem(null);
      setConflict({ wanted: item, running });
      return;
    }
    await openRun(item);
  };

  const endRunningAndStart = async (): Promise<void> => {
    if (!conflict) return;
    const { wanted, running } = conflict;
    setConflict(null);
    if (running.execution) {
      await useExecutionStore.getState().attach(running.routine, running.execution);
      await useExecutionStore.getState().abandon();
      useExecutionStore.getState().clear();
    }
    await openRun(wanted);
  };

  return (
    <View style={styles.flex}>
      <ScreenContainer scroll>
        <AppHeader
          subtitle={dateLabel}
          title={greeting}
          trailing={
            <IconButton
              iconName="plus"
              tone="tinted"
              accessibilityLabel="Routine hinzufügen"
              onPress={() => setAddMode('choice')}
            />
          }
        />

        {planned.length === 0 ? (
          <EmptyState
            icon="sparkles"
            title="Dein Tag ist noch frei"
            message={
              hasRoutines
                ? 'Heute steht keine Routine im Plan. Du kannst eine vorhandene für heute einplanen oder eine neue anlegen.'
                : 'Plane deine erste Routine und starte entspannt in den Tag.'
            }
            actionLabel={hasRoutines ? 'Routine für heute einplanen' : 'Erste Routine planen'}
            onAction={() =>
              hasRoutines
                ? setAddMode('existing')
                : router.push({ pathname: '/editor', params: { forToday: '1' } })
            }
          />
        ) : (
          <View style={{ gap: theme.spacing.base }}>
            {next ? <NextRoutineCard planned={next} onPress={() => startOrResume(next)} /> : null}

            <DayProgressCard
              completed={progress.completed}
              total={progress.total}
              skipped={progress.skipped}
              fraction={progress.fraction}
            />

            {conflicts.length > 0 ? (
              <Card>
                <View style={styles.conflictRow}>
                  <Icon name="clock" size={18} color={theme.colors.warningText} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <AppText variant="headline">
                      {conflicts.length}{' '}
                      {pluralize(conflicts.length, 'Zeitüberschneidung', 'Zeitüberschneidungen')}
                    </AppText>
                    {conflicts.slice(0, 3).map((c) => (
                      <AppText key={`${c.a.routine.id}-${c.b.routine.id}`} variant="caption" color="secondaryText">
                        {c.a.routine.title} und {c.b.routine.title} überlappen sich um {c.overlapMinutes} Min
                      </AppText>
                    ))}
                  </View>
                </View>
              </Card>
            ) : null}

            <View style={{ marginTop: theme.spacing.xs }}>
              <SectionHeader title="Tagesablauf" />
              {planned.map((item, index) => (
                <TimelineItem
                  key={item.routine.id}
                  planned={item}
                  isFirst={index === 0}
                  isLast={index === planned.length - 1}
                  onPress={() => setActionItem(item)}
                />
              ))}
            </View>
          </View>
        )}
      </ScreenContainer>

      <PlannedActionsSheet
        planned={actionItem}
        onClose={() => setActionItem(null)}
        onStart={startOrResume}
      />
      <AddToDaySheet
        key={addMode}
        visible={addMode !== 'closed'}
        initialMode={addMode === 'existing' ? 'existing' : 'choice'}
        planned={planned}
        onClose={() => setAddMode('closed')}
      />

      <BottomSheet visible={conflict !== null} onClose={() => setConflict(null)} title="Eine Routine läuft noch">
        {conflict ? (
          <View style={{ gap: 10 }}>
            <AppText variant="body" color="secondaryText">
              „{conflict.running.routine.title}“ ist noch nicht beendet. Was möchtest du tun?
            </AppText>
            <PrimaryButton
              title={`Bei „${conflict.running.routine.title}“ weitermachen`}
              iconName="play"
              onPress={() => {
                const running = conflict.running;
                setConflict(null);
                void openRun(running);
              }}
            />
            <SecondaryButton
              title={`„${conflict.running.routine.title}“ beenden und „${conflict.wanted.routine.title}“ starten`}
              iconName="skip"
              onPress={() => void endRunningAndStart()}
            />
            <Button variant="ghost" title="Abbrechen" onPress={() => setConflict(null)} />
          </View>
        ) : null}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  progressText: { flex: 1, gap: 2 },
  conflictRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
});

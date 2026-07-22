import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppHeader } from '../../components/common/AppHeader';
import { AppText } from '../../components/common/AppText';
import { FloatingActionButton } from '../../components/common/Buttons';
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
import { useExecutionStore } from '../../store/executionStore';
import { AddToDaySheet } from './AddToDaySheet';
import { PlannedActionsSheet } from './PlannedActionsSheet';

function DayProgressCard({
  completed,
  total,
  fraction,
}: {
  completed: number;
  total: number;
  fraction: number;
}): React.ReactElement {
  const theme = useTheme();
  return (
    <Card elevated style={styles.progressCard}>
      <ProgressRing progress={fraction} size={76} strokeWidth={9}>
        <AppText variant="headline">{`${completed}/${total}`}</AppText>
      </ProgressRing>
      <View style={styles.progressText}>
        <AppText variant="headline">Tagesfortschritt</AppText>
        <AppText variant="callout" color="secondaryText">
          {completed} von {total} {pluralize(total, 'Routine', 'Routinen')} erledigt
        </AppText>
      </View>
    </Card>
  );
}

export function TodayScreen(): React.ReactElement {
  const router = useRouter();
  const theme = useTheme();
  const { dateISO, dateLabel, greeting, planned, next, progress, conflicts } = useToday();
  const [actionItem, setActionItem] = useState<PlannedRoutine | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const startOrResume = async (item: PlannedRoutine): Promise<void> => {
    const execution = item.execution;
    if (execution && (execution.status === 'active' || execution.status === 'paused')) {
      useExecutionStore.getState().attach(item.routine, execution);
    } else {
      await useExecutionStore.getState().start(item.routine, dateISO);
    }
    setActionItem(null);
    router.push({ pathname: '/run', params: { routineId: item.routine.id, date: dateISO } });
  };

  return (
    <View style={styles.flex}>
      <ScreenContainer scroll>
        <AppHeader subtitle={dateLabel} title={greeting} />

        {planned.length === 0 ? (
          <EmptyState
            icon="sparkles"
            title="Dein Tag ist noch frei"
            message="Plane deine erste Routine und starte entspannt in den Tag."
            actionLabel="Erste Routine planen"
            onAction={() => router.push('/editor')}
          />
        ) : (
          <View style={{ gap: theme.spacing.base }}>
            <DayProgressCard
              completed={progress.completed}
              total={progress.total}
              fraction={progress.fraction}
            />

            {next ? <NextRoutineCard planned={next} onPress={() => startOrResume(next)} /> : null}

            {conflicts.length > 0 ? (
              <Card style={{ backgroundColor: theme.colors.accentMuted }}>
                <View style={styles.conflictRow}>
                  <Icon name="clock" size={18} color={theme.colors.warning} />
                  <AppText variant="callout" style={{ flex: 1 }}>
                    {conflicts.length}{' '}
                    {pluralize(conflicts.length, 'Zeitüberschneidung', 'Zeitüberschneidungen')} –
                    prüfe deinen Zeitplan.
                  </AppText>
                </View>
              </Card>
            ) : null}

            <View>
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

      <View style={styles.fab}>
        <FloatingActionButton
          accessibilityLabel="Routine hinzufügen"
          onPress={() => setAddOpen(true)}
        />
      </View>

      <PlannedActionsSheet
        planned={actionItem}
        onClose={() => setActionItem(null)}
        onStart={startOrResume}
      />
      <AddToDaySheet visible={addOpen} onClose={() => setAddOpen(false)} />
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
  conflictRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
});

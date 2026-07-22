import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppHeader } from '../../components/common/AppHeader';
import { AppText } from '../../components/common/AppText';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { Icon } from '../../components/common/Icon';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { SectionHeader } from '../../components/common/SectionHeader';
import { ProgressBar } from '../../components/progress/ProgressBar';
import { WEEKDAY_SHORT } from '../../constants/weekdays';
import { resolveRoutineColor } from '../../constants/colors';
import type { WeekDayStat } from './stats';
import { useStatistics } from '../../hooks/useStatistics';
import { formatDuration } from '../../utils/format';
import { useAppStore } from '../../store/appStore';
import { useTheme } from '../../theme/ThemeProvider';

function StatTile({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: string;
  label: string;
  color: string;
}): React.ReactElement {
  const theme = useTheme();
  return (
    <Card elevated style={styles.tile}>
      <Icon name={icon} size={22} color={color} />
      <AppText variant="title">{value}</AppText>
      <AppText variant="caption" color="secondaryText">
        {label}
      </AppText>
    </Card>
  );
}

function WeeklyChart({ week }: { week: WeekDayStat[] }): React.ReactElement {
  const theme = useTheme();
  const maxHeight = 90;
  return (
    <Card elevated>
      <View style={styles.weekRow}>
        {week.map((day) => {
          const fraction = day.plannedCount === 0 ? 0 : day.completedCount / day.plannedCount;
          const complete = day.plannedCount > 0 && day.completedCount >= day.plannedCount;
          const barColor = day.isFuture
            ? theme.colors.fill
            : complete
              ? theme.colors.success
              : theme.colors.accent;
          return (
            <View key={day.date} style={styles.weekColumn}>
              <View style={[styles.barTrack, { height: maxHeight, backgroundColor: theme.colors.fill }]}>
                <View
                  style={{
                    height: Math.max(6, fraction * maxHeight),
                    backgroundColor: barColor,
                    borderRadius: 6,
                    width: '100%',
                  }}
                />
              </View>
              <AppText
                variant="caption"
                weight={day.isToday ? '700' : '400'}
                style={{ color: day.isToday ? theme.colors.accent : theme.colors.secondaryText }}
              >
                {WEEKDAY_SHORT[day.weekday]}
              </AppText>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

export function ProgressScreen(): React.ReactElement {
  const theme = useTheme();
  const totalRoutines = useAppStore((s) => s.routines.length);
  const { overall, weekly, perRoutine } = useStatistics();

  if (totalRoutines === 0) {
    return (
      <ScreenContainer scroll>
        <AppHeader title="Fortschritt" />
        <EmptyState
          icon="trending"
          title="Noch keine Daten"
          message="Sobald du Routinen abschließt, erscheint hier dein Fortschritt."
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      <AppHeader title="Fortschritt" />

      <View style={styles.tileGrid}>
        <StatTile
          icon="flame"
          value={`${overall.currentStreak}`}
          label="Aktuelle Serie (Tage)"
          color={theme.colors.warning}
        />
        <StatTile
          icon="trending"
          value={`${Math.round(overall.successRate * 100)}%`}
          label="Erfolgsquote (Woche)"
          color={theme.colors.success}
        />
        <StatTile
          icon="award"
          value={`${overall.longestStreak}`}
          label="Längste Serie"
          color={theme.colors.accent}
        />
        <StatTile
          icon="clock"
          value={formatDuration(overall.averageDurationSeconds)}
          label="Ø Dauer"
          color={theme.colors.secondaryText}
        />
      </View>

      <View style={{ marginTop: theme.spacing.lg }}>
        <SectionHeader title="Diese Woche" />
        <WeeklyChart week={weekly} />
      </View>

      <View style={{ marginTop: theme.spacing.lg }}>
        <SectionHeader title="Pro Routine" />
        <Card elevated>
          {perRoutine.map((item, index) => (
            <View
              key={item.routineId}
              style={[
                styles.routineRow,
                index < perRoutine.length - 1
                  ? { borderBottomColor: theme.colors.separator, borderBottomWidth: StyleSheet.hairlineWidth }
                  : null,
              ]}
            >
              <View style={styles.routineHeader}>
                <AppText variant="body" numberOfLines={1} style={{ flex: 1 }}>
                  {item.title}
                </AppText>
                <AppText variant="caption" color="secondaryText">
                  {item.stats.completionCount}× ·{' '}
                  {item.stats.averageDurationSeconds > 0
                    ? formatDuration(item.stats.averageDurationSeconds)
                    : '—'}
                </AppText>
              </View>
              <ProgressBar progress={item.stats.successRate} color={resolveRoutineColor(item.color)} />
            </View>
          ))}
        </Card>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '46%',
    gap: 6,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  weekColumn: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  barTrack: {
    width: 16,
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  routineRow: {
    paddingVertical: 12,
    gap: 8,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
});

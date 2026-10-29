import React from 'react';
import { StyleSheet, View } from 'react-native';

import {
  resolveOnRoutineColor,
  resolveRoutineColor,
  resolveRoutineTextColor,
} from '../../constants/colors';
import { WEEKDAY_LONG, summariseWeekdays } from '../../constants/weekdays';
import type { ISODateString, WeekStart } from '../../types/common';
import type { Routine } from '../../types/routine';
import { addDaysISO, parseISODate, todayISO } from '../../utils/datetime';
import { formatDuration, pluralize } from '../../utils/format';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from '../common/AppText';
import { Icon } from '../common/Icon';
import { PressableScale } from '../common/PressableScale';

interface RoutineCardProps {
  routine: Routine;
  nextOccurrence?: ISODateString | null;
  onPress: () => void;
  weekStartsOn?: WeekStart;
}

function relativeDayLabel(dateISO: ISODateString): string {
  const today = todayISO();
  if (dateISO === today) return 'Heute';
  if (dateISO === addDaysISO(today, 1)) return 'Morgen';
  return WEEKDAY_LONG[parseISODate(dateISO).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6];
}

export function RoutineCard({
  routine,
  nextOccurrence,
  onPress,
  weekStartsOn = 1,
}: RoutineCardProps): React.ReactElement {
  const theme = useTheme();
  const color = resolveRoutineColor(routine.color);
  const textColor = resolveRoutineTextColor(routine.color, theme.scheme);
  const subtitle = [
    formatDuration(routine.estimatedDuration),
    `${routine.steps.length} ${pluralize(routine.steps.length, 'Schritt', 'Schritte')}`,
    summariseWeekdays(routine.schedule.weekdays, weekStartsOn),
  ].join('  ·  ');

  const nextLabel = !routine.isActive
    ? 'Inaktiv'
    : nextOccurrence
      ? `Nächstes Mal: ${relativeDayLabel(nextOccurrence)}`
      : 'Kein Zeitplan';

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.98}
      accessibilityRole="button"
      accessibilityLabel={`${routine.title}, ${subtitle}, ${nextLabel}`}
      accessibilityHint="Öffnet die Details"
      style={[
        styles.card,
        theme.shadows.card,
        {
          backgroundColor: theme.colors.secondaryBackground,
          borderRadius: theme.radii.lg,
          padding: theme.spacing.base,
          opacity: routine.isActive ? 1 : 0.6,
        },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: color }]}>
        <Icon name={routine.icon} size={24} color={resolveOnRoutineColor(routine.color)} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <AppText variant="headline" numberOfLines={1} style={styles.title}>
            {routine.title}
          </AppText>
          {routine.isSample ? (
            <View style={[styles.tag, { backgroundColor: theme.colors.fill }]}>
              <AppText variant="caption" color="secondaryText">
                Beispiel
              </AppText>
            </View>
          ) : null}
        </View>
        <AppText variant="caption" color="secondaryText" numberOfLines={1}>
          {subtitle}
        </AppText>
        <AppText variant="caption" style={{ color: textColor, marginTop: 2 }} weight="600">
          {nextLabel}
        </AppText>
      </View>
      <Icon name="chevronRight" size={20} color={theme.colors.tertiaryText} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flexShrink: 1 },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
});

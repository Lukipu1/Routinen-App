import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { photoForCategory } from '../../constants/photos';
import { WEEKDAY_LONG, summariseWeekdays } from '../../constants/weekdays';
import { haptics } from '../../services/haptics';
import type { ISODateString, WeekStart } from '../../types/common';
import type { Routine } from '../../types/routine';
import { addDaysISO, parseISODate, todayISO } from '../../utils/datetime';
import { formatDuration, pluralize } from '../../utils/format';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from '../common/AppText';
import { Icon } from '../common/Icon';

interface RoutineCardProps {
  routine: Routine;
  nextOccurrence?: ISODateString | null;
  onPress: () => void;
  weekStartsOn?: WeekStart;
  /** Hides the hairline below the row (last row of a group). */
  last?: boolean;
}

function relativeDayLabel(dateISO: ISODateString): string {
  const today = todayISO();
  if (dateISO === today) return 'Heute';
  if (dateISO === addDaysISO(today, 1)) return 'Morgen';
  return WEEKDAY_LONG[parseISODate(dateISO).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6];
}

/**
 * One row of the routines list: category photograph as a rounded thumbnail,
 * title, a secondary line, and the next occurrence — like a row in Podcasts.
 */
export function RoutineCard({
  routine,
  nextOccurrence,
  onPress,
  weekStartsOn = 1,
  last = false,
}: RoutineCardProps): React.ReactElement {
  const theme = useTheme();
  const stepCount = routine.steps.length;
  const subtitle = [
    routine.estimatedDuration > 0 ? formatDuration(routine.estimatedDuration) : null,
    `${stepCount} ${pluralize(stepCount, 'Schritt', 'Schritte')}`,
    summariseWeekdays(routine.schedule.weekdays, weekStartsOn),
  ]
    .filter(Boolean)
    .join(' · ');
  const nextLabel = !routine.isActive
    ? 'Inaktiv'
    : nextOccurrence
      ? `Nächstes Mal: ${relativeDayLabel(nextOccurrence)}`
      : 'Kein Zeitplan';

  return (
    <Pressable
      onPress={() => {
        void haptics.light();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${routine.title}, ${subtitle}, ${nextLabel}`}
      accessibilityHint="Öffnet die Details"
      style={({ pressed }) => [styles.row, pressed ? { backgroundColor: theme.colors.fill } : null]}
    >
      <Image
        source={photoForCategory(routine.category)}
        style={[styles.thumb, { opacity: routine.isActive ? 1 : 0.5 }]}
        accessibilityIgnoresInvertColors
      />
      <View
        style={[
          styles.body,
          { borderBottomColor: theme.colors.separator, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth },
        ]}
      >
        <View style={styles.textColumn}>
          <View style={styles.titleRow}>
            <AppText variant="headline" numberOfLines={1} style={styles.title}>
              {routine.title}
            </AppText>
            {routine.isSample ? (
              <AppText variant="caption" color="tertiaryText">
                Beispiel
              </AppText>
            ) : null}
          </View>
          <AppText variant="caption" color="secondaryText" numberOfLines={1}>
            {subtitle}
          </AppText>
          <AppText variant="caption" color={routine.isActive ? 'secondaryText' : 'tertiaryText'} numberOfLines={1}>
            {nextLabel}
          </AppText>
        </View>
        <Icon name="chevronRight" size={18} color={theme.colors.tertiaryText} strokeWidth={2.5} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 14,
    backgroundColor: '#D1D1D6',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingRight: 16,
    minHeight: 76,
  },
  textColumn: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  title: { flexShrink: 1 },
});

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { resolveRoutineColor } from '../../constants/colors';
import { haptics } from '../../services/haptics';
import type { PlannedRoutine } from '../../types/planning';
import { formatDuration, pluralize } from '../../utils/format';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from '../common/AppText';
import { Icon } from '../common/Icon';
import { StatusBadge, statusLabel } from '../common/StatusBadge';

interface TimelineItemProps {
  planned: PlannedRoutine;
  onPress: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

const SETTLED = new Set(['completed', 'abandoned', 'skipped', 'missed']);

/**
 * One entry of the day's timeline: the time in the margin, a thin rail with a
 * dot in the routine's colour, and a list row with the routine's symbol tile.
 * The routine colour appears only here and in the tile, so it reads as the
 * routine's identity — the accent blue stays reserved for controls.
 */
export function TimelineItem({
  planned,
  onPress,
  isFirst = false,
  isLast = false,
}: TimelineItemProps): React.ReactElement {
  const theme = useTheme();
  const { routine, status, startTime } = planned;
  const color = resolveRoutineColor(routine.color);
  const settled = SETTLED.has(status);
  const live = status === 'active' || status === 'paused';
  const stepCount = routine.steps.length;
  const steps = `${stepCount} ${pluralize(stepCount, 'Schritt', 'Schritte')}`;
  const time = startTime ?? 'Flexibel';
  const dotColor = status === 'completed' ? theme.colors.success : settled ? theme.colors.tertiaryText : color;

  return (
    <View style={styles.row}>
      <View style={styles.timeColumn}>
        <AppText variant="caption" weight="600" color={settled ? 'tertiaryText' : 'secondaryText'} maxFontSizeMultiplier={1.3}>
          {time}
        </AppText>
      </View>
      <View style={styles.railColumn}>
        <View
          style={[
            styles.rail,
            { backgroundColor: theme.colors.separator, top: isFirst ? 22 : 0, bottom: isLast ? undefined : 0, height: isLast ? 22 : undefined },
          ]}
        />
        <View style={[styles.dot, { backgroundColor: dotColor, borderColor: theme.colors.background }]} />
      </View>

      <Pressable
        onPress={() => {
          void haptics.light();
          onPress();
        }}
        accessibilityRole="button"
        accessibilityLabel={`${routine.title}, ${time}, ${formatDuration(routine.estimatedDuration)}, ${steps}, ${statusLabel(status)}`}
        accessibilityHint="Öffnet Aktionen für diese Routine"
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: theme.colors.secondaryBackground,
            borderRadius: theme.radii.md,
            borderWidth: live ? 1.5 : 0,
            borderColor: live ? theme.colors.accent : 'transparent',
            opacity: pressed ? 0.75 : settled ? 0.6 : 1,
          },
        ]}
      >
        <View style={[styles.tile, { backgroundColor: color }]}>
          <Icon name={routine.icon} size={18} color="#FFFFFF" strokeWidth={2.25} />
        </View>
        <View style={styles.body}>
          <AppText variant="headline" numberOfLines={1}>
            {routine.title}
          </AppText>
          <AppText variant="caption" color="secondaryText" numberOfLines={1}>
            {routine.estimatedDuration > 0 ? `${formatDuration(routine.estimatedDuration)} · ` : ''}
            {steps}
          </AppText>
        </View>
        <StatusBadge status={status} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    minHeight: 72,
  },
  timeColumn: {
    width: 48,
    alignItems: 'flex-end',
    paddingTop: 15,
  },
  railColumn: {
    width: 26,
    alignItems: 'center',
  },
  rail: {
    position: 'absolute',
    width: 2,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    marginTop: 16,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    marginBottom: 10,
  },
  tile: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
});

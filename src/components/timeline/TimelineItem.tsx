import React from 'react';
import { StyleSheet, View } from 'react-native';

import { resolveOnRoutineColor, resolveRoutineColor } from '../../constants/colors';
import type { PlannedRoutine } from '../../types/planning';
import { formatDuration, pluralize } from '../../utils/format';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from '../common/AppText';
import { Icon } from '../common/Icon';
import { PressableScale } from '../common/PressableScale';
import { StatusBadge, statusLabel } from '../common/StatusBadge';

interface TimelineItemProps {
  planned: PlannedRoutine;
  onPress: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

const DIMMED = new Set(['completed', 'abandoned', 'skipped', 'missed']);

/** One entry in the vertical day timeline. */
export function TimelineItem({
  planned,
  onPress,
  isFirst = false,
  isLast = false,
}: TimelineItemProps): React.ReactElement {
  const theme = useTheme();
  const { routine, status, startTime } = planned;
  const color = resolveRoutineColor(routine.color);
  const dimmed = DIMMED.has(status);
  const nodeColor =
    status === 'completed'
      ? theme.colors.success
      : status === 'skipped' || status === 'missed' || status === 'abandoned'
        ? theme.colors.tertiaryText
        : status === 'overdue'
          ? theme.colors.warning
          : color;
  const isActive = status === 'active' || status === 'ready' || status === 'overdue';
  const steps = `${routine.steps.length} ${pluralize(routine.steps.length, 'Schritt', 'Schritte')}`;
  const time = startTime ?? 'Flexibel';

  return (
    <View style={styles.row}>
      <View style={styles.timeColumn}>
        <AppText variant="caption" color="secondaryText" maxFontSizeMultiplier={1.3}>
          {time}
        </AppText>
      </View>
      <View style={styles.lineColumn}>
        <View
          style={[
            styles.line,
            {
              backgroundColor: theme.colors.separator,
              top: isFirst ? '50%' : 0,
              bottom: isLast ? '50%' : 0,
            },
          ]}
        />
        <View style={[styles.node, { backgroundColor: nodeColor, borderColor: theme.colors.background }]} />
      </View>

      <PressableScale
        onPress={onPress}
        scaleTo={0.98}
        accessibilityRole="button"
        accessibilityLabel={`${routine.title}, ${time}, ${formatDuration(routine.estimatedDuration)}, ${steps}, ${statusLabel(status)}`}
        accessibilityHint="Öffnet Aktionen für diese Routine"
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.secondaryBackground,
            borderRadius: theme.radii.md,
            padding: theme.spacing.md,
            opacity: dimmed ? 0.6 : 1,
            borderWidth: isActive ? 2 : 0,
            borderColor: isActive ? color : 'transparent',
          },
        ]}
      >
        <View style={[styles.iconCircle, { backgroundColor: color }]}>
          <Icon name={routine.icon} size={20} color={resolveOnRoutineColor(routine.color)} />
        </View>
        <View style={styles.body}>
          <AppText variant="headline" numberOfLines={1}>
            {routine.title}
          </AppText>
          <AppText variant="caption" color="secondaryText" numberOfLines={1}>
            {formatDuration(routine.estimatedDuration)} · {steps}
          </AppText>
        </View>
        <StatusBadge status={status} />
      </PressableScale>
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
    paddingTop: 14,
  },
  lineColumn: {
    width: 28,
    alignItems: 'center',
  },
  line: {
    position: 'absolute',
    width: 2,
  },
  node: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    marginTop: 16,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
});

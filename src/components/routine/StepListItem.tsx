import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { RoutineStep } from '../../types/routine';
import { formatDuration } from '../../utils/format';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from '../common/AppText';
import { Icon } from '../common/Icon';

interface StepListItemProps {
  step: RoutineStep;
  index: number;
  /** Routine colour for the step marker — the routine's identity, not a control. */
  accentColor: string;
  /** Hides the hairline below the row (last row of a group). */
  last?: boolean;
}

/** Read-only step row for grouped lists in routine previews. */
export function StepListItem({ step, index, accentColor, last = false }: StepListItemProps): React.ReactElement {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.badge, { backgroundColor: theme.colors.fill }]}>
        {step.icon ? (
          <Icon name={step.icon} size={15} color={accentColor} strokeWidth={2.25} />
        ) : (
          <AppText variant="caption" weight="600" style={{ color: accentColor }}>
            {index + 1}
          </AppText>
        )}
      </View>
      <View
        style={[
          styles.main,
          { borderBottomColor: theme.colors.separator, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth },
        ]}
      >
        <AppText variant="body" style={styles.title} numberOfLines={1}>
          {step.title}
        </AppText>
        {step.durationInSeconds !== null ? (
          <AppText variant="body" color="secondaryText">
            {formatDuration(step.durationInSeconds)}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingRight: 16,
    minHeight: 48,
  },
  title: { flex: 1 },
});

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
  accentColor: string;
}

/** Read-only step row used in routine previews. */
export function StepListItem({ step, index, accentColor }: StepListItemProps): React.ReactElement {
  const theme = useTheme();
  return (
    <View style={[styles.row, { paddingVertical: theme.spacing.sm }]}>
      <View style={[styles.badge, { backgroundColor: theme.colors.fill }]}>
        {step.icon ? (
          <Icon name={step.icon} size={16} color={accentColor} />
        ) : (
          <AppText variant="caption" weight="600" style={{ color: accentColor }}>
            {index + 1}
          </AppText>
        )}
      </View>
      <AppText variant="body" style={styles.title} numberOfLines={1}>
        {step.title}
      </AppText>
      {step.durationInSeconds !== null ? (
        <AppText variant="caption" color="secondaryText">
          {formatDuration(step.durationInSeconds)}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1 },
});

import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { ColorTokens } from '../../theme/colors';
import type { TimelineStatus } from '../../types/status';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './AppText';
import { Icon } from './Icon';

interface StatusConfig {
  label: string;
  colorToken: keyof ColorTokens;
  icon: string;
}

/** Status is always conveyed by label + icon, never colour alone (a11y). */
const STATUS_CONFIG: Record<TimelineStatus, StatusConfig> = {
  planned: { label: 'Geplant', colorToken: 'secondaryText', icon: 'clock' },
  ready: { label: 'Jetzt', colorToken: 'accent', icon: 'play' },
  active: { label: 'Läuft', colorToken: 'accent', icon: 'play' },
  paused: { label: 'Pausiert', colorToken: 'warning', icon: 'pause' },
  completed: { label: 'Erledigt', colorToken: 'success', icon: 'check' },
  skipped: { label: 'Übersprungen', colorToken: 'tertiaryText', icon: 'skip' },
  missed: { label: 'Verpasst', colorToken: 'secondaryText', icon: 'minus' },
};

interface StatusBadgeProps {
  status: TimelineStatus;
}

export function StatusBadge({ status }: StatusBadgeProps): React.ReactElement {
  const theme = useTheme();
  const config = STATUS_CONFIG[status];
  const color = theme.colors[config.colorToken];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: theme.colors.fill, borderRadius: theme.radii.pill },
      ]}
      accessibilityLabel={config.label}
    >
      <Icon name={config.icon} size={13} color={color} />
      <AppText variant="caption" style={{ color }} weight="600">
        {config.label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
});

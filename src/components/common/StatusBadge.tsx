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
  overdue: { label: 'Überfällig', colorToken: 'warning', icon: 'clock' },
  active: { label: 'Läuft', colorToken: 'accent', icon: 'play' },
  paused: { label: 'Pausiert', colorToken: 'warning', icon: 'pause' },
  completed: { label: 'Erledigt', colorToken: 'success', icon: 'check' },
  abandoned: { label: 'Abgebrochen', colorToken: 'secondaryText', icon: 'close' },
  skipped: { label: 'Übersprungen', colorToken: 'secondaryText', icon: 'skip' },
  missed: { label: 'Verpasst', colorToken: 'secondaryText', icon: 'minus' },
};

interface StatusBadgeProps {
  status: TimelineStatus;
}

/** German label for a timeline status (for accessibility announcements). */
export function statusLabel(status: TimelineStatus): string {
  return STATUS_CONFIG[status].label;
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

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
  overdue: { label: 'Überfällig', colorToken: 'warningText', icon: 'clock' },
  active: { label: 'Läuft', colorToken: 'accent', icon: 'play' },
  paused: { label: 'Pausiert', colorToken: 'warningText', icon: 'pause' },
  completed: { label: 'Erledigt', colorToken: 'successText', icon: 'check' },
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

/** Small symbol + label, like the trailing detail text in a system list row. */
export function StatusBadge({ status }: StatusBadgeProps): React.ReactElement {
  const theme = useTheme();
  const config = STATUS_CONFIG[status];
  const color = theme.colors[config.colorToken];

  return (
    <View style={styles.badge} accessibilityLabel={config.label}>
      <Icon name={config.icon} size={13} color={color} strokeWidth={2.5} />
      <AppText variant="caption" style={{ color }} weight="600" maxFontSizeMultiplier={1.3}>
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
    alignSelf: 'flex-start',
  },
});

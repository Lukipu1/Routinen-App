import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { resolveOnRoutineColor, resolveRoutineColor } from '../../constants/colors';
import type { PlannedRoutine } from '../../types/planning';
import { formatDuration, pluralize } from '../../utils/format';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from '../common/AppText';
import { Icon } from '../common/Icon';
import { PressableScale } from '../common/PressableScale';

interface NextRoutineCardProps {
  planned: PlannedRoutine;
  onPress: () => void;
}

/** Prominent hero card for the next / in-progress routine on the Today screen. */
export function NextRoutineCard({ planned, onPress }: NextRoutineCardProps): React.ReactElement {
  const theme = useTheme();
  const { routine, status, startTime } = planned;
  const color = resolveRoutineColor(routine.color);
  // Light accents (orange, yellow, …) need dark text to stay readable.
  const ink = resolveOnRoutineColor(routine.color);
  const inProgress = status === 'active' || status === 'paused';
  const overdue = status === 'overdue';
  const actionLabel = inProgress ? 'Fortsetzen' : overdue ? 'Nachholen' : 'Starten';
  const eyebrow = inProgress ? 'Weiter geht’s' : overdue ? 'Noch offen' : 'Als Nächstes';
  const meta = [
    startTime ?? 'Flexibel',
    formatDuration(routine.estimatedDuration),
    `${routine.steps.length} ${pluralize(routine.steps.length, 'Schritt', 'Schritte')}`,
  ].join('  ·  ');
  const inkMuted = ink === '#FFFFFF' ? 'rgba(255,255,255,0.9)' : 'rgba(28,28,30,0.8)';
  const inkCircle = ink === '#FFFFFF' ? 'rgba(255,255,255,0.25)' : 'rgba(28,28,30,0.12)';

  return (
    // The shadow lives on a wrapper: `overflow: hidden` on the card itself
    // (needed to clip the gradient) would clip the shadow on iOS.
    <View style={[styles.shadowWrapper, theme.shadows.elevated, { borderRadius: 24 }]}>
      <View style={[styles.card, { backgroundColor: color }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.topRow}>
          <View style={[styles.iconCircle, { backgroundColor: inkCircle }]}>
            <Icon name={routine.icon} size={26} color={ink} />
          </View>
          <AppText variant="caption" style={[styles.eyebrow, { color: inkMuted }]} weight="600">
            {eyebrow.toUpperCase()}
          </AppText>
        </View>
        <AppText variant="title" style={{ color: ink }} numberOfLines={2}>
          {routine.title}
        </AppText>
        <AppText variant="callout" style={[styles.meta, { color: inkMuted }]}>
          {meta}
        </AppText>
        <PressableScale
          onPress={onPress}
          haptic="medium"
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel}: ${routine.title}`}
          style={[styles.button, { backgroundColor: theme.colors.elevatedBackground }]}
        >
          <View style={styles.buttonInner}>
            <Icon name="play" size={20} color={theme.colors.primaryText} />
            <AppText variant="headline">{actionLabel}</AppText>
          </View>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrapper: {},
  card: {
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    letterSpacing: 1,
  },
  meta: { marginBottom: 8 },
  button: {
    borderRadius: 999,
    paddingVertical: 14,
    marginTop: 6,
    minHeight: 48,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});

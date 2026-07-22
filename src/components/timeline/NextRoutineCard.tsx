import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { resolveRoutineColor } from '../../constants/colors';
import type { PlannedRoutine } from '../../types/planning';
import { formatDuration } from '../../utils/format';
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
  const inProgress = status === 'active' || status === 'paused';
  const actionLabel = inProgress ? 'Fortsetzen' : 'Starten';
  const eyebrow = inProgress ? 'Weiter geht’s' : 'Als Nächstes';

  const meta = [
    startTime ?? 'Flexibel',
    formatDuration(routine.estimatedDuration),
    `${routine.steps.length} Schritte`,
  ].join('  ·  ');

  return (
    <View style={[styles.card, theme.shadows.elevated, { backgroundColor: color }]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.topRow}>
        <View style={styles.iconCircle}>
          <Icon name={routine.icon} size={26} color="#FFFFFF" />
        </View>
        <AppText variant="caption" style={styles.eyebrow} weight="600">
          {eyebrow.toUpperCase()}
        </AppText>
      </View>

      <AppText variant="title" style={styles.title} numberOfLines={2}>
        {routine.title}
      </AppText>
      <AppText variant="callout" style={styles.meta}>
        {meta}
      </AppText>

      <PressableScale
        onPress={onPress}
        haptic="medium"
        accessibilityRole="button"
        accessibilityLabel={`${actionLabel}: ${routine.title}`}
        style={styles.button}
      >
        <View style={styles.buttonInner}>
          <Icon name="play" size={20} color={color} />
          <AppText variant="headline" style={{ color }}>
            {actionLabel}
          </AppText>
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1,
  },
  title: { color: '#FFFFFF' },
  meta: { color: 'rgba(255,255,255,0.9)', marginBottom: 8 },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 14,
    marginTop: 6,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});

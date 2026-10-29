import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ImageBackground, Pressable, StyleSheet, View } from 'react-native';

import { photoForCategory } from '../../constants/photos';
import { haptics } from '../../services/haptics';
import type { PlannedRoutine } from '../../types/planning';
import { formatDuration, pluralize } from '../../utils/format';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from '../common/AppText';
import { Icon } from '../common/Icon';

interface NextRoutineCardProps {
  planned: PlannedRoutine;
  onPress: () => void;
}

const WHITE = '#FFFFFF';
const WHITE_MUTED = 'rgba(255,255,255,0.9)';

/**
 * The one bold element on "Heute": the next routine on its category
 * photograph. All text sits in the lower half, on a scrim that reaches 0.85
 * black at the baseline, so white stays legible on even the brightest sky.
 */
export function NextRoutineCard({ planned, onPress }: NextRoutineCardProps): React.ReactElement {
  const theme = useTheme();
  const { routine, status, startTime } = planned;
  const inProgress = status === 'active' || status === 'paused';
  const overdue = status === 'overdue';
  const actionLabel = inProgress ? 'Fortsetzen' : overdue ? 'Nachholen' : 'Starten';
  const eyebrow = inProgress ? 'Weiter geht’s' : overdue ? 'Noch offen' : 'Als Nächstes';
  const stepCount = routine.steps.length;
  const meta = [
    startTime ?? 'Flexibel',
    formatDuration(routine.estimatedDuration),
    `${stepCount} ${pluralize(stepCount, 'Schritt', 'Schritte')}`,
  ].join('  ·  ');

  return (
    <View style={[styles.shadow, theme.shadows.elevated]}>
      <Pressable
        onPress={() => {
          void haptics.medium();
          onPress();
        }}
        accessibilityRole="button"
        accessibilityLabel={`${eyebrow}: ${routine.title}, ${meta}. ${actionLabel}`}
        style={({ pressed }) => [styles.card, { borderRadius: theme.radii.lg, opacity: pressed ? 0.9 : 1 }]}
      >
        <ImageBackground
          source={photoForCategory(routine.category)}
          style={styles.image}
          // Explicit size: on web the inner image would otherwise take the
          // asset's natural 1200×800 and show only its top-left corner.
          imageStyle={{ width: '100%', height: '100%', borderRadius: theme.radii.lg }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.85)']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.content}>
            <AppText variant="caption" weight="600" style={{ color: WHITE_MUTED }}>
              {eyebrow}
            </AppText>
            <AppText variant="title" style={{ color: WHITE }} numberOfLines={2}>
              {routine.title}
            </AppText>
            <View style={styles.bottomRow}>
              <AppText variant="callout" style={[styles.meta, { color: WHITE }]} numberOfLines={1}>
                {meta}
              </AppText>
              <View style={styles.action}>
                <Icon name="play" size={14} color="#000000" strokeWidth={3} />
                <AppText variant="callout" weight="600" style={{ color: '#000000' }} maxFontSizeMultiplier={1.3}>
                  {actionLabel}
                </AppText>
              </View>
            </View>
          </View>
        </ImageBackground>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {},
  card: { overflow: 'hidden' },
  image: { minHeight: 240, justifyContent: 'flex-end' },
  content: { padding: 20, gap: 4 },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
  },
  meta: { flexShrink: 1 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    minHeight: 38,
  },
});

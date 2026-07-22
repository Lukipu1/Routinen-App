import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';

interface ProgressBarProps {
  progress: number;
  color?: string;
  trackColor?: string;
  height?: number;
}

/** Simple rounded progress bar. */
export function ProgressBar({
  progress,
  color,
  trackColor,
  height = 8,
}: ProgressBarProps): React.ReactElement {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View
      style={{
        height,
        borderRadius: height / 2,
        backgroundColor: trackColor ?? theme.colors.fill,
        overflow: 'hidden',
      }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <View
        style={{
          width: `${clamped * 100}%`,
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: color ?? theme.colors.accent,
        }}
      />
    </View>
  );
}

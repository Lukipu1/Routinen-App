import React from 'react';
import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';

interface CardProps extends Omit<ViewProps, 'style'> {
  children: React.ReactNode;
  padded?: boolean;
  /** Floats above the content (soft shadow). Rare: grouped content sits flat. */
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Grouped surface in the iOS style: a rounded white (or dark grey) cell on the
 * grouped background, no border and no shadow unless it genuinely floats.
 */
export function Card({
  children,
  padded = true,
  elevated = false,
  style,
  ...rest
}: CardProps): React.ReactElement {
  const theme = useTheme();
  return (
    <View
      // A card with an accessibilityLabel is read as one unit by screen readers.
      accessible={rest.accessibilityLabel !== undefined ? true : undefined}
      style={[
        {
          backgroundColor: theme.colors.secondaryBackground,
          borderRadius: theme.radii.lg,
          padding: padded ? theme.spacing.base : 0,
          overflow: elevated ? 'visible' : 'hidden',
        },
        elevated ? theme.shadows.elevated : null,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

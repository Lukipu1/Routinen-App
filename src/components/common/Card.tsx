import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';

interface CardProps {
  children: React.ReactNode;
  padded?: boolean;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Rounded surface used for grouped content. */
export function Card({
  children,
  padded = true,
  elevated = false,
  style,
}: CardProps): React.ReactElement {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: elevated
            ? theme.colors.elevatedBackground
            : theme.colors.secondaryBackground,
          borderRadius: theme.radii.lg,
          padding: padded ? theme.spacing.base : 0,
        },
        elevated ? theme.shadows.card : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

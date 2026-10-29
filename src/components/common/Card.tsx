import React from 'react';
import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';

interface CardProps extends Omit<ViewProps, 'style'> {
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
  ...rest
}: CardProps): React.ReactElement {
  const theme = useTheme();
  return (
    <View
      // A card with an accessibilityLabel is read as one unit by screen readers.
      accessible={rest.accessibilityLabel !== undefined ? true : undefined}
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
      {...rest}
    >
      {children}
    </View>
  );
}

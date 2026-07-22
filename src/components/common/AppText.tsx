import React from 'react';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import type { ColorTokens } from '../../theme/colors';
import type { TypographyToken } from '../../theme/typography';
import { useTheme } from '../../theme/ThemeProvider';

type ColorToken = keyof ColorTokens;

interface AppTextProps extends TextProps {
  variant?: TypographyToken;
  color?: ColorToken;
  weight?: TextStyle['fontWeight'];
  center?: boolean;
}

/**
 * The single text primitive. All copy flows through here so typography and
 * colour always come from theme tokens (never hard-coded), and dynamic type
 * scaling stays consistent.
 */
export function AppText({
  variant = 'body',
  color = 'primaryText',
  weight,
  center,
  style,
  children,
  ...rest
}: AppTextProps): React.ReactElement {
  const theme = useTheme();
  return (
    <Text
      style={[
        theme.typography[variant],
        { color: theme.colors[color] },
        weight ? { fontWeight: weight } : null,
        center ? styles.center : null,
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
});

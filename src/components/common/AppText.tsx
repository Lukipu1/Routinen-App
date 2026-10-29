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
 * Dynamic Type is honoured, but very large sizes are capped per variant so
 * dense labels (badges, timestamps) and the big countdown don't blow their
 * fixed-size containers. Body copy still scales generously.
 */
const MAX_SCALE: Partial<Record<TypographyToken, number>> = {
  display: 1.3,
  largeTitle: 1.5,
  title: 1.6,
  caption: 1.6,
};
const DEFAULT_MAX_SCALE = 2;

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
  maxFontSizeMultiplier,
  ...rest
}: AppTextProps): React.ReactElement {
  const theme = useTheme();
  return (
    <Text
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? MAX_SCALE[variant] ?? DEFAULT_MAX_SCALE}
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

import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { useTheme } from './ThemeProvider';
import type { Theme } from './types';

/**
 * Builds a memoised StyleSheet from the current theme.
 *
 * Define the `factory` at module scope (not inline) so its identity is stable
 * and styles are only recomputed when the theme actually changes.
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (theme: Theme) => T,
): T {
  const theme = useTheme();
  return useMemo(() => StyleSheet.create(factory(theme)), [theme, factory]);
}

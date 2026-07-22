import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { getTheme } from './theme';
import type { ColorScheme, Theme, ThemePreference } from './types';

interface ThemeContextValue {
  theme: Theme;
  scheme: ColorScheme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  /** User appearance preference; `system` follows the OS. */
  preference: ThemePreference;
  children: React.ReactNode;
}

export function ThemeProvider({ preference, children }: ThemeProviderProps): React.ReactElement {
  const systemScheme = useColorScheme();
  const resolvedSystem: ColorScheme = systemScheme === 'dark' ? 'dark' : 'light';
  const scheme: ColorScheme = preference === 'system' ? resolvedSystem : preference;

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: getTheme(scheme), scheme }),
    [scheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx.theme;
}

export function useColorSchemeValue(): ColorScheme {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useColorSchemeValue must be used within a ThemeProvider');
  }
  return ctx.scheme;
}

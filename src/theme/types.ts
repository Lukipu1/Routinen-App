import type { ColorTokens } from './colors';
import type { Radii } from './radii';
import type { Shadows } from './shadows';
import type { Spacing } from './spacing';
import type { Typography } from './typography';

/** Resolved appearance actually rendered on screen. */
export type ColorScheme = 'light' | 'dark';

/** User-facing appearance preference; `system` follows the OS setting. */
export type ThemePreference = 'light' | 'dark' | 'system';

export interface Theme {
  scheme: ColorScheme;
  colors: ColorTokens;
  spacing: Spacing;
  radii: Radii;
  typography: Typography;
  shadows: Shadows;
}

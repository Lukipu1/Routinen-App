import { darkColors, lightColors } from './colors';
import { radii } from './radii';
import { buildShadows } from './shadows';
import { spacing } from './spacing';
import type { ColorScheme, Theme } from './types';
import { typography } from './typography';

const lightTheme: Theme = {
  scheme: 'light',
  colors: lightColors,
  spacing,
  radii,
  typography,
  shadows: buildShadows('light'),
};

const darkTheme: Theme = {
  scheme: 'dark',
  colors: darkColors,
  spacing,
  radii,
  typography,
  shadows: buildShadows('dark'),
};

export function getTheme(scheme: ColorScheme): Theme {
  return scheme === 'dark' ? darkTheme : lightTheme;
}

import type { ViewStyle } from 'react-native';

import type { ColorScheme } from './types';

export type ShadowToken = 'none' | 'card' | 'elevated' | 'floating';
export type Shadows = Record<ShadowToken, ViewStyle>;

/**
 * Soft, low-contrast shadows in the Apple style. Shadows read poorly on a pure
 * black canvas, so in dark mode they are toned right down and elevation is
 * carried mostly by surface colour instead.
 */
export function buildShadows(scheme: ColorScheme): Shadows {
  const opacity = scheme === 'dark' ? 0.4 : 0.08;
  const color = '#000000';
  return {
    none: {},
    card: {
      shadowColor: color,
      shadowOpacity: scheme === 'dark' ? 0 : 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: scheme === 'dark' ? 0 : 1,
    },
    elevated: {
      shadowColor: color,
      shadowOpacity: opacity * 0.9,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    floating: {
      shadowColor: color,
      shadowOpacity: opacity,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
  };
}

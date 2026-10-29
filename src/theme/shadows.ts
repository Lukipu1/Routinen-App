import type { ViewStyle } from 'react-native';

import type { ColorScheme } from './types';

export type ShadowToken = 'none' | 'card' | 'elevated' | 'floating';
export type Shadows = Record<ShadowToken, ViewStyle>;

/**
 * iOS carries hierarchy with surface colour, not shadows: grouped cells sit
 * flat on the grouped background. Shadows are reserved for things that really
 * float above the content (the hero photo card, the floating action button).
 * In dark mode depth comes from lighter surfaces, so shadows are dropped.
 */
export function buildShadows(scheme: ColorScheme): Shadows {
  const dark = scheme === 'dark';
  const color = '#000000';
  return {
    none: {},
    card: {},
    elevated: dark
      ? {}
      : {
          shadowColor: color,
          shadowOpacity: 0.12,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 4,
        },
    floating: dark
      ? { elevation: 0 }
      : {
          shadowColor: color,
          shadowOpacity: 0.18,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        },
  };
}

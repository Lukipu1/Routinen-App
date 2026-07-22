/**
 * Spacing scale on a consistent 4pt grid. All paddings, margins and gaps in the
 * UI reference these tokens so rhythm stays uniform across screens.
 */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export type Spacing = typeof spacing;
export type SpacingToken = keyof Spacing;

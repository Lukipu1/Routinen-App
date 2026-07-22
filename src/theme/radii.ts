/**
 * Corner radius scale. `pill` produces fully rounded capsules for buttons and
 * badges; `lg` is the default for cards.
 */
export const radii = {
  sm: 10,
  md: 14,
  lg: 22,
  pill: 999,
} as const;

export type Radii = typeof radii;
export type RadiusToken = keyof Radii;

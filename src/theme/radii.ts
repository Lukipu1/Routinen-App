/**
 * Corner radius scale. Grouped sections and cards use `lg`; nested elements
 * stay concentric (inner radius = outer radius − inset). `pill` produces the
 * capsules used for buttons and chips.
 */
export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export type Radii = typeof radii;
export type RadiusToken = keyof Radii;

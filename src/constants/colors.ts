/**
 * Accent colour palette a routine can be tinted with. Values are chosen to stay
 * legible on both light and dark backgrounds. Models store the key; the UI
 * resolves it here.
 */
export const ROUTINE_COLORS = {
  blue: '#0A84FF',
  teal: '#30B0C7',
  green: '#34C759',
  mint: '#00C7BE',
  indigo: '#5E5CE6',
  purple: '#BF5AF2',
  pink: '#FF375F',
  red: '#FF453A',
  orange: '#FF9F0A',
  yellow: '#FFD60A',
  brown: '#AC8E68',
  gray: '#8E8E93',
} as const;

export type RoutineColorKey = keyof typeof ROUTINE_COLORS;

export const PICKABLE_COLORS: readonly RoutineColorKey[] = [
  'blue',
  'teal',
  'green',
  'mint',
  'indigo',
  'purple',
  'pink',
  'red',
  'orange',
  'yellow',
  'brown',
  'gray',
];

const FALLBACK_COLOR = ROUTINE_COLORS.blue;

/** Resolves a colour key to its hex value, falling back to blue. */
export function resolveRoutineColor(key: string | undefined): string {
  if (key && key in ROUTINE_COLORS) {
    return ROUTINE_COLORS[key as RoutineColorKey];
  }
  return FALLBACK_COLOR;
}

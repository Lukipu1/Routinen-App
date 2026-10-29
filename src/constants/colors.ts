import type { ColorScheme } from '../theme/types';

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

/** German names for the colour picker (screen readers read these). */
export const ROUTINE_COLOR_LABELS: Record<RoutineColorKey, string> = {
  blue: 'Blau',
  teal: 'Türkis',
  green: 'Grün',
  mint: 'Mint',
  indigo: 'Indigo',
  purple: 'Lila',
  pink: 'Pink',
  red: 'Rot',
  orange: 'Orange',
  yellow: 'Gelb',
  brown: 'Braun',
  gray: 'Grau',
};

const DARK_INK = '#1C1C1E';
const LIGHT_INK = '#FFFFFF';

/**
 * Light accents (yellow, orange, mint, green, teal) only reach ~2:1 with white
 * text; they get dark text and icons instead so labels on a coloured surface
 * stay readable (WCAG AA needs 4.5:1).
 */
const ON_COLOR: Record<RoutineColorKey, string> = {
  blue: LIGHT_INK,
  teal: DARK_INK,
  green: DARK_INK,
  mint: DARK_INK,
  indigo: LIGHT_INK,
  purple: LIGHT_INK,
  pink: LIGHT_INK,
  red: LIGHT_INK,
  orange: DARK_INK,
  yellow: DARK_INK,
  brown: DARK_INK,
  gray: LIGHT_INK,
};

/**
 * Darker variants used when a routine colour is drawn *as text* on a light
 * background (e.g. "Nächste: Heute"); the base colours are too light for that.
 * In dark mode the base colours already have enough contrast.
 */
const TEXT_ON_LIGHT: Record<RoutineColorKey, string> = {
  blue: '#0060C8',
  teal: '#007D91',
  green: '#1E8E3E',
  mint: '#008A80',
  indigo: '#4B49C4',
  purple: '#8E3DBF',
  pink: '#D1004B',
  red: '#D62D27',
  orange: '#B35C00',
  yellow: '#7A6500',
  brown: '#7D6240',
  gray: '#6E6E73',
};

const FALLBACK_KEY: RoutineColorKey = 'blue';

function toKey(key: string | undefined): RoutineColorKey {
  return key && key in ROUTINE_COLORS ? (key as RoutineColorKey) : FALLBACK_KEY;
}

/** Resolves a colour key to its hex value, falling back to blue. */
export function resolveRoutineColor(key: string | undefined): string {
  return ROUTINE_COLORS[toKey(key)];
}

/** Text/icon colour that is readable on top of the routine colour. */
export function resolveOnRoutineColor(key: string | undefined): string {
  return ON_COLOR[toKey(key)];
}

/** Same as `resolveOnRoutineColor`, for callers that only hold the hex value. */
export function onColorForHex(hex: string): string {
  const entry = (Object.entries(ROUTINE_COLORS) as [RoutineColorKey, string][]).find(
    ([, value]) => value.toLowerCase() === hex.toLowerCase(),
  );
  return entry ? ON_COLOR[entry[0]] : LIGHT_INK;
}

/** Routine colour suitable for text on the app background in the given scheme. */
export function resolveRoutineTextColor(key: string | undefined, scheme: ColorScheme): string {
  const k = toKey(key);
  return scheme === 'dark' ? ROUTINE_COLORS[k] : TEXT_ON_LIGHT[k];
}

import type { TextStyle } from 'react-native';

/**
 * Typographic scale. On iOS `fontFamily: undefined` resolves to San Francisco,
 * on Android to Roboto — the native system font on each platform, which keeps
 * the Apple-inspired, calm feel without shipping custom fonts.
 */

export type TypographyToken =
  | 'display'
  | 'largeTitle'
  | 'title'
  | 'headline'
  | 'body'
  | 'callout'
  | 'caption';

export type Typography = Record<TypographyToken, TextStyle>;

export const typography: Typography = {
  display: { fontSize: 40, lineHeight: 46, fontWeight: '700', letterSpacing: 0.37 },
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700', letterSpacing: 0.37 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '600', letterSpacing: -0.26 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.43 },
  body: { fontSize: 17, lineHeight: 24, fontWeight: '400', letterSpacing: -0.43 },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400', letterSpacing: -0.31 },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400', letterSpacing: -0.08 },
};

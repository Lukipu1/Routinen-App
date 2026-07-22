/**
 * Colour tokens for light and dark appearance.
 *
 * Values follow Apple's Human Interface semantic system colours so the app
 * feels native on iOS while remaining consistent on Android. Every screen and
 * component reads colours from here through the theme — no hard-coded hex
 * values live in the UI layer.
 */

export interface ColorTokens {
  /** App canvas behind grouped content. */
  background: string;
  /** Cards and grouped cells that sit on top of the background. */
  secondaryBackground: string;
  /** Raised surfaces such as sheets and popovers. */
  elevatedBackground: string;
  /** Primary, highest-contrast text. */
  primaryText: string;
  /** Supporting text and subtitles. */
  secondaryText: string;
  /** De-emphasised text, placeholders and disabled labels. */
  tertiaryText: string;
  /** Hairline dividers. */
  separator: string;
  /** Neutral fill for chips, inputs and inactive controls. */
  fill: string;
  /** Stronger neutral fill (pressed / selected controls). */
  fillStrong: string;
  /** Brand / interactive accent. */
  accent: string;
  /** Text drawn on top of the accent colour. */
  onAccent: string;
  /** Soft tint of the accent for backgrounds. */
  accentMuted: string;
  success: string;
  warning: string;
  error: string;
  /** Scrim behind modals and sheets. */
  overlay: string;
}

export const lightColors: ColorTokens = {
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
  elevatedBackground: '#FFFFFF',
  primaryText: '#000000',
  secondaryText: 'rgba(60,60,67,0.6)',
  tertiaryText: 'rgba(60,60,67,0.3)',
  separator: 'rgba(60,60,67,0.29)',
  fill: 'rgba(118,118,128,0.12)',
  fillStrong: 'rgba(118,118,128,0.2)',
  accent: '#007AFF',
  onAccent: '#FFFFFF',
  accentMuted: 'rgba(0,122,255,0.12)',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  overlay: 'rgba(0,0,0,0.4)',
};

export const darkColors: ColorTokens = {
  background: '#000000',
  secondaryBackground: '#1C1C1E',
  elevatedBackground: '#2C2C2E',
  primaryText: '#FFFFFF',
  secondaryText: 'rgba(235,235,245,0.6)',
  tertiaryText: 'rgba(235,235,245,0.3)',
  separator: 'rgba(84,84,88,0.65)',
  fill: 'rgba(118,118,128,0.24)',
  fillStrong: 'rgba(118,118,128,0.36)',
  accent: '#0A84FF',
  onAccent: '#FFFFFF',
  accentMuted: 'rgba(10,132,255,0.18)',
  success: '#30D158',
  warning: '#FF9F0A',
  error: '#FF453A',
  overlay: 'rgba(0,0,0,0.6)',
};

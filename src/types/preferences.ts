import type { ThemePreference } from '../theme/types';
import type { WeekStart } from './common';

export interface UserPreferences {
  theme: ThemePreference;
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  weekStartsOn: WeekStart;
  reducedMotion: boolean;
  onboardingCompleted: boolean;
  /** Hour the user's day starts (0–23), chosen in onboarding; seeds template start times. */
  dayStartHour: number;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  hapticsEnabled: true,
  notificationsEnabled: false,
  weekStartsOn: 1,
  reducedMotion: false,
  onboardingCompleted: false,
  dayStartHour: 7,
};

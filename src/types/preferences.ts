import type { ThemePreference } from '../theme/types';
import type { WeekStart } from './common';

export type RoutineView = 'list' | 'grid';

export interface UserPreferences {
  theme: ThemePreference;
  hapticsEnabled: boolean;
  soundsEnabled: boolean;
  notificationsEnabled: boolean;
  weekStartsOn: WeekStart;
  reducedMotion: boolean;
  defaultRoutineView: RoutineView;
  onboardingCompleted: boolean;
  /** Rough day-start hour chosen during onboarding (0–23). */
  dayStartHour: number;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  hapticsEnabled: true,
  soundsEnabled: true,
  notificationsEnabled: false,
  weekStartsOn: 1,
  reducedMotion: false,
  defaultRoutineView: 'list',
  onboardingCompleted: false,
  dayStartHour: 7,
};

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { PREFERENCES_STORAGE_KEY } from '../constants/app';
import { setHapticsEnabled } from '../services/haptics';
import { DEFAULT_PREFERENCES, type UserPreferences } from '../types/preferences';

interface PreferencesState {
  preferences: UserPreferences;
  /** True once persisted values have been read back from storage. */
  hydrated: boolean;
  update: (patch: Partial<UserPreferences>) => void;
  reset: () => void;
  setHydrated: (hydrated: boolean) => void;
}

function applySideEffects(preferences: UserPreferences): void {
  setHapticsEnabled(preferences.hapticsEnabled);
}

/** Resolves once the persisted preferences have been read from storage. */
export function waitForPreferencesHydration(): Promise<void> {
  if (usePreferencesStore.persist.hasHydrated()) return Promise.resolve();
  return new Promise((resolve) => {
    const unsubscribe = usePreferencesStore.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
  });
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      preferences: DEFAULT_PREFERENCES,
      hydrated: false,
      update: (patch) => {
        const next = { ...get().preferences, ...patch };
        applySideEffects(next);
        set({ preferences: next });
      },
      reset: () => {
        applySideEffects(DEFAULT_PREFERENCES);
        set({ preferences: DEFAULT_PREFERENCES });
      },
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: PREFERENCES_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      partialize: (state) => ({ preferences: state.preferences }),
      // Keys added in a later version get their default; keys we dropped
      // (e.g. the never-working "Töne" switch) are discarded.
      migrate: (persisted) => {
        const stored = (persisted as { preferences?: Partial<UserPreferences> } | undefined)
          ?.preferences;
        const next: Partial<UserPreferences> = {};
        for (const key of Object.keys(DEFAULT_PREFERENCES) as (keyof UserPreferences)[]) {
          if (stored && stored[key] !== undefined) {
            (next as Record<string, unknown>)[key] = stored[key];
          }
        }
        return { preferences: { ...DEFAULT_PREFERENCES, ...next } };
      },
      merge: (persisted, current) => {
        const stored = (persisted as { preferences?: Partial<UserPreferences> } | undefined)
          ?.preferences;
        return { ...current, preferences: { ...DEFAULT_PREFERENCES, ...stored } };
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          applySideEffects(state.preferences);
        }
        usePreferencesStore.getState().setHydrated(true);
      },
    },
  ),
);

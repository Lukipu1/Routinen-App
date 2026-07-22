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
      partialize: (state) => ({ preferences: state.preferences }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applySideEffects(state.preferences);
        }
        usePreferencesStore.getState().setHydrated(true);
      },
    },
  ),
);

/* eslint-disable @typescript-eslint/no-var-requires */
// Global test setup: mock native-only modules so pure logic and light
// component tests run under Node without a device.

// --- Icons (ESM, native-svg backed) -----------------------------------------
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const stub = (name: string) => {
    const Comp = (props: Record<string, unknown>) =>
      React.createElement('icon', { ...props, testID: props.testID ?? name });
    Comp.displayName = name;
    return Comp;
  };
  return new Proxy(
    { __esModule: true },
    {
      get: (target: Record<string, unknown>, prop: string | symbol) => {
        if (prop in target) return target[prop as string];
        if (typeof prop === 'string') return stub(prop);
        return undefined;
      },
    },
  );
});

// --- Haptics -----------------------------------------------------------------
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// --- Notifications -----------------------------------------------------------
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted', granted: true })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted', granted: true })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  AndroidImportance: { DEFAULT: 3, HIGH: 4 },
  SchedulableTriggerInputTypes: { CALENDAR: 'calendar', DATE: 'date', DAILY: 'daily', WEEKLY: 'weekly' },
}));

// --- AsyncStorage ------------------------------------------------------------
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// --- SQLite (device-only) ----------------------------------------------------
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() =>
    Promise.resolve({
      execAsync: jest.fn(() => Promise.resolve()),
      runAsync: jest.fn(() => Promise.resolve({ lastInsertRowId: 0, changes: 0 })),
      getAllAsync: jest.fn(() => Promise.resolve([])),
      getFirstAsync: jest.fn(() => Promise.resolve(null)),
      withTransactionAsync: jest.fn((cb: () => Promise<void>) => cb()),
      closeAsync: jest.fn(() => Promise.resolve()),
    }),
  ),
}));

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

// --- Reanimated --------------------------------------------------------------
// Reanimated 4's own mock still pulls in the native worklets module, which does
// not exist under Node. Provide a minimal, self-contained stub of the APIs the
// components use so animated components render as plain views in tests.
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');
  const AnimatedView = React.forwardRef((props: Record<string, unknown>, ref: unknown) =>
    React.createElement(View, { ...props, ref }),
  );
  AnimatedView.displayName = 'AnimatedView';
  const createAnimatedComponent = (Component: unknown) => Component;
  const entry = { duration: () => entry, delay: () => entry, springify: () => entry };
  const runFn = (fn: unknown) => (typeof fn === 'function' ? (fn as () => unknown)() : {});
  return {
    __esModule: true,
    default: { View: AnimatedView, createAnimatedComponent },
    View: AnimatedView,
    createAnimatedComponent,
    useSharedValue: (initial: unknown) => ({ value: initial }),
    useAnimatedStyle: runFn,
    useAnimatedProps: runFn,
    withTiming: (value: unknown) => value,
    withSpring: (value: unknown) => value,
    withDelay: (_delay: unknown, value: unknown) => value,
    FadeIn: entry,
    FadeInDown: entry,
    FadeOutDown: entry,
  };
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
// Backed by a real in-memory SQLite (node:sqlite) so repository and store tests
// run their actual SQL — including foreign keys and cascades.
jest.mock('expo-sqlite', () => require('./src/testing/sqliteFake').createExpoSqliteMock());

// Date logic in the app works in local time; run the suite in a real timezone
// with DST so the "spring forward" tests actually cross a DST boundary
// instead of silently passing in UTC.
process.env.TZ = 'Europe/Berlin';

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts?(x)', '**/*.test.ts?(x)'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-reanimated|react-native-worklets|lucide-react-native|@react-native-async-storage/.*))',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/index.ts',
    '!src/testing/**',
  ],
  // The pure logic (planner, execution, statistics, database) is where bugs
  // cost data; keep it well covered. Screens are covered by smoke tests only.
  coverageThreshold: {
    'src/features/planner/**': { statements: 90, branches: 80 },
    'src/features/execution/executionLogic.ts': { statements: 85, branches: 75 },
    'src/features/statistics/stats.ts': { statements: 90, branches: 80 },
    'src/database/**': { statements: 80, branches: 60 },
  },
};

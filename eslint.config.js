// Flat ESLint config based on Expo's shared config.
const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'metro.config.js', 'babel.config.js'],
  },
  {
    // The new React-Compiler-aware rules false-positive on two intentional
    // patterns here: mutating Reanimated shared values (`.value = ...`) and
    // resolving an icon component from a registry during render. We do not use
    // the React Compiler, so these are safe to disable.
    rules: {
      'react-hooks/immutability': 'off',
      'react-hooks/static-components': 'off',
    },
  },
  {
    // Test setup and specs legitimately use require() for mock factories.
    files: ['jest.setup.ts', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];

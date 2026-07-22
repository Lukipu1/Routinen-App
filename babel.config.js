module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo automatically adds the react-native-worklets plugin
    // (required by Reanimated 4) when the package is installed, so it must not
    // be listed again here or Babel throws a duplicate-plugin error.
    presets: ['babel-preset-expo'],
  };
};

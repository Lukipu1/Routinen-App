// Default Metro configuration for Expo. Kept explicit so future customizations
// (asset extensions, resolver tweaks) have a single obvious home.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;

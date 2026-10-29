// Default Metro configuration for Expo, plus what the web target needs:
// expo-sqlite on web loads a wasm build of SQLite and uses SharedArrayBuffer,
// which browsers only enable for cross-origin-isolated pages. The dev server
// sends the two headers below; a production host must send them as well.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

config.server = config.server ?? {};
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  return middleware(req, res, next);
};

module.exports = config;

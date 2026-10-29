// Extends app.json. The only dynamic bit is the web base path: when the web
// build is hosted under a sub-path (GitHub Pages serves the repository at
// /<repo>/), EXPO_WEB_BASE_URL makes Expo emit matching asset and route URLs.
module.exports = ({ config }) => {
  const baseUrl = process.env.EXPO_WEB_BASE_URL;
  if (!baseUrl) return config;
  return {
    ...config,
    experiments: { ...(config.experiments ?? {}), baseUrl },
  };
};

#!/usr/bin/env node
/**
 * Builds the static web version into dist/ and prepares it for plain static
 * hosts (GitHub Pages, Netlify, …):
 *
 * - `EXPO_WEB_BASE_URL=/repo` emits URLs for sub-path hosting.
 * - expo-sqlite on web needs a cross-origin-isolated page (SharedArrayBuffer).
 *   Hosts that cannot send COOP/COEP headers get `coi-serviceworker`, a tiny
 *   service worker that adds them client-side on the first load.
 * - `404.html` mirrors `index.html` so deep links resolve on GitHub Pages,
 *   and `.nojekyll` keeps the `_expo/` folder from being ignored.
 *
 * Usage: node scripts/build-web.mjs [--base /Routinen-App] [--no-coi]
 */
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const baseIndex = args.indexOf('--base');
const base = baseIndex >= 0 ? (args[baseIndex + 1] ?? '') : (process.env.EXPO_WEB_BASE_URL ?? '');
const withCoi = !args.includes('--no-coi');
const root = resolve(new URL('..', import.meta.url).pathname);
const dist = join(root, 'dist');

execSync('npx expo export --platform web --output-dir dist', {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, CI: '1', EXPO_WEB_BASE_URL: base },
});

const indexPath = join(dist, 'index.html');
let html = readFileSync(indexPath, 'utf8');

if (withCoi) {
  const source = join(root, 'node_modules', 'coi-serviceworker', 'coi-serviceworker.min.js');
  if (!existsSync(source)) throw new Error('coi-serviceworker is not installed (npm install).');
  copyFileSync(source, join(dist, 'coi-serviceworker.min.js'));
  // Must run before the app bundle: it registers the worker and reloads once.
  html = html.replace(
    '</head>',
    `  <script src="${base}/coi-serviceworker.min.js"></script>\n</head>`,
  );
}

writeFileSync(indexPath, html);
writeFileSync(join(dist, '404.html'), html);
writeFileSync(join(dist, '.nojekyll'), '');

console.log(`\nWeb build ready in dist/ (base "${base || '/'}", coi-serviceworker ${withCoi ? 'on' : 'off'}).`);

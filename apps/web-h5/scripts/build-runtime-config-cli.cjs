const path = require('node:path');
const { createRequire } = require('node:module');
// Reuse tsx's esbuild dependency without adding a second bundler to the workspace.
const { buildSync } = createRequire(require.resolve('tsx/package.json'))('esbuild');
const root = path.resolve(__dirname, '..');
buildSync({
  entryPoints: [path.join(root, 'scripts/runtime-config.mts')],
  outfile: path.join(root, '.next/standalone/apps/web-h5/scripts/runtime-config.mjs'),
  bundle: true,
  platform: 'node',
  target: 'node22.13',
  format: 'esm',
  banner: {
    js: "import { createRequire as createBundledRequire } from 'node:module'; const require = createBundledRequire(import.meta.url);"
  },
  alias: { 'next/server': path.join(root, 'scripts/runtime-config-cli-lifecycle.ts') },
  tsconfig: path.join(root, 'tsconfig.json')
});

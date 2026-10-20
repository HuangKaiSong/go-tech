const { cpSync, existsSync } = require('node:fs');
const path = require('node:path');
const { checkBuildCss } = require('./check-build-css.cjs');
const { preparePageBlockDirectory } = require('../lib/page-block-directory.cjs');

const appRoot = path.resolve(__dirname, '..');
const standaloneRoot = path.join(appRoot, '.next/standalone/apps/web-h5');
const serverPath = path.join(standaloneRoot, 'server.js');

if (!existsSync(serverPath)) {
  throw new Error('Standalone build not found. Run pnpm build:h5 before starting H5.');
}

// Next.js does not include these assets in standalone output by default.
checkBuildCss();
// Resolve before server.js changes cwd. Preserve editor saves from the previous deployment.
preparePageBlockDirectory(appRoot);
const publicRoot = path.join(appRoot, 'public');
if (existsSync(publicRoot)) {
  cpSync(publicRoot, path.join(standaloneRoot, 'public'), {
    recursive: true,
    filter: source => source !== path.join(publicRoot, 'page-blocks')
  });
}
cpSync(path.join(appRoot, '.next/static'), path.join(standaloneRoot, '.next/static'), { recursive: true });

process.env.PORT ??= '3200';
process.env.HOSTNAME = '0.0.0.0';

require(serverPath);

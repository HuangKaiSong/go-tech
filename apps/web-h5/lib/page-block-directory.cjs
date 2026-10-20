const { constants, copyFileSync, existsSync, mkdirSync, readdirSync } = require('node:fs');
const path = require('node:path');

/** @param {string} directory @param {string[]} sources */
function initializePageBlockDirectory(directory, sources) {
  mkdirSync(directory, { recursive: true });
  const availableSources = sources.filter(
    source => path.resolve(source) !== path.resolve(directory) && existsSync(source)
  );
  for (const source of availableSources) {
    const files = readdirSync(source, { withFileTypes: true }).filter(
      entry => entry.isFile() && entry.name.endsWith('.json')
    );
    for (const entry of files) {
      try {
        copyFileSync(path.join(source, entry.name), path.join(directory, entry.name), constants.COPYFILE_EXCL);
      } catch (error) {
        if (!(error instanceof Error && 'code' in error && error.code === 'EEXIST')) throw error;
      }
    }
  }
}

function getPageBlockDirectory() {
  const configured = process.env.H5_PAGE_BLOCKS_DIR;
  if (configured && !path.isAbsolute(configured)) {
    throw new Error('H5_PAGE_BLOCKS_DIR must be an absolute path');
  }
  return configured || path.join(process.cwd(), 'data', 'page-blocks');
}

/** @param {string} appRoot */
function preparePageBlockDirectory(appRoot) {
  process.env.H5_PAGE_BLOCKS_DIR ||= path.join(appRoot, 'data', 'page-blocks');
  initializePageBlockDirectory(getPageBlockDirectory(), [
    path.join(appRoot, '.next/standalone/apps/web-h5/public/page-blocks'),
    path.join(appRoot, 'public', 'page-blocks')
  ]);
}

module.exports = { getPageBlockDirectory, initializePageBlockDirectory, preparePageBlockDirectory };

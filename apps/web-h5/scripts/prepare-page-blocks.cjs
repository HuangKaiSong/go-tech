const path = require('node:path');
const { preparePageBlockDirectory } = require('../lib/page-block-directory.cjs');

// Migrate old editor saves before next build removes the previous standalone output.
preparePageBlockDirectory(path.resolve(__dirname, '..'));

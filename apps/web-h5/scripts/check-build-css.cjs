const { readdirSync, readFileSync } = require('node:fs');
const path = require('node:path');

function readStyles(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap(entry => {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) return readStyles(file);
      return entry.name.endsWith('.css') ? [readFileSync(file, 'utf8')] : [];
    })
    .join('\n');
}

// Check emitted assets, including artifacts restored by Turbo, rather than source files.
function checkBuildCss(directory = path.resolve(__dirname, '../.next/static')) {
  const css = readStyles(directory);
  const required = [
    ['application stage', /\.view-mode-stage\s*\{/],
    ['application frame', /\.view-mode-frame\s*\{/],
    ['scroll container', /\.view-mode-scroll\s*\{/],
    ['floating controls', /\.view-mode-controls\s*\{/],
    ['display mode switcher', /\.view-mode-switcher\s*\{/],
    ['responsive frame variants', /@container\s+view\s*\(/],
    ['WhatsApp brand color', /--whatsapp\s*:\s*142\s+70%\s+45%/]
  ];
  const missing = required.filter(([, pattern]) => !pattern.test(css)).map(([name]) => name);
  if (missing.length) {
    throw new Error(`Incomplete H5 production CSS: ${missing.join(', ')}. Rebuild before publishing.`);
  }
}

module.exports = { checkBuildCss };

if (require.main === module) {
  checkBuildCss(process.argv[2]);
  console.log('H5 production CSS verified.');
}

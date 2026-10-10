import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function nodeTests(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return nodeTests(path);
    return entry.name.endsWith('.test.ts') && readFileSync(path, 'utf8').includes("from 'node:test'") ? [path] : [];
  });
}

// The existing suite uses both node:test and Vitest; run each with its own runner.
const legacy = spawnSync('tsx', ['--test', 'proxy.test.ts', ...nodeTests('lib'), ...nodeTests('app')], {
  stdio: 'inherit'
});
const components = spawnSync('vitest', ['run'], { stdio: 'inherit' });
process.exit(legacy.status === 0 && components.status === 0 ? 0 : 1);

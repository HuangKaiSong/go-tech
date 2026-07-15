import { Generator, getConfig } from '@tanstack/router-generator';
const root = process.cwd();
const config = getConfig({
  autoCodeSplitting: true,
  generatedRouteTree: './src/features/router/routeTree.gen.ts',
  routeFileIgnorePattern: '(?:^|/)(components|modules)(?:/|$)|(?:^|/)(loading|error|not-found)(?:.tsx?|$)',
  routesDirectory: './src/pages',
  routeToken: 'layout',
  target: 'react',
}, root);
const gen = new Generator({ config, root });
await gen.run();
console.log('GEN_OK');

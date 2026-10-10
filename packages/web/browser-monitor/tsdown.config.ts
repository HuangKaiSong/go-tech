import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  dts: true,
  platform: 'browser',
  external: ['@go-tech/monitor-contract', '@rrweb/record', 'web-vitals']
});

import { defineConfig } from 'tsdown';
export default defineConfig({
  entry: ['src/model.ts'],
  dts: true,
  external: ['zod', '@go-tech/manual-content/model'],
  platform: 'neutral'
});

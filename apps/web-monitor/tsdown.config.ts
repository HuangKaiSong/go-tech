import { defineConfig } from 'tsdown';

export default defineConfig({ entry: ['src/main.ts'], platform: 'node', noExternal: ['@go-tech/monitor-contract'] });

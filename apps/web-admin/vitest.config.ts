import path from 'node:path';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      babel: { plugins: ['babel-plugin-react-compiler'] }
    }).map(p => ({
      ...p,
      applyToEnvironment: e => e.name === 'client'
    }))
  ],
  test: {
    env: loadEnv(mode, process.cwd(), ''),
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}']
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  }
}));

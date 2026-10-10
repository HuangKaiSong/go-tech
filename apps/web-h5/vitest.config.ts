import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  oxc: { jsx: { runtime: 'automatic' } },
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
    dedupe: ['react', 'react-dom']
  },
  test: {
    environment: 'jsdom',
    include: [
      'tests/view-mode/*.test.{ts,tsx}',
      'app/api/feedback/turnstile-policy.test.ts',
      'app/components/feedback/submission-lock.test.ts'
    ],
    setupFiles: ['tests/view-mode/setup.ts']
  }
});

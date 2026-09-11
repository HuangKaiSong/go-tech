import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { dedupe: ['react', 'react-dom'] },
  test: {
    environment: 'node',
    include: ['tests/*.test.tsx'],
    server: { deps: { inline: ['@go-tech-frontend/ui'] } }
  }
});

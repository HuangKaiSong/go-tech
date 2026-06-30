import { COVERAGE_EXCLUDE, baseCoverageConfig, baseTestConfig } from '@go-tech/config/vitest';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    ...baseTestConfig,
    coverage: {
      ...baseCoverageConfig,
      exclude: [...COVERAGE_EXCLUDE, '**/types.ts', '**/theme.json']
    }
  }
});

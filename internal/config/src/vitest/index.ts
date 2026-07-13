export const COVERAGE_EXCLUDE = [
  '**/dist/**',
  '**/node_modules/**',
  '**/*.config.ts',
  '**/types.ts'
];

export const baseCoverageConfig = {
  provider: 'v8' as const,
  reporter: ['text', 'json', 'html']
};

export const baseTestConfig = {
  clearMocks: true,
  globals: true,
  restoreMocks: true
};

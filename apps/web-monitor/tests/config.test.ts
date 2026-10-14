import { afterEach, expect, it, vi } from 'vitest';
import { createMysqlStore } from '../src/config';
afterEach(() => {
  vi.unstubAllEnvs();
});
it('requires a database URL even when legacy file storage variables are present', () => {
  vi.stubEnv('MONITOR_DATABASE_URL', '');
  vi.stubEnv('MONITOR_STORAGE', 'file');
  expect(() => createMysqlStore(86400000, 100)).toThrow('MONITOR_DATABASE_URL is required');
});

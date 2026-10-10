import { describe, expect, it } from 'vitest';
import { reportSchema } from '../src/index';

const common = {
  schemaVersion: 1,
  id: '11111111-1111-4111-8111-111111111111',
  timestamp: 1000,
  context: {
    app: 'web-h5',
    sessionId: '11111111-1111-4111-8111-111111111111',
    pageId: '11111111-1111-4111-8111-111111111111',
    path: '/en',
    release: 'test',
    language: 'en',
    userAgent: 'test',
    viewport: { width: 100, height: 100 }
  },
  metrics: []
};

describe('monitor contract', () => {
  it('accepts performance without errors', () => {
    expect(reportSchema.safeParse({ ...common, kind: 'performance', hasError: false }).success).toBe(true);
  });
  it('rejects URL queries and unknown context fields', () => {
    for (const context of [
      { ...common.context, path: '/en?token=secret' },
      { ...common.context, token: 'secret' }
    ]) {
      expect(reportSchema.safeParse({ ...common, context, kind: 'performance', hasError: false }).success).toBe(false);
    }
  });
  it('requires a base snapshot or an explicit unavailability reason', () => {
    const error = { kind: 'javascript', name: 'Error', message: 'test' };
    expect(
      reportSchema.safeParse({ ...common, kind: 'error', error, breadcrumbs: [], replay: { events: [] } }).success
    ).toBe(false);
    expect(
      reportSchema.safeParse({
        ...common,
        kind: 'error',
        error,
        breadcrumbs: [],
        replay: { events: [], unavailableReason: 'not-ready' }
      }).success
    ).toBe(true);
    expect(
      reportSchema.safeParse({
        ...common,
        kind: 'error',
        error,
        breadcrumbs: [],
        replay: { events: [{ type: 3, timestamp: 1, data: {} }] }
      }).success
    ).toBe(false);
  });
});

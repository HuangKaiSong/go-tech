import { randomUUID } from 'node:crypto';
import type { MonitorReport } from '@go-tech/monitor-contract';

export function fixture(kind: 'error' | 'performance' = 'error'): MonitorReport {
  const common = {
    schemaVersion: 1 as const,
    id: randomUUID(),
    timestamp: Date.now(),
    timeSource: 'client' as const,
    metrics: [],
    context: {
      app: 'web-h5' as const,
      sessionId: randomUUID(),
      pageId: randomUUID(),
      path: '/en/monitor',
      release: 'test',
      userAgent: 'test',
      language: 'en',
      viewport: { width: 100, height: 100 },
      authentication: {
        status: 'verified' as const,
        userId: '42',
        token: 'secret-test-token',
        cookie: 'session=secret-test-cookie'
      }
    }
  };
  return kind === 'performance'
    ? { ...common, kind, hasError: false }
    : {
        ...common,
        kind,
        error: { kind: 'react-client', name: 'Error', message: 'test' },
        breadcrumbs: [],
        replay: {
          events: [
            { type: 2, timestamp: 1, data: { node: {} } },
            { type: 3, timestamp: 2, data: { source: 1 } }
          ]
        }
      };
}

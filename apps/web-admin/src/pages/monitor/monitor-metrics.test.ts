import type { ReportSummary } from '@go-tech/monitor-contract';
import { describe, expect, it } from 'vitest';
import { metricValue, summarizeMetrics } from './monitor-metric-model';

function report(pageId: string, timestamp: number, value: number): ReportSummary {
  return {
    schemaVersion: 1,
    kind: 'performance',
    hasError: false,
    id: '11111111-1111-4111-8111-111111111111',
    timestamp,
    receivedAt: timestamp,
    replayEventCount: 0,
    context: {
      app: 'web-h5',
      pageId,
      sessionId: '11111111-1111-4111-8111-111111111111',
      path: '/',
      release: 'test',
      language: 'en',
      userAgent: 'test',
      viewport: { width: 10, height: 10 }
    },
    metrics: [{ id: 'lcp', name: 'LCP', value, rating: 'good', navigationType: 'navigate' }]
  };
}

describe('monitor metrics', () => {
  it('deduplicates document snapshots before computing p75', () => {
    const summaries = summarizeMetrics([
      report('one', 1, 900),
      report('one', 2, 100),
      report('two', 2, 200),
      report('three', 2, 300),
      report('four', 2, 400)
    ]);
    expect(summaries.find(metric => metric.name === 'LCP')).toEqual({ name: 'LCP', samples: 4, value: 300 });
    expect(summaries.find(metric => metric.name === 'INP')).toEqual({ name: 'INP', samples: 0, value: undefined });
  });
  it('keeps CLS unitless and formats durations', () => {
    expect(metricValue({ name: 'CLS', value: 0.05 })).toBe('0.050');
    expect(metricValue({ name: 'INP', value: 123 })).toBe('123 ms');
    expect(metricValue({ name: 'LCP', value: 2500 })).toBe('2.50 s');
  });
});

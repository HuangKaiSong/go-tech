import type { MonitorMetric, ReportSummary } from '@go-tech/monitor-contract';

export const metricNames: MonitorMetric['name'][] = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'];
export function metricValue(metric: Pick<MonitorMetric, 'name' | 'value'>) {
  if (metric.name === 'CLS') return metric.value.toFixed(3);
  return metric.value >= 1000 ? `${(metric.value / 1000).toFixed(2)} s` : `${Math.round(metric.value)} ms`;
}

/** A report is a snapshot; count each metric ID once per document before computing p75. */
export function summarizeMetrics(reports: ReportSummary[]) {
  const documents = new Map<string, ReportSummary>();
  for (const report of reports) {
    const current = documents.get(report.context.pageId);
    if (!current || report.timestamp > current.timestamp) documents.set(report.context.pageId, report);
  }
  return metricNames.map(name => {
    const values = [...documents.values()]
      .flatMap(report => report.metrics.filter(metric => metric.name === name).map(metric => metric.value))
      .toSorted((a, b) => a - b);
    return {
      name,
      samples: values.length,
      value: values.length ? values[Math.ceil(values.length * 0.75) - 1] : undefined
    };
  });
}

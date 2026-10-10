import type { MonitorMetric } from '@go-tech/monitor-contract';
import { metricNames, metricValue } from './monitor-metric-model';

const ratingLabels = { good: '良好', 'needs-improvement': '需改善', poor: '較差' };
const ratingClasses = { good: 'text-emerald-700', 'needs-improvement': 'text-amber-700', poor: 'text-destructive' };

export function MetricCell({ metric }: { metric?: MonitorMetric }) {
  if (!metric) return <span className="text-muted-foreground">—</span>;
  return (
    <span className={ratingClasses[metric.rating]} title={ratingLabels[metric.rating]}>
      {metricValue(metric)}
    </span>
  );
}

export function MetricCards({ metrics }: { metrics: MonitorMetric[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {metricNames.map(name => (
        <div key={name} className="rounded-lg border border-border bg-card p-4">
          <div className="mb-2 text-sm text-muted-foreground">{name}</div>
          <div className="text-lg font-semibold">
            <MetricCell metric={metrics.find(metric => metric.name === name)} />
          </div>
        </div>
      ))}
    </div>
  );
}

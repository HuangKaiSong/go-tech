import type {
  Breadcrumb,
  ErrorReport,
  MonitorContext,
  MonitorError,
  MonitorMetric,
  MonitorReport
} from '@go-tech/monitor-contract';
import { record } from '@rrweb/record';
import { type Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import { createIdentifier } from './identifier';
import { redactText, safePath, sanitizeRecording } from './privacy';
import { ReplayBuffer } from './replay-buffer';
import { type ReportDeliveryContext, type ReportQueueStore, createReportQueue } from './report-queue';

export { createAdaptiveReportTransport } from './adaptive-upload';
export { uploadReportChunks } from './chunk-upload';
export { ReportDeliveryError } from './report-queue';
export type { ReportDeliveryContext } from './report-queue';

export interface BrowserMonitorOptions {
  /** Defaults to five seconds of post-error DOM changes. */
  postErrorMs?: number;
  /** Optional storage adapter, primarily for isolated simulations. */
  queueStore?: ReportQueueStore;
  release?: string;
  transport: (report: MonitorReport, delivery: ReportDeliveryContext) => Promise<void>;
}

export interface BrowserMonitor {
  captureError: (error: unknown, extra?: Partial<MonitorError>) => void;
  flush: () => void;
  getContext: () => MonitorContext;
  navigation: (url: string) => void;
  stop: () => void;
}

function describeError(error: unknown, extra: Partial<MonitorError>): MonitorError {
  const value = error instanceof Error ? error : undefined;
  return {
    ...extra,
    kind: extra.kind ?? 'javascript',
    name: redactText(extra.name ?? value?.name ?? 'Error', 100),
    message: redactText(extra.message ?? value?.message ?? (typeof error === 'string' ? error : 'Unknown error')),
    stack: value?.stack ? redactText(value.stack, 12000) : undefined,
    componentStack: extra.componentStack ? redactText(extra.componentStack, 12000) : undefined,
    digest: extra.digest ? redactText(extra.digest, 100) : undefined,
    businessCode: typeof extra.businessCode === 'string' ? redactText(extra.businessCode, 100) : extra.businessCode
  };
}

/** Browser-only recording; HTTP transport is supplied by the application. */
export function startBrowserMonitor(options: BrowserMonitorOptions): BrowserMonitor {
  const sessionId = sessionIdentifier();
  const pageId = createIdentifier();
  const documentPath = safePath(location.href);
  const buffer = new ReplayBuffer();
  const metrics = new Map<string, MonitorMetric>();
  const breadcrumbs: Breadcrumb[] = [];
  const fingerprints = new Map<string, number>();
  const pending = new Map<string, { bytes: number; report: ErrorReport; timer: ReturnType<typeof setTimeout> }>();
  const queue = createReportQueue(options.transport, options.queueStore, pageId);
  let stopped = false;
  let hasError = false;
  let recordingFailed = false;
  let errorsInWindow = 0;
  let windowStarted = Date.now();
  let lastMetrics = '';
  let metricReportId = createIdentifier();

  function context(path = safePath(location.href)): MonitorContext {
    return {
      app: 'web-h5',
      sessionId,
      pageId,
      path,
      release: (options.release ?? 'development').slice(0, 100),
      language: navigator.language.slice(0, 50),
      userAgent: navigator.userAgent.slice(0, 500),
      viewport: { width: window.innerWidth, height: window.innerHeight },
      device: {
        platform: navigator.platform.slice(0, 100),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone.slice(0, 100),
        mobile: /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)
      }
    };
  }

  function send(report: MonitorReport) {
    queue.enqueue(report);
  }

  function finish(id: string) {
    const incident = pending.get(id);
    if (!incident) return;
    clearTimeout(incident.timer);
    pending.delete(id);
    const end: ErrorReport['replay']['events'][number] = {
      type: 5,
      timestamp: Date.now(),
      data: { tag: 'monitor-clip-end', payload: {} }
    };
    const size = new TextEncoder().encode(JSON.stringify(end)).length;
    if (incident.bytes + size <= 2500000 && incident.report.replay.events.length < 29000) {
      incident.report.replay.events.push(end);
    }
    send(incident.report);
  }

  function captureError(error: unknown, extra: Partial<MonitorError> = {}) {
    if (stopped || isCancellation(error)) return;
    try {
      const description = describeError(error, extra);
      requestBreadcrumb(description);
      const now = Date.now();
      const key = `${description.kind}:${description.name}:${description.message}:${description.status ?? ''}:${description.businessCode ?? ''}:${description.stack ?? ''}`;
      if (now - (fingerprints.get(key) ?? 0) < 5000) return;
      if (now - windowStarted > 60000) {
        windowStarted = now;
        errorsInWindow = 0;
        fingerprints.clear();
      }
      if (errorsInWindow >= 10 || pending.size >= 3) return;
      errorsInWindow += 1;
      fingerprints.set(key, now);
      hasError = true;
      const serverError = description.kind === 'next-server';
      const events = serverError ? [] : errorSnapshot(now);
      const report: ErrorReport = {
        schemaVersion: 1,
        id: createIdentifier(),
        timestamp: now,
        timeSource: 'client',
        context: context(),
        kind: 'error',
        error: description,
        metrics: [...metrics.values()],
        breadcrumbs: [...breadcrumbs],
        replay: { events, unavailableReason: serverError ? 'server-error' : replayReason(events.length) }
      };
      if (!events.length) {
        send(report);
        return;
      }
      // Persist the initial replay immediately; a terminated page can recover this checkpoint.
      queue.enqueue(report, now + (options.postErrorMs ?? 5000) + 60000);
      pending.set(report.id, {
        report,
        bytes: new TextEncoder().encode(JSON.stringify(events)).length,
        timer: setTimeout(() => finish(report.id), options.postErrorMs ?? 5000)
      });
    } catch {
      // Serialization/recording must never interfere with application control flow.
    }
  }

  function errorSnapshot(now: number) {
    // Refresh by snapshot age, rather than the most recent mouse/DOM event.
    if (buffer.lastSnapshotAt && now - buffer.lastSnapshotAt >= 10000) {
      try {
        record.takeFullSnapshot(true);
      } catch {
        recordingFailed = true;
      }
    }
    return buffer.snapshot();
  }

  function requestBreadcrumb(description: MonitorError) {
    if (!['business', 'http', 'network'].includes(description.kind)) return;
    breadcrumbs.push({
      timestamp: Date.now(),
      category: 'request',
      message: `${description.kind}: ${description.status ?? description.businessCode ?? '-'}`
    });
    if (breadcrumbs.length > 50) breadcrumbs.shift();
  }

  function replayReason(length: number): ErrorReport['replay']['unavailableReason'] {
    if (length) return undefined;
    if (recordingFailed) return 'recording-failed';
    if (buffer.limited) return 'buffer-limit';
    return 'not-ready';
  }

  function emit(event: { data: unknown; timestamp: number; type: number }) {
    if (stopped) return;
    try {
      const safe = sanitizeRecording(event);
      buffer.add(safe);
      const size = new TextEncoder().encode(JSON.stringify(safe)).length;
      for (const [id, incident] of pending) {
        if (incident.bytes + size > 2500000 || incident.report.replay.events.length >= 29000) {
          finish(id);
        } else {
          incident.report.replay.events.push(safe);
          incident.bytes += size;
        }
      }
    } catch {
      recordingFailed = true;
    }
  }

  const onError = (event: ErrorEvent | Event) => {
    if (event instanceof ErrorEvent) {
      captureError(event.error ?? event.message);
    } else if (event.target instanceof Element) {
      captureError(`Failed to load ${event.target.tagName.toLowerCase()} resource`, { kind: 'resource' });
    }
  };
  const onRejection = (event: PromiseRejectionEvent) => captureError(event.reason, { kind: 'unhandled-rejection' });
  window.addEventListener('error', onError, true);
  window.addEventListener('unhandledrejection', onRejection);

  let stopRecord: (() => void) | undefined;
  try {
    stopRecord = record({
      emit,
      checkoutEveryNms: 10000,
      recordAfter: 'DOMContentLoaded',
      maskAllInputs: true,
      maskTextSelector: '[data-monitor-mask], .monitor-mask, [contenteditable]',
      blockSelector: '[data-monitor-block], .monitor-block, img, svg, video, audio, canvas, iframe, object, embed',
      slimDOMOptions: 'all',
      inlineStylesheet: true,
      recordCanvas: false,
      sampling: { mousemove: 50, scroll: 200, input: 'last' },
      errorHandler: () => {
        recordingFailed = true;
        return true;
      }
    });
  } catch {
    recordingFailed = true;
  }
  // rrweb's checkoutEveryNms only runs when events arrive. A timer also bounds
  // quiet recordings; hidden tabs refresh synchronously on the next error.
  const snapshotInterval = setInterval(() => {
    if (stopped || document.visibilityState === 'hidden' || !buffer.lastSnapshotAt) return;
    if (Date.now() - buffer.lastSnapshotAt < 10000) return;
    try {
      record.takeFullSnapshot(true);
    } catch {
      recordingFailed = true;
    }
  }, 10000);

  function metric(value: Metric) {
    if (stopped || !Number.isFinite(value.value) || value.value < 0) return;
    metrics.set(value.name, {
      id: value.id.slice(0, 100),
      name: value.name,
      value: value.value,
      rating: value.rating,
      navigationType: value.navigationType
    });
    if (JSON.stringify({ metrics: [...metrics.values()], hasError }) === lastMetrics) return;
    // Preserve measured vitals even if the process exits before the next periodic flush.
    queue.enqueue(performanceReport(), Date.now() + 60000);
  }
  // Web Vitals observer registration is document-scoped; callbacks become no-ops after stop.
  for (const observe of [onCLS, onFCP, onINP, onLCP, onTTFB]) {
    try {
      observe(metric, { reportAllChanges: true });
    } catch {
      /* Unsupported browsers omit unavailable metrics. */
    }
  }

  function performanceReport(): MonitorReport {
    return {
      schemaVersion: 1,
      id: metricReportId,
      timestamp: Date.now(),
      timeSource: 'client',
      context: context(documentPath),
      kind: 'performance',
      metrics: [...metrics.values()],
      hasError
    };
  }

  function flush() {
    for (const id of pending.keys()) finish(id);
    const signature = JSON.stringify({ metrics: [...metrics.values()], hasError });
    if (metrics.size && signature !== lastMetrics) {
      lastMetrics = signature;
      send(performanceReport());
      metricReportId = createIdentifier();
    }
  }
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') flush();
  };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', flush);
  const interval = setInterval(flush, 15000);
  const checkpoints = setInterval(() => {
    for (const { report } of pending.values()) {
      queue.enqueue(report, report.timestamp + (options.postErrorMs ?? 5000) + 60000);
    }
  }, 1000);

  return {
    getContext: () => context(),
    captureError,
    navigation(url) {
      breadcrumbs.push({ timestamp: Date.now(), category: 'navigation', message: safePath(url, location.href) });
      if (breadcrumbs.length > 50) breadcrumbs.shift();
    },
    flush,
    stop() {
      if (stopped) return;
      flush();
      stopped = true;
      queue.stop();
      clearInterval(checkpoints);
      clearInterval(interval);
      clearInterval(snapshotInterval);
      stopRecord?.();
      buffer.clear();
      window.removeEventListener('error', onError, true);
      window.removeEventListener('unhandledrejection', onRejection);
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    }
  };
}

function isCancellation(value: unknown) {
  return typeof value === 'object' && value !== null && 'name' in value && value.name === 'AbortError';
}

function sessionIdentifier() {
  try {
    const existing = sessionStorage.getItem('go-tech-monitor-session');
    if (existing && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing))
      return existing;
    const id = createIdentifier();
    sessionStorage.setItem('go-tech-monitor-session', id);
    return id;
  } catch {
    return createIdentifier();
  }
}

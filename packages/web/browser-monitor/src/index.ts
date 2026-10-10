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

export interface BrowserMonitorOptions {
  /** Defaults to five seconds of post-error DOM changes. */
  postErrorMs?: number;
  release?: string;
  transport: (report: MonitorReport) => Promise<void>;
}

export interface BrowserMonitor {
  captureError: (error: unknown, extra?: Partial<MonitorError>) => void;
  flush: () => void;
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
  const sends = new Set<Promise<void>>();
  let stopped = false;
  let hasError = false;
  let recordingFailed = false;
  let errorsInWindow = 0;
  let windowStarted = Date.now();
  let lastMetrics = '';

  function context(path = safePath(location.href)): MonitorContext {
    return {
      app: 'web-h5',
      sessionId,
      pageId,
      path,
      release: (options.release ?? 'development').slice(0, 100),
      language: navigator.language.slice(0, 50),
      userAgent: navigator.userAgent.slice(0, 500),
      viewport: { width: window.innerWidth, height: window.innerHeight }
    };
  }

  function send(report: MonitorReport) {
    // Bounded concurrency; monitoring failures never create application errors or toasts.
    if (sends.size >= 4) return;
    const task = Promise.resolve()
      .then(() => options.transport(report))
      .catch(() => undefined);
    sends.add(task);
    task.finally(() => sends.delete(task));
  }

  function finish(id: string) {
    const incident = pending.get(id);
    if (!incident) return;
    clearTimeout(incident.timer);
    pending.delete(id);
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
      const events = errorSnapshot(now);
      const report: ErrorReport = {
        schemaVersion: 1,
        id: createIdentifier(),
        timestamp: now,
        context: context(),
        kind: 'error',
        error: description,
        metrics: [...metrics.values()],
        breadcrumbs: [...breadcrumbs],
        replay: { events, unavailableReason: replayReason(events.length) }
      };
      if (!events.length) {
        send(report);
        return;
      }
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
    // rrweb checkout is event-driven. Refresh a stale scene after a long idle period
    // so replay does not begin hours before an otherwise isolated error.
    if (now - buffer.lastEventAt > 60000) {
      try {
        record.takeFullSnapshot();
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
      maskTextSelector: '*',
      blockSelector: '[data-monitor-block], .monitor-block, img, svg, video, audio, canvas, iframe, object, embed',
      slimDOMOptions: 'all',
      inlineStylesheet: true,
      recordCanvas: false,
      sampling: { mousemove: false, scroll: 200, input: 'last' },
      errorHandler: () => {
        recordingFailed = true;
        return true;
      }
    });
  } catch {
    recordingFailed = true;
  }

  function metric(value: Metric) {
    if (stopped || !Number.isFinite(value.value) || value.value < 0) return;
    metrics.set(value.name, {
      id: value.id.slice(0, 100),
      name: value.name,
      value: value.value,
      rating: value.rating,
      navigationType: value.navigationType
    });
  }
  // Web Vitals observer registration is document-scoped; callbacks become no-ops after stop.
  for (const observe of [onCLS, onFCP, onINP, onLCP, onTTFB]) {
    try {
      observe(metric, { reportAllChanges: true });
    } catch {
      /* Unsupported browsers omit unavailable metrics. */
    }
  }

  function flush() {
    for (const id of pending.keys()) finish(id);
    const signature = JSON.stringify({ metrics: [...metrics.values()], hasError });
    if (metrics.size && signature !== lastMetrics) {
      lastMetrics = signature;
      send({
        schemaVersion: 1,
        id: createIdentifier(),
        timestamp: Date.now(),
        context: context(documentPath),
        kind: 'performance',
        metrics: [...metrics.values()],
        hasError
      });
    }
  }
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') flush();
  };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', flush);
  const interval = setInterval(flush, 15000);

  return {
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
      clearInterval(interval);
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

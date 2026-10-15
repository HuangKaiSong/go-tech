import { MAX_REPORT_BYTES, type MonitorReport, reportSchema } from '@go-tech/monitor-contract';

const MAX_AGE = 24 * 60 * 60 * 1000;
const MAX_BYTES = 20 * 1024 * 1024;
const MAX_ITEMS = 50;

export interface UploadProgress {
  chunkBytes?: number;
  forceChunks?: boolean;
  index: number;
  uploadId: string;
}

export interface QueuedReport {
  attempts: number;
  bytes: number;
  createdAt: number;
  id: string;
  nextAttemptAt: number;
  progress?: UploadProgress;
  readyAt: number;
  report: MonitorReport;
}

export interface ReportQueueStore {
  list: () => Promise<QueuedReport[]>;
  put: (entry: QueuedReport) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

/** Retry metadata contains no response payloads or credentials. */
export class ReportDeliveryError extends Error {
  constructor(
    readonly retryable: boolean,
    readonly retryAfterMs = 0,
    readonly adaptSize = false
  ) {
    super('Monitor delivery failed');
  }
}

function retained(entries: QueuedReport[]) {
  const result: QueuedReport[] = [];
  let bytes = 0;
  for (const entry of entries.toSorted((a, b) => b.createdAt - a.createdAt)) {
    if (
      entry.createdAt >= Date.now() - MAX_AGE &&
      entry.bytes <= MAX_REPORT_BYTES &&
      result.length < MAX_ITEMS &&
      bytes + entry.bytes <= MAX_BYTES
    ) {
      result.push(entry);
      bytes += entry.bytes;
    }
  }
  return result;
}

/** Browser storage only: server persistence remains MySQL. */
export function createIndexedDBReportStore(): ReportQueueStore {
  let database: Promise<IDBDatabase> | undefined;
  function open() {
    database ??= new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('go-tech-monitor-outbox', 1);
      const timeout = setTimeout(() => reject(new Error('Monitor storage unavailable')), 2000);
      request.onupgradeneeded = () => request.result.createObjectStore('reports', { keyPath: 'id' });
      const failed = () => {
        clearTimeout(timeout);
        reject(new Error('Monitor storage unavailable'));
      };
      request.addEventListener('error', failed);
      request.addEventListener('blocked', failed);
      request.onsuccess = () => {
        clearTimeout(timeout);
        const db = request.result;
        db.onversionchange = () => db.close();
        resolve(db);
      };
    });
    return database;
  }
  async function transaction<T>(
    mode: IDBTransactionMode,
    execute: (store: IDBObjectStore, done: (value: T) => void) => void
  ) {
    const db = await open();
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction('reports', mode);
      let result: T;
      tx.oncomplete = () => resolve(result);
      const failed = () => reject(new Error('Monitor storage transaction failed'));
      tx.addEventListener('abort', failed);
      tx.addEventListener('error', failed);
      execute(tx.objectStore('reports'), value => {
        result = value;
      });
    });
  }
  return {
    list: () =>
      transaction<QueuedReport[]>('readonly', (store, done) => {
        const request = store.getAll();
        request.onsuccess = () => done(request.result as QueuedReport[]);
      }),
    put: entry =>
      transaction<void>('readwrite', store => {
        const request = store.getAll();
        request.onsuccess = () => {
          const entries = request.result as QueuedReport[];
          const keep = retained([...entries.filter(item => item.id !== entry.id), entry]);
          const ids = new Set(keep.map(item => item.id));
          for (const item of entries) if (!ids.has(item.id)) store.delete(item.id);
          if (ids.has(entry.id)) store.put(entry);
        };
      }),
    remove: id =>
      transaction<void>('readwrite', store => {
        store.delete(id);
      })
  };
}

export interface ReportDeliveryContext {
  checkpoint: () => Promise<void>;
  progress: UploadProgress;
  recovered: boolean;
}

export interface ReportQueue {
  /** Delayed entries checkpoint clips while their post-error recording is still open. */
  enqueue: (report: MonitorReport, readyAt?: number) => void;
  stop: () => void;
  wake: () => void;
}

export function createReportQueue(
  transport: (report: MonitorReport, delivery: ReportDeliveryContext) => Promise<void>,
  store: ReportQueueStore = createIndexedDBReportStore(),
  pageId?: string
): ReportQueue {
  const memory = new Map<string, QueuedReport>();
  let persistent = true;
  let stopped = false;
  let busy = false;
  let nextSendAt = 0;
  let writes = Promise.resolve();

  async function read() {
    if (persistent) {
      try {
        return await store.list();
      } catch {
        persistent = false;
      }
    }
    return [...memory.values()];
  }
  async function put(entry: QueuedReport) {
    memory.set(entry.id, entry);
    const keep = new Set(retained([...memory.values()]).map(item => item.id));
    for (const id of memory.keys()) if (!keep.has(id)) memory.delete(id);
    if (persistent) {
      try {
        await store.put(entry);
      } catch {
        persistent = false;
      }
    }
  }
  async function remove(id: string) {
    if (persistent) {
      try {
        await store.remove(id);
      } catch {
        persistent = false;
      }
    }
    memory.delete(id);
  }
  function serialize(work: () => Promise<void>) {
    writes = writes.then(work).catch(() => undefined);
    return writes;
  }
  async function pump() {
    if (busy || stopped || navigator.onLine === false || Date.now() < nextSendAt) return;
    busy = true;
    try {
      await writes;
      const entries = await read();
      const valid = retained(entries);
      const ids = new Set(valid.map(item => item.id));
      await Promise.all(entries.filter(item => !ids.has(item.id)).map(item => remove(item.id)));
      const entry = valid
        .filter(item => item.readyAt <= Date.now() && item.nextAttemptAt <= Date.now())
        .toSorted((a, b) => a.createdAt - b.createdAt)[0];
      if (!entry || stopped) return;
      // One in-flight upload also keeps aggregate keepalive usage below the browser quota.
      nextSendAt = Date.now() + 1500;
      try {
        if (!reportSchema.safeParse(entry.report).success) {
          await serialize(() => remove(entry.id));
          return;
        }
        const progress = entry.progress ?? { index: 0, uploadId: '' };
        entry.progress = progress;
        await transport(entry.report, {
          recovered:
            entry.report.context.pageId !== pageId || entry.attempts > 0 || Date.now() - entry.createdAt > 60000,
          progress,
          checkpoint: () => serialize(() => put(entry))
        });
        await serialize(() => remove(entry.id));
      } catch (error) {
        if (error instanceof ReportDeliveryError && !error.retryable) {
          await serialize(() => remove(entry.id));
        } else {
          const delay = Math.min(60000, 2000 * 2 ** Math.min(entry.attempts, 5)) * (0.8 + Math.random() * 0.4);
          entry.attempts += 1;
          const retryAfter = error instanceof ReportDeliveryError ? Math.min(MAX_AGE, error.retryAfterMs) : 0;
          entry.nextAttemptAt = Date.now() + Math.max(delay, retryAfter);
          await serialize(() => put(entry));
        }
      }
    } catch {
      // Monitoring must never create an unhandled rejection in the application.
    } finally {
      busy = false;
    }
  }
  const wake = () => {
    pump().catch(() => undefined);
  };
  const timer = setInterval(wake, 1000);
  window.addEventListener('online', wake);
  window.addEventListener('pageshow', wake);
  wake();
  return {
    enqueue(report, readyAt = Date.now()) {
      try {
        // Snapshot before asynchronous writes; do not persist server-enriched credentials.
        const copy: MonitorReport = JSON.parse(JSON.stringify(report));
        delete copy.context.authentication;
        const bytes = new TextEncoder().encode(JSON.stringify(copy)).length;
        if (bytes > MAX_REPORT_BYTES) return;
        const entry: QueuedReport = {
          id: copy.id,
          report: copy,
          bytes,
          createdAt: copy.timestamp,
          readyAt,
          attempts: 0,
          nextAttemptAt: 0
        };
        serialize(() => put(entry)).then(wake);
      } catch {
        /* Invalid/oversized recordings must not affect the page. */
      }
    },
    wake,
    stop() {
      stopped = true;
      clearInterval(timer);
      window.removeEventListener('online', wake);
      window.removeEventListener('pageshow', wake);
    }
  };
}

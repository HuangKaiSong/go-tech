import { resolve } from 'node:path';
import { createMonitorServer } from './server';
import { ReportStore } from './store';

function positiveInteger(name: string, fallback: number) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`Invalid ${name}`);
  return value;
}

const store = new ReportStore(
  resolve(process.env.MONITOR_DATA_DIR ?? './data'),
  positiveInteger('MONITOR_RETENTION_DAYS', 7) * 86400000,
  positiveInteger('MONITOR_MAX_REPORTS', 10000)
);
await store.initialize();
const server = createMonitorServer(store, {
  ingest: process.env.MONITOR_INGEST_TOKEN ?? '',
  query: process.env.MONITOR_QUERY_TOKEN ?? ''
});
const port = positiveInteger('MONITOR_PORT', 8200);
if (port > 65535) throw new Error('Invalid MONITOR_PORT');
server.listen(port, process.env.MONITOR_HOST ?? '127.0.0.1');
const cleanup = setInterval(() => {
  store.prune().catch(() => undefined);
}, 3600000);
cleanup.unref();
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    clearInterval(cleanup);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  });
}

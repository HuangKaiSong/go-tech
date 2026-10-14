import { createMysqlStore, positiveInteger } from './config';
import { createMonitorServer } from './server';

const retentionMs = positiveInteger('MONITOR_RETENTION_DAYS', 7) * 86400000;
const maxReports = positiveInteger('MONITOR_MAX_REPORTS', 10000);
// MySQL is the only runtime storage; database configuration and schema are required.
const store = createMysqlStore(retentionMs, maxReports);
try {
  await store.initialize();
} catch {
  await store.close();
  throw new Error('Monitor storage initialization failed; check schema, database and key configuration');
}
const server = createMonitorServer(
  store,
  {
    ingest: process.env.MONITOR_INGEST_TOKEN ?? '',
    query: process.env.MONITOR_QUERY_TOKEN ?? ''
  },
  { maxInFlightUploads: positiveInteger('MONITOR_INGEST_CONCURRENCY', 16) }
);
const port = positiveInteger('MONITOR_PORT', 8200);
if (port > 65535) throw new Error('Invalid MONITOR_PORT');
server.listen(port, process.env.MONITOR_HOST ?? '127.0.0.1');
// Error messages intentionally omit driver errors, which can contain SQL values and credentials.
const cleanup = setInterval(
  () => {
    store.prune().catch(() => {
      process.stderr.write('Monitor database cleanup failed\n');
    });
  },
  positiveInteger('MONITOR_MAINTENANCE_MS', 60000)
);
cleanup.unref();
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    clearInterval(cleanup);
    server.close(() => {
      store.close().then(
        () => process.exit(0),
        () => process.exit(1)
      );
    });
    setTimeout(() => process.exit(1), 10000).unref();
  });
}

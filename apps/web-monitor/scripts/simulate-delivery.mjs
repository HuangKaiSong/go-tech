import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import { createConnection } from 'mysql2/promise';
import { build } from 'tsdown';
import { relayMonitorReport } from '../../web-h5/lib/browser-monitor/relay';
import { createMonitorServer } from '../src/server';
import { ReportCodec } from '../src/storage/codec';
import { MysqlReportStore } from '../src/storage/mysql-report-store';
// An explicit test URL is required; this script never reads the application .env.
const testUrl = process.env.MONITOR_TEST_DATABASE_URL;
if (!testUrl) throw new Error('MONITOR_TEST_DATABASE_URL is required (isolated test MySQL only)');
const directory = await mkdtemp(resolve(tmpdir(), 'monitor-delivery-'));
const database = `monitor_sim_${randomUUID().replaceAll('-', '')}`;
let admin;
let store;
let monitor;
let gateway;
let context;
let origin = '';
async function open() {
  const page = await context.newPage();
  page.on('pageerror', error => console.error('Simulation page error:', error.message));
  await page.goto(origin);
  await page.waitForFunction(() => 'simulation' in window);
  return page;
}
async function rows(page) {
  return page.evaluate('window.simulation.rows()');
}
async function captured(page, message) {
  await page.evaluate(text => {
    window.simulation.capture(text);
  }, message);
  await page.waitForFunction(async () => (await window.simulation.rows()).length > 0);
  return (await rows(page)).find(row => 'replay' in row.report)?.id;
}
async function committed(id) {
  for (let count = 0; count < 300; count += 1) {
    // oxlint-disable-next-line no-await-in-loop -- Poll the real database until the browser receives its acknowledgement.
    const report = await store.getStored(id);
    if (report) return report;
    // oxlint-disable-next-line no-await-in-loop -- Bounded integration polling, not application retry logic.
    await new Promise(done => {
      setTimeout(done, 200);
    });
  }
  throw new Error('Simulation report was not committed');
}
try {
  admin = await createConnection(testUrl);
  await admin.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_bin`);
  const url = new URL(testUrl);
  url.pathname = `/${database}`;
  const connection = await createConnection(url.toString());
  await migrate(drizzle(connection), { migrationsFolder: './drizzle', migrationsTable: 'monitor_schema_migrations' });
  await connection.end();
  store = new MysqlReportStore({
    url: url.toString(),
    codec: new ReportCodec('v1', { v1: '01'.repeat(32) }),
    retentionMs: 86400000,
    maxReports: 1000
  });
  await store.initialize();
  monitor = createMonitorServer(store, { ingest: 'simulation-ingest', query: 'simulation-query' });
  monitor.listen(0, '127.0.0.1');
  await once(monitor, 'listening');
  const monitorAddress = monitor.address();
  assert(monitorAddress && typeof monitorAddress !== 'string');
  const serviceUrl = `http://127.0.0.1:${monitorAddress.port}`;
  const entry = resolve(directory, 'entry.ts');
  await writeFile(
    entry,
    `
import { initializeBrowserMonitor, captureBrowserError } from ${JSON.stringify(resolve('../web-h5/lib/browser-monitor/client.ts'))};
initializeBrowserMonitor();
window.simulation = { capture: message => captureBrowserError(new Error(message)),
  rows: () => new Promise((resolve, reject) => {
    const request = indexedDB.open('go-tech-monitor-outbox', 1);
    request.onsuccess = () => { const db = request.result; const tx = db.transaction('reports');
      const rows = tx.objectStore('reports').getAll(); rows.onsuccess = () => resolve(rows.result); tx.oncomplete = () => db.close(); };
    request.onerror = reject;
  }) };
`
  );
  await build({
    config: false,
    entry: { simulation: entry },
    outDir: resolve(directory, 'bundle'),
    platform: 'browser',
    format: 'esm',
    dts: false,
    noExternal: [/.*/],
    tsconfig: resolve('../web-h5/tsconfig.json'),
    define: {
      'process.env.NEXT_PUBLIC_BROWSER_MONITOR_ENABLED': '"true"',
      'process.env.NODE_ENV': '"test"',
      'process.env.NEXT_PUBLIC_BROWSER_MONITOR_RELEASE': '"simulation"',
      'process.env.GO_TECH_LANGUAGE': '"en"'
    }
  });
  const bundleName = (await readdir(resolve(directory, 'bundle'))).find(name => /simulation\.(m?js)$/.test(name));
  assert(bundleName);
  const bundle = await readFile(resolve(directory, 'bundle', bundleName));
  const chunksSeen = [];
  let loseAcknowledgement;
  let lostAcknowledgements = 0;
  let failChunkOnce = false;
  gateway = createServer(async (incoming, outgoing) => {
    try {
      if (incoming.url === '/bundle.js') {
        outgoing.setHeader('Content-Type', 'text/javascript');
        outgoing.end(bundle);
        return;
      }
      if (incoming.method !== 'POST') {
        outgoing.setHeader('Content-Type', 'text/html');
        outgoing.end(
          '<!doctype html><html><body><h1>监控上报模拟</h1><main id="content"></main><script type="module" src="/bundle.js"></script></body></html>'
        );
        return;
      }
      const pieces = [];
      for await (const piece of incoming) pieces.push(Buffer.from(piece));
      const body = Buffer.concat(pieces).toString();
      const value = JSON.parse(body);
      if (value.protocol === 'monitor-chunk-v1') {
        chunksSeen.push({ id: value.id, index: value.index });
        if (value.index === 2 && failChunkOnce) {
          failChunkOnce = false;
          outgoing.writeHead(503);
          outgoing.end('{}');
          return;
        }
      }
      const response = await relayMonitorReport(
        new Request(`${origin}/api/browser-monitor`, {
          method: 'POST',
          headers: new Headers(
            Object.entries(incoming.headers).flatMap(([key, headerValue]) =>
              typeof headerValue === 'string' ? [[key, headerValue]] : []
            )
          ),
          body
        }),
        { serviceUrl, ingestToken: 'simulation-ingest' }
      );
      const result = await response.text();
      const ack = JSON.parse(result);
      if (loseAcknowledgement === value.id && response.ok && (ack.data?.complete || value.kind)) {
        loseAcknowledgement = undefined;
        lostAcknowledgements += 1;
        outgoing.writeHead(502);
        outgoing.end('{}');
        return;
      }
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      outgoing.end(result);
    } catch {
      if (!outgoing.destroyed) {
        outgoing.writeHead(500);
        outgoing.end('{}');
      }
    }
  });
  gateway.listen(0, '127.0.0.1');
  await once(gateway, 'listening');
  const address = gateway.address();
  assert(address && typeof address !== 'string');
  origin = `http://127.0.0.1:${address.port}`;
  context = await chromium.launchPersistentContext(resolve(directory, 'profile'), {
    channel: 'chrome',
    headless: true
  });
  let page = await open();
  await context.setOffline(true);
  const offlineId = await captured(page, 'simulation-offline-close');
  assert(offlineId);
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await page.waitForTimeout(100);
  await page.close();
  await context.setOffline(false);
  page = await open();
  assert.equal((await committed(offlineId)).report.id, offlineId);
  await page.waitForFunction(async () => (await window.simulation.rows()).length === 0);
  console.log('PASS: offline → tab close → reopen → MySQL commit → local queue empty');
  // A large sanitized DOM forces multiple small chunks rather than one large request.
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 100,
    downloadThroughput: 65536,
    uploadThroughput: 16384
  });
  await page.evaluate(() => {
    for (let index = 0; index < 600; index += 1) {
      const element = document.createElement('div');
      element.textContent = `模拟界面 ${index} ${'回放测试'.repeat(30)}`;
      document.body.append(element);
    }
  });
  await page.waitForTimeout(200);
  failChunkOnce = true;
  const replayId = await captured(page, 'simulation-slow-replay');
  assert(replayId);
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await page.waitForFunction(async () => (await window.simulation.rows()).some(row => (row.progress?.index ?? 0) >= 2));
  const expectedReplay = (await rows(page)).find(row => row.id === replayId)?.report.replay?.events;
  assert(expectedReplay);
  await page.close();
  page = await open();
  const stored = await committed(replayId);
  assert.equal(stored.report.kind, 'error');
  if (stored.report.kind === 'error') assert.deepEqual(stored.report.replay.events, expectedReplay);
  assert.equal(chunksSeen.filter(chunk => chunk.id === replayId && chunk.index === 0).length, 1);
  assert.equal(stored.report.context.authentication?.status, 'unverified');
  console.log(
    'PASS: 16 KiB/s upload + interrupted chunk + tab close → resume without resending chunk 0 → complete replay'
  );
  await page.waitForFunction(async () => (await window.simulation.rows()).length === 0);
  const duplicateId = await captured(page, 'simulation-lost-ack');
  assert(duplicateId);
  loseAcknowledgement = duplicateId;
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await committed(duplicateId);
  await page.waitForFunction(async () => (await window.simulation.rows()).length === 0);
  assert.equal(lostAcknowledgements, 1);
  const duplicateRows = await store.connection(client =>
    store.query(client, 'SELECT id FROM monitor_reports WHERE id=?', [duplicateId])
  );
  assert.equal(duplicateRows.length, 1);
  console.log('PASS: commit succeeds but ACK is lost → same UUID retries → exactly one MySQL report');
  const crashId = await captured(page, 'simulation-browser-crash');
  assert(crashId);
  const browserSession = await context.browser()?.newBrowserCDPSession();
  assert(browserSession);
  await browserSession.send('Browser.crash').catch(() => undefined);
  context = await chromium.launchPersistentContext(resolve(directory, 'profile'), {
    channel: 'chrome',
    headless: true
  });
  page = await open();
  await page.clock.install();
  await page.clock.fastForward(70000);
  await committed(crashId);
  console.log(
    'PASS: browser process crash before pagehide/finalize → relaunch same profile → recover persisted replay checkpoint'
  );
} finally {
  await context?.close().catch(() => undefined);
  await new Promise(done => {
    if (gateway?.listening) gateway.close(() => done());
    else done();
  });
  await new Promise(done => {
    if (monitor?.listening) monitor.close(() => done());
    else done();
  });
  await store?.close();
  await admin?.query(`DROP DATABASE IF EXISTS \`${database}\``);
  await admin?.end();
  await rm(directory, { recursive: true, force: true });
}

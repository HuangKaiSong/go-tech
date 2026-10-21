// oxlint-disable no-await-in-loop -- Test fixture setup and readiness probes must run in order.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { cp, mkdtemp, rm } from 'node:fs/promises';
import { type Server, createServer } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { SignJWT } from 'jose';
import { definitions } from '../lib/runtime-config/definitions';
interface CheckOptions {
  databaseVersion: number;
  secret: string;
  sourceUrl: string;
}
async function listen(server: Server) {
  await new Promise<void>(resolve => {
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing address');
  return `http://127.0.0.1:${address.port}`;
}
export async function checkStandalone({ databaseVersion, secret, sourceUrl }: CheckOptions) {
  const upstream = createServer(async (request, response) => {
    let body = '';
    for await (const chunk of request) body += String(chunk);
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({ code: 200, path: request.url, method: request.method, body }));
  });
  const placeholder = createServer();
  const origin = await listen(placeholder);
  const port = new URL(origin).port;
  await new Promise<void>(resolve => {
    placeholder.close(() => resolve());
  });
  const upstreamOrigin = await listen(upstream);
  // Test outside the repository so missing traced dependencies cannot resolve from workspace node_modules.
  const isolated = await mkdtemp(path.join(os.tmpdir(), 'h5-standalone-check-'));
  const standalone = path.join(isolated, 'standalone');
  await cp(path.resolve(process.cwd(), '.next/standalone'), standalone, { recursive: true });
  const root = path.join(standalone, 'apps/web-h5');
  await Promise.all(
    ['.env', '.env.local', '.env.production', '.env.production.local'].map(name =>
      rm(path.join(root, name), { force: true })
    )
  );
  const configEnvironment = Object.fromEntries(Object.keys(definitions).map(key => [key, '']));
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    ...configEnvironment,
    NODE_ENV: 'production',
    PORT: port,
    HOSTNAME: '127.0.0.1',
    DATABASE_URL: sourceUrl,
    REDIS_URL: process.env.REDIS_URL,
    SESSION_SECRET: 'standalone-session-'.repeat(4),
    PLATFORM_JWT_SECRET: secret,
    GO_TECH_LANGUAGE: 'zh-hk',
    GO_TECH_TIMEZONE: 'Asia/Hong_Kong',
    NEXT_PUBLIC_SITE_URL: origin,
    TRANSLATION_PROVIDER: 'deepl'
  };
  const child = spawn(process.execPath, ['server.js'], { cwd: root, env, stdio: 'ignore' });
  let exit = false;
  child.on('exit', () => {
    exit = true;
  });
  const controller = new AbortController();
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (exit) throw new Error('Standalone server exited before startup');
      try {
        const response = await fetch(`${origin}/api/runtime-config`);
        if (response.ok) {
          ready = true;
          break;
        }
      } catch {
        /* Waiting for local startup. */
      }
      await new Promise(resolve => {
        setTimeout(resolve, 100);
      });
    }
    assert.equal(ready, true, 'standalone config endpoint became ready');
    const token = await new SignJWT({ userId: 1, username: 'runtime-test' })
      .setProtectedHeader({ alg: 'HS512' })
      .setExpirationTime('5m')
      .sign(new TextEncoder().encode(secret));
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const route = (store: string) => `${origin}/api/admin/runtime-config/${store}`;
    const denied = await fetch(route('infrastructure'));
    assert.equal(denied.status, 401);
    const initial = await fetch(`${origin}/api/runtime-config`).then(response => response.json());
    assert.equal(initial.data.values.NEXT_PUBLIC_PMS_TRIAL_HOST, 'https://target.example');
    assert.equal('DATABASE_URL' in initial.data.values, false);
    const stream = await fetch(`${origin}/api/runtime-config/events`, { signal: controller.signal });
    assert.equal(stream.headers.get('content-type')?.startsWith('text/event-stream'), true);
    const reader = stream.body?.getReader();
    assert.ok(reader);
    const first = await reader.read();
    assert.equal(new TextDecoder().decode(first.value).includes(initial.data.version), true);
    const managed = await fetch(route('business'), { headers }).then(response => response.json());
    const saved = await fetch(route('business'), {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        version: managed.data.version,
        contextVersion: managed.data.contextVersion,
        changes: { NEXT_PUBLIC_KPAY_ENABLE: 'true', NEXT_PUBLIC_API_URL: upstreamOrigin }
      })
    });
    assert.equal(saved.status, 200);
    const event = await Promise.race([
      reader.read(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('SSE did not broadcast')), 5000).unref();
      })
    ]);
    assert.equal(new TextDecoder().decode(event.value).includes('NEXT_PUBLIC_KPAY_ENABLE'), true);
    const proxied = await fetch(`${origin}/pms-resource/runtime-check.jpg?q=1`, {
      method: 'POST',
      body: 'unchanged-body'
    }).then(response => response.json());
    assert.deepEqual(proxied, {
      code: 200,
      path: '/pms-resource/runtime-check.jpg?q=1',
      method: 'POST',
      body: 'unchanged-body'
    });
    const preview = await fetch(route('infrastructure'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ changes: { DATABASE_URL: sourceUrl } })
    }).then(response => response.json());
    assert.equal(preview.code, 200, preview.message);
    const switched = await fetch(route('infrastructure'), {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        version: databaseVersion,
        changes: { DATABASE_URL: sourceUrl },
        confirmation: preview.data.confirmation
      })
    });
    assert.equal(switched.status, 200);
    const next = await fetch(`${origin}/api/runtime-config`).then(response => response.json());
    assert.equal(next.data.values.NEXT_PUBLIC_PMS_TRIAL_HOST, 'https://source.example');
    const rotatedSecret = 'rotated-platform-secret-'.repeat(4);
    const rotation = await fetch(route('infrastructure'), {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        version: databaseVersion + 1,
        changes: { PLATFORM_JWT_SECRET: rotatedSecret, SESSION_SECRET: 'rotated-session-secret-'.repeat(4) }
      })
    });
    assert.equal(rotation.status, 200);
    assert.equal((await fetch(route('infrastructure'), { headers })).status, 401);
    const rotatedToken = await new SignJWT({ userId: 1, username: 'runtime-test' })
      .setProtectedHeader({ alg: 'HS512' })
      .setExpirationTime('5m')
      .sign(new TextEncoder().encode(rotatedSecret));
    assert.equal(
      (await fetch(route('infrastructure'), { headers: { Authorization: `Bearer ${rotatedToken}` } })).status,
      200
    );

    controller.abort();
    await reader.cancel().catch(() => {});
    const cli = spawn(process.execPath, ['scripts/runtime-config.mjs', 'inspect'], { cwd: root, env });
    let output = '';
    let cliError = '';
    cli.stdout.on('data', chunk => {
      output += String(chunk);
    });
    cli.stderr.on('data', chunk => {
      cliError += String(chunk);
    });
    const cliExit = await new Promise<number | null>(resolve => {
      cli.on('exit', resolve);
    });
    assert.equal(cliExit, 0, cliError);
    assert.equal(JSON.parse(output).fields.length, 4);
    console.log(
      'PASS: standalone auth, masked public snapshot, SSE updates, dynamic proxy method/body/query/dotted path, database switch, immediate JWT rotation and bundled recovery CLI.'
    );
  } finally {
    controller.abort();
    if (!exit) {
      const stopped = new Promise(resolve => {
        child.once('exit', resolve);
      });
      child.kill('SIGTERM');
      const timeout = setTimeout(() => child.kill('SIGKILL'), 5000);
      await stopped;
      clearTimeout(timeout);
    }
    await new Promise<void>(resolve => {
      upstream.close(() => resolve());
    });
    await rm(isolated, { recursive: true, force: true });
  }
}

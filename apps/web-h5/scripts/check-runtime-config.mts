// oxlint-disable no-await-in-loop -- Test fixture setup and readiness probes must run in order.
/** Explicit opt-in integration check against a disposable local MySQL server. Never uses DATABASE_URL. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { getTableName } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/mysql-core';
import mysql from 'mysql2/promise';
import { currentDatabase, databaseTables, getDatabaseState, getDb, withRuntimeScope } from '../db';
import { runtimeConfig } from '../db/scheam/managed/runtime_config';
import {
  getRuntimeConfig,
  managedSnapshot,
  previewInfrastructure,
  publicSnapshot,
  saveConfiguration
} from '../lib/runtime-config/service';
import { closeInfrastructure, readInfrastructure, writeInfrastructure } from '../lib/runtime-config/sqlite';
const noop = () => {};
const endpoint = process.env.RUNTIME_CONFIG_TEST_MYSQL_URL;
if (!endpoint || !['127.0.0.1', 'localhost'].includes(new URL(endpoint).hostname))
  throw new Error('Set RUNTIME_CONFIG_TEST_MYSQL_URL to an explicit disposable local MySQL URL');
const names = ['source', 'target', 'invalid'].map(
  suffix => `h5_config_test_${randomUUID().replaceAll('-', '')}_${suffix}`
);
const directory = await mkdtemp(path.join(os.tmpdir(), 'h5-config-integration-'));
process.env.H5_RUNTIME_CONFIG_SQLITE_PATH = path.join(directory, 'config.sqlite');
process.env.RUNTIME_CONFIG_ENCRYPTION_KEY = 'ab'.repeat(32);
process.env.SESSION_SECRET = 'unit-session-'.repeat(4);
process.env.PLATFORM_JWT_SECRET = 'unit-platform-'.repeat(4);
process.env.REDIS_URL = 'redis://127.0.0.1:33379';
const admin = await mysql.createConnection(endpoint);
const urlFor = (name: string) => {
  const url = new URL(endpoint);
  url.pathname = `/${name}`;
  return url.toString();
};
try {
  for (const name of names) await admin.query(`CREATE DATABASE ${mysql.escapeId(name)}`);
  for (const name of names.slice(0, 2)) {
    await admin.changeUser({ database: name });
    const seen = new Set<string>();
    for (const table of databaseTables()) {
      const tableName = getTableName(table);
      // oxlint-disable-next-line no-continue -- Only create each non-config table once.
      if (seen.has(tableName) || tableName.startsWith('h5_runtime_config')) continue;
      seen.add(tableName);
      const config = getTableConfig(table);
      await admin.query(
        `CREATE TABLE ${mysql.escapeId(tableName)} (${config.columns.map(column => `${mysql.escapeId(column.name)} ${column.getSQLType()} NULL`).join(',')})`
      );
    }
    for (const statement of (
      await readFile(new URL('../drizzle/0006_runtime_config.sql', import.meta.url), 'utf8')
    ).split('--> statement-breakpoint'))
      if (statement.trim()) await admin.query(statement);
    await admin.query("INSERT INTO platform_admin(id,username,status) VALUES (1,'runtime-test',1)");
    await admin.query('UPDATE h5_runtime_config SET payload=? WHERE id=1', [
      JSON.stringify({
        NEXT_PUBLIC_PMS_TRIAL_HOST: name === names[0] ? 'https://source.example' : 'https://target.example'
      })
    ]);
  }
  process.env.DATABASE_URL = urlFor(names[0] ?? '');
  writeInfrastructure(
    0,
    { DATABASE_URL: process.env.DATABASE_URL },
    { actor: 'integration', fields: ['DATABASE_URL'] }
  );
  const source = await withRuntimeScope(getRuntimeConfig)();
  assert.equal(source.values.NEXT_PUBLIC_PMS_TRIAL_HOST, 'https://source.example');
  const managed = await withRuntimeScope(() => managedSnapshot('business'))();
  await withRuntimeScope(() =>
    saveConfiguration(
      'business',
      {
        version: managed.version,
        contextVersion: managed.contextVersion,
        changes: { NEXT_PUBLIC_KPAY_ENABLE: 'true', DEEPL_API_KEY: 'test-secret' }
      },
      { actor: 'integration' }
    )
  )();
  assert.equal((await withRuntimeScope(getRuntimeConfig)()).values.NEXT_PUBLIC_KPAY_ENABLE, 'true');
  assert.equal('DEEPL_API_KEY' in (await withRuntimeScope(publicSnapshot)()).values, false);
  await assert.rejects(
    withRuntimeScope(() =>
      saveConfiguration(
        'business',
        {
          version: managed.version,
          contextVersion: managed.contextVersion,
          changes: { NEXT_PUBLIC_KPAY_ENABLE: 'false' }
        },
        { actor: 'integration' }
      )
    )(),
    /已被修改/
  );
  const before = readInfrastructure().version;
  await assert.rejects(
    withRuntimeScope(() => previewInfrastructure({ DATABASE_URL: urlFor(names[2] ?? '') }, 1))(),
    /表结构|初始化/
  );
  assert.equal(readInfrastructure().version, before);
  const targetUrl = urlFor(names[1] ?? '');
  const preview = await withRuntimeScope(() => previewInfrastructure({ DATABASE_URL: targetUrl }, 1))();
  assert.equal(preview.changes.find(change => change.key === 'DEEPL_API_KEY')?.sourceValue, undefined);
  assert.equal(
    preview.changes.some(change => change.key === 'NEXT_PUBLIC_PMS_TRIAL_HOST' && change.changed),
    true
  );
  let releaseLateRequest = noop;
  const lateGate = new Promise<void>(resolve => {
    releaseLateRequest = resolve;
  });
  const lateRequest = withRuntimeScope(async () => {
    await lateGate;
    const historical = await getDb();
    assert.equal((await historical.select().from(runtimeConfig))[0]?.version, 1);
    assert.equal(currentDatabase().retired, false);
    assert.equal((await getDatabaseState()).retired, true);
  })();
  await withRuntimeScope(async () => {
    const pinned = await getDb();
    const old = await getDatabaseState();
    await withRuntimeScope(() =>
      saveConfiguration(
        'infrastructure',
        { version: before, changes: { DATABASE_URL: targetUrl }, confirmation: preview.confirmation },
        { actor: 'integration', adminId: 1 }
      )
    )();
    assert.equal(await getDb(), pinned);
    assert.equal(old.retired, true);
    assert.equal((await pinned.select().from(runtimeConfig))[0]?.version, 1);
  })();
  releaseLateRequest();
  await lateRequest;
  assert.equal(
    (await withRuntimeScope(getRuntimeConfig)()).values.NEXT_PUBLIC_PMS_TRIAL_HOST,
    'https://target.example'
  );
  const secretManaged = await withRuntimeScope(() => managedSnapshot('infrastructure'))();
  assert.equal(
    secretManaged.fields.every(field => field.value === undefined),
    true
  );
  console.log(
    'PASS: MySQL config persistence, encrypted secrets, stale version rejection, invalid target rejection, switch preview, request pinning, target config adoption and secret redaction.'
  );
  if (process.argv.includes('--standalone')) {
    const { checkStandalone } = await import('./runtime-config-standalone-check');
    await checkStandalone({
      sourceUrl: process.env.DATABASE_URL,
      secret: process.env.PLATFORM_JWT_SECRET,
      databaseVersion: readInfrastructure().version
    });
  }
} finally {
  try {
    await currentDatabase().pool.end();
  } catch {
    /* Not connected yet. */
  }
  closeInfrastructure();
  await admin.changeUser({ database: 'mysql' });
  for (const name of names) await admin.query(`DROP DATABASE IF EXISTS ${mysql.escapeId(name)}`);
  await admin.end();
  await rm(directory, { recursive: true, force: true });
}

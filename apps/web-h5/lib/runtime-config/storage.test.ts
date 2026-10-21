import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { after, before, test } from 'node:test';
import { decodeValues, encodeValues } from './crypto';
import { ConfigError, effectiveValues, parseChanges, publicValues, validatePairs } from './definitions';
import { backupInfrastructure, closeInfrastructure, readInfrastructure, writeInfrastructure } from './sqlite';
let directory: string;
const originalPath = process.env.H5_RUNTIME_CONFIG_SQLITE_PATH;
const originalKey = process.env.RUNTIME_CONFIG_ENCRYPTION_KEY;
before(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), 'h5-runtime-config-'));
  process.env.H5_RUNTIME_CONFIG_SQLITE_PATH = path.join(directory, 'config.sqlite');
  process.env.RUNTIME_CONFIG_ENCRYPTION_KEY = 'ab'.repeat(32);
});
after(async () => {
  closeInfrastructure();
  if (originalPath === undefined) delete process.env.H5_RUNTIME_CONFIG_SQLITE_PATH;
  else process.env.H5_RUNTIME_CONFIG_SQLITE_PATH = originalPath;
  if (originalKey === undefined) delete process.env.RUNTIME_CONFIG_ENCRYPTION_KEY;
  else process.env.RUNTIME_CONFIG_ENCRYPTION_KEY = originalKey;
  await rm(directory, { recursive: true, force: true });
});
test('overrides distinguish false and cleared values from missing values; public projection never exposes secrets', () => {
  const values = effectiveValues(
    { NEXT_PUBLIC_KPAY_ENABLE: 'false', DEEPL_API_KEY: '', NEXT_PUBLIC_PMS_TRIAL_HOST: '' },
    { NEXT_PUBLIC_KPAY_ENABLE: 'true', DEEPL_API_KEY: 'env-secret', NEXT_PUBLIC_PMS_TRIAL_HOST: 'https://env.example' }
  );
  assert.equal(values.NEXT_PUBLIC_KPAY_ENABLE, 'false');
  assert.equal(values.DEEPL_API_KEY, '');
  assert.equal(values.NEXT_PUBLIC_PMS_TRIAL_HOST, '');
  assert.equal(values.GO_TECH_LANGUAGE, 'zh-hk');
  assert.equal('DEEPL_API_KEY' in publicValues(values), false);
  assert.equal(
    'DATABASE_URL' in publicValues({ DATABASE_URL: 'mysql://secret', NEXT_PUBLIC_BETTERSTACK_SOURCE_TOKEN: 'secret' }),
    false
  );
  assert.deepEqual(publicValues({ NEXT_PUBLIC_BETTERSTACK_SOURCE_TOKEN: 'secret' }), {});
});
test('validation rejects unknown keys, cross-store writes, invalid URLs, booleans, languages and incomplete pairs', () => {
  for (const changes of [
    { INVALID: 'x' },
    { DATABASE_URL: 'mysql://host' },
    { NEXT_PUBLIC_KPAY_ENABLE: '1' },
    { NEXT_PUBLIC_API_URL: 'file:///etc/passwd' },
    { NEXT_PUBLIC_API_URL: 'https://user:password@example.com' },
    { GO_TECH_LANGUAGE: 'xx' },
    { GO_TECH_TIMEZONE: 'invalid-zone' }
  ]) {
    assert.throws(() => parseChanges(changes, 'business'), ConfigError);
  }
  assert.throws(() => parseChanges({ SESSION_SECRET: 'short' }, 'infrastructure'), ConfigError);
  assert.throws(
    () => validatePairs({ NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'site' }, { NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'site' }),
    ConfigError
  );
});
test('authenticated encryption uses random IVs, binds ciphertext to the field and rejects corruption/wrong keys', () => {
  const first = encodeValues({ SESSION_SECRET: 'private-session', DEEPL_API_KEY: 'private-api-key' });
  assert.equal(first.includes('private-'), false);
  assert.notEqual(first, encodeValues({ SESSION_SECRET: 'private-session', DEEPL_API_KEY: 'private-api-key' }));
  assert.equal(decodeValues(first).SESSION_SECRET, 'private-session');
  const swapped = JSON.parse(first);
  swapped.DEEPL_API_KEY = swapped.SESSION_SECRET;
  assert.throws(() => decodeValues(JSON.stringify(swapped)), ConfigError);
  process.env.RUNTIME_CONFIG_ENCRYPTION_KEY = 'cd'.repeat(32);
  assert.throws(() => decodeValues(first), ConfigError);
  process.env.RUNTIME_CONFIG_ENCRYPTION_KEY = 'ab'.repeat(32);
});
test('SQLite transactions persist across reopen, reject stale updates and retain audit metadata without secret values', async () => {
  assert.deepEqual(readInfrastructure(), { version: 0, overrides: {} });
  const secret = 'test-secret-for-sqlite-persistence';
  writeInfrastructure(0, { SESSION_SECRET: secret }, { actor: 'test-admin', fields: ['SESSION_SECRET'] });
  assert.throws(
    () => writeInfrastructure(0, { SESSION_SECRET: 'stale' }, { actor: 'test-admin', fields: ['SESSION_SECRET'] }),
    ConfigError
  );
  closeInfrastructure();
  assert.equal(readInfrastructure().overrides.SESSION_SECRET, secret);
  assert.equal(readInfrastructure().version, 1);
  const disk = await readFile(process.env.H5_RUNTIME_CONFIG_SQLITE_PATH ?? '');
  assert.equal(disk.includes(Buffer.from(secret)), false);
  const backupPath = path.join(directory, 'backup.sqlite');
  await backupInfrastructure(backupPath);
  const backup = new DatabaseSync(backupPath, { readOnly: true });
  assert.equal(backup.prepare('SELECT version FROM infrastructure_config').get()?.version, 1);
  const audit = backup.prepare('SELECT actor,fields FROM infrastructure_audit').get();
  assert.equal(audit?.actor, 'test-admin');
  assert.equal(audit?.fields, '["SESSION_SECRET"]');
  backup.close();
  await assert.rejects(backupInfrastructure(backupPath), ConfigError);
});

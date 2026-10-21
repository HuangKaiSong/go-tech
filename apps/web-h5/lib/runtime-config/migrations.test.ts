import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';

const directory = mkdtempSync(path.join(os.tmpdir(), 'h5-migration-check-'));
const root = path.resolve(__dirname, '../..');
after(() => rmSync(directory, { force: true, recursive: true }));
function run(databaseUrl: string, args: string[]) {
  return spawnSync(process.execPath, ['--import', 'tsx', 'migrate.ts', ...args], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_ENV: 'test',
      DATABASE_URL: databaseUrl,
      H5_RUNTIME_CONFIG_SQLITE_PATH: path.join(directory, 'absent.sqlite'),
      RUNTIME_CONFIG_ENCRYPTION_KEY: 'ab'.repeat(32)
    },
    timeout: 10000
  });
}

test('migration check loads the application mysql2 driver without connecting or creating SQLite', () => {
  const result = run('mysql://migration:private-password@127.0.0.1:1/disconnected', ['--check']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /MySQL 驱动已加载/);
  assert.match(result.stdout, /未连接或修改数据库/);
  assert.equal(existsSync(path.join(directory, 'absent.sqlite')), false);
  assert.equal((result.stdout + result.stderr).includes('private-password'), false);
});

test('migration check rejects invalid URLs without exposing credentials', () => {
  const result = run('postgres://migration:private-password@127.0.0.1/example', ['--check']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /包含数据库名的 MySQL URL/);
  assert.equal((result.stdout + result.stderr).includes('private-password'), false);
});

test('migration connection failures have nonzero status and a safe driver error code', () => {
  // Port 0 is not a MySQL listener. Connection failure happens before any SQL can execute.
  const result = run('mysql://migration:private-password@127.0.0.1:0/disconnected?connectTimeout=1000', []);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /迁移失败/);
  assert.match(result.stderr, /ECONNREFUSED/);
  assert.equal((result.stdout + result.stderr).includes('private-password'), false);
  assert.equal((result.stdout + result.stderr).includes('mysql://'), false);
});

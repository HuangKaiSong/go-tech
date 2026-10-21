import { chmodSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import * as sqlite from 'node:sqlite';
import { decodeValues, encodeValues } from './crypto';
import { ConfigError, type ConfigValues } from './definitions';
export interface StoredConfig {
  overrides: ConfigValues;
  version: number;
}
const globalState = globalThis as typeof globalThis & { runtimeConfigSqlite?: { db: DatabaseSync; path: string } };
export function sqlitePath() {
  const file =
    process.env.H5_RUNTIME_CONFIG_SQLITE_PATH || path.resolve(process.cwd(), 'data/runtime-config/config.sqlite');
  if (!path.isAbsolute(file)) throw new ConfigError('H5_RUNTIME_CONFIG_SQLITE_PATH 必须为绝对路径', 503);
  return file;
}
export function openSqlite(initialize = false) {
  const file = sqlitePath();
  if (globalState.runtimeConfigSqlite?.path === file) return globalState.runtimeConfigSqlite.db;
  if (!existsSync(file) && !initialize) return undefined;
  if (initialize) mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(file);
  chmodSync(file, 0o600);
  db.exec('PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;');
  if (initialize)
    db.exec(`CREATE TABLE IF NOT EXISTS infrastructure_config (id INTEGER PRIMARY KEY CHECK (id=1), version INTEGER NOT NULL, payload TEXT NOT NULL);
    INSERT OR IGNORE INTO infrastructure_config VALUES (1, 0, '{}');
    CREATE TABLE IF NOT EXISTS infrastructure_audit (id INTEGER PRIMARY KEY, version INTEGER NOT NULL, actor TEXT NOT NULL, fields TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);`);
  globalState.runtimeConfigSqlite = { path: file, db };
  return db;
}
export function readInfrastructure(): StoredConfig {
  const db = openSqlite();
  if (!db) return { version: 0, overrides: {} };
  const row = db.prepare('SELECT version, payload FROM infrastructure_config WHERE id=1').get();
  if (!row || typeof row.version !== 'number' || typeof row.payload !== 'string')
    throw new ConfigError('基础设施配置文件无效', 503);
  return { version: row.version, overrides: decodeValues(row.payload) };
}
export function writeInfrastructure(
  expectedVersion: number,
  overrides: ConfigValues,
  { actor, fields }: { actor: string; fields: string[] }
) {
  const payload = encodeValues(overrides);
  const db = openSqlite(true);
  if (!db) throw new ConfigError('无法打开基础设施配置文件', 503);
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = db
      .prepare('UPDATE infrastructure_config SET version=version+1,payload=? WHERE id=1 AND version=?')
      .run(payload, expectedVersion);
    if (result.changes !== 1) throw new ConfigError('配置已被修改，请重新加载', 409);
    db.prepare('INSERT INTO infrastructure_audit(version,actor,fields) VALUES (?,?,?)').run(
      expectedVersion + 1,
      actor,
      JSON.stringify(fields)
    );
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
export async function backupInfrastructure(destination: string) {
  const db = openSqlite();
  if (!db) throw new ConfigError('基础设施配置尚未初始化');
  if (existsSync(destination)) throw new ConfigError('备份文件已存在');
  if ('backup' in sqlite && typeof sqlite.backup === 'function') await sqlite.backup(db, destination);
  else db.prepare('VACUUM INTO ?').run(destination);
  chmodSync(destination, 0o600);
}

export function closeInfrastructure() {
  globalState.runtimeConfigSqlite?.db.close();
  globalState.runtimeConfigSqlite = undefined;
}

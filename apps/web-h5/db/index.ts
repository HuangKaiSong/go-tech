import { AsyncLocalStorage } from 'node:async_hooks';
import { is } from 'drizzle-orm';
import { MySqlTable } from 'drizzle-orm/mysql-core';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { after } from 'next/server';
import { cache } from 'react';
import { configDigest } from '../lib/runtime-config/crypto';
import { ConfigError, type ConfigValues, effectiveValues } from '../lib/runtime-config/definitions';
import { readInfrastructure } from '../lib/runtime-config/sqlite';
import * as schema from './scheam';
export function databaseTables() {
  const values: unknown[] = Object.values(schema);
  return values.filter((value): value is MySqlTable => is(value, MySqlTable));
}
export function createDatabase(url: string) {
  const pool = mysql.createPool({ uri: url, connectTimeout: 5000, connectionLimit: 10 });
  return {
    pool,
    db: drizzle(pool, { schema, mode: 'default' }),
    identity: configDigest('database-identity', url).slice(0, 16),
    users: 0,
    retired: false
  };
}
export type DatabaseState = ReturnType<typeof createDatabase>;
export interface RuntimeSnapshot {
  businessVersion: number;
  infrastructureVersion: number;
  overrides: ConfigValues;
  values: ConfigValues;
  version: string;
}
interface Scope {
  database?: DatabaseState;
  infrastructure: ReturnType<typeof readInfrastructure>;
  snapshot?: Promise<RuntimeSnapshot>;
}
export const runtimeScope = new AsyncLocalStorage<Scope>();
const state = globalThis as typeof globalThis & { h5RuntimeDatabase?: DatabaseState & { url: string } };
function release(database: DatabaseState) {
  database.users -= 1;
  if (database.retired && database.users === 0) database.pool.end().catch(() => {});
}
const renderInfrastructure = cache(readInfrastructure);
export function infrastructureSnapshot() {
  return runtimeScope.getStore()?.infrastructure ?? renderInfrastructure();
}
export function currentDatabase(infrastructure = readInfrastructure()) {
  const url = effectiveValues(infrastructure.overrides).DATABASE_URL;
  if (!url) throw new ConfigError('DATABASE_URL 尚未配置', 503);
  if (state.h5RuntimeDatabase?.url === url) return state.h5RuntimeDatabase;
  // A request that started before a switch may still need its previous database.
  // It must never replace or retire the current generation's global pool.
  const latest = readInfrastructure();
  if (infrastructure.version !== latest.version) return Object.assign(createDatabase(url), { url, retired: true });
  const old = state.h5RuntimeDatabase;
  const next = Object.assign(createDatabase(url), { url });
  state.h5RuntimeDatabase = next;
  if (old) {
    old.retired = true;
    if (!old.users) old.pool.end().catch(() => {});
  }
  return next;
}
const renderDatabase = cache(async () => {
  const database = currentDatabase(infrastructureSnapshot());
  database.users += 1;
  try {
    after(() => release(database));
  } catch {
    release(database);
  }
  return database;
});
export async function getDatabaseState() {
  const scope = runtimeScope.getStore();
  if (!scope) return renderDatabase();
  if (!scope.database) {
    scope.database = currentDatabase(scope.infrastructure);
    scope.database.users += 1;
  }
  return scope.database;
}
export async function getDb() {
  return (await getDatabaseState()).db;
}
export function withRuntimeScope<Args extends unknown[], Result>(handler: (...args: Args) => Promise<Result>) {
  return async (...args: Args): Promise<Result> =>
    runtimeScope.run({ infrastructure: readInfrastructure() }, async () => {
      try {
        return await handler(...args);
      } finally {
        const scope = runtimeScope.getStore();
        if (scope?.database) release(scope.database);
      }
    });
}

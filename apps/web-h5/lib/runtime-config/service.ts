import { eq } from 'drizzle-orm';
import { cache } from 'react';
import {
  type DatabaseState,
  type RuntimeSnapshot,
  createDatabase,
  currentDatabase,
  databaseTables,
  getDatabaseState,
  infrastructureSnapshot,
  runtimeScope
} from '../../db';
import { runtimeConfig, runtimeConfigAudit, umsAdmin } from '../../db/scheam';
import { configDigest, decodeValues, encodeValues } from './crypto';
import {
  ConfigError,
  type ConfigKey,
  type ConfigStore,
  type ConfigValues,
  definition,
  definitions,
  effectiveValues,
  parseChanges,
  publicValues,
  validatePairs
} from './definitions';
import { readInfrastructure, writeInfrastructure } from './sqlite';
export function infrastructureValue(key: 'DATABASE_URL' | 'PLATFORM_JWT_SECRET' | 'REDIS_URL' | 'SESSION_SECRET') {
  return effectiveValues(infrastructureSnapshot().overrides)[key] ?? '';
}
export async function readBusiness(database: DatabaseState) {
  const rows = await database.db.select().from(runtimeConfig).where(eq(runtimeConfig.id, 1));
  if (!rows[0]) throw new ConfigError('目标数据库未初始化运行时配置，请先迁移并初始化', 503);
  return { version: rows[0].version, overrides: decodeValues(rows[0].payload) };
}
const businessSnapshots = new Map<string, Awaited<ReturnType<typeof readBusiness>>>();
const readSnapshot = async (): Promise<RuntimeSnapshot> => {
  const infra = infrastructureSnapshot();
  const database = await getDatabaseState();
  let business: Awaited<ReturnType<typeof readBusiness>>;
  try {
    business = await readBusiness(database);
    businessSnapshots.delete(database.identity);
    businessSnapshots.set(database.identity, business);
    if (businessSnapshots.size > 4) {
      const oldest = businessSnapshots.keys().next().value;
      if (oldest) businessSnapshots.delete(oldest);
    }
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    const previous = businessSnapshots.get(database.identity);
    if (!previous) throw error;
    business = previous;
  }
  return {
    version: `${infra.version}:${database.identity}:${business.version}`,
    infrastructureVersion: infra.version,
    businessVersion: business.version,
    overrides: business.overrides,
    values: effectiveValues({ ...business.overrides, ...infra.overrides })
  };
};
const renderSnapshot = cache(readSnapshot);
export function getRuntimeConfig(): Promise<RuntimeSnapshot> {
  const scope = runtimeScope.getStore();
  if (!scope) return renderSnapshot();
  scope.snapshot ??= readSnapshot();
  return scope.snapshot;
}
export async function configValue(key: ConfigKey) {
  return (await getRuntimeConfig()).values[key] ?? '';
}
export async function publicSnapshot() {
  const snapshot = await getRuntimeConfig();
  return { version: snapshot.version, values: publicValues(snapshot.values) };
}
export async function managedSnapshot(store: ConfigStore) {
  const infra = infrastructureSnapshot();
  const snapshot = store === 'business' ? await getRuntimeConfig() : undefined;
  const overrides = snapshot?.overrides ?? infra.overrides;
  const values = effectiveValues(overrides);
  return {
    version: store === 'business' ? snapshot?.businessVersion : infra.version,
    contextVersion: `${infra.version}:${(await getDatabaseState()).identity}`,
    fields: Object.keys(definitions)
      .filter(key => definition(key as ConfigKey).store === store)
      .map(name => {
        const key = name as ConfigKey;
        const meta = definition(key);
        return {
          key,
          ...meta,
          value: meta.secret ? undefined : values[key],
          configured: Boolean(values[key]),
          source: configSource(key, overrides)
        };
      })
  };
}
export function applyChanges(values: ConfigValues, changes: Partial<Record<ConfigKey, string | null>>) {
  const next = { ...values };
  for (const [key, value] of Object.entries(changes)) {
    if (value === null) delete next[key as ConfigKey];
    else next[key as ConfigKey] = value;
  }
  return next;
}
async function validateRedis(url: string) {
  const { default: Redis } = await import('ioredis');
  const client = new Redis(url, {
    lazyConnect: true,
    connectTimeout: 5000,
    commandTimeout: 5000,
    retryStrategy: () => null,
    maxRetriesPerRequest: 0,
    enableOfflineQueue: false
  });
  client.on('error', () => {});
  try {
    await client.connect();
    await client.ping();
  } catch {
    throw new ConfigError('Redis 连接验证失败');
  } finally {
    client.disconnect();
  }
}
export async function previewInfrastructure(changes: unknown, adminId?: number) {
  const parsed = parseChanges(changes, 'infrastructure');
  const infra = readInfrastructure();
  const values = effectiveValues(applyChanges(infra.overrides, parsed));
  for (const key of ['DATABASE_URL', 'REDIS_URL', 'SESSION_SECRET', 'PLATFORM_JWT_SECRET'] as const)
    if (!values[key]) throw new ConfigError(`${key} 不允许为空`);
  const changedDatabase = values.DATABASE_URL !== infrastructureValue('DATABASE_URL');
  let preview: {
    changes: { changed: boolean; key: string; secret?: boolean; sourceValue?: string; targetValue?: string }[];
    targetVersion?: number;
  } = { changes: [] };
  if (changedDatabase) {
    const candidate = createDatabase(values.DATABASE_URL ?? '');
    try {
      await candidate.pool.query('SELECT 1');
      // External tables are not managed by Drizzle migrations. Check every declared business table.
      await Promise.all(databaseTables().map(table => candidate.db.select().from(table).limit(0)));
      const target = await readBusiness(candidate);
      if (adminId) {
        const old = await (await getDatabaseState()).db.query.umsAdmin.findFirst({ where: eq(umsAdmin.id, adminId) });
        const admin = await candidate.db.query.umsAdmin.findFirst({ where: eq(umsAdmin.id, adminId) });
        if (!old || !admin || admin.status !== 1 || old.username !== admin.username)
          throw new ConfigError('目标库缺少当前有效管理员');
      }
      const source = await readBusiness(await getDatabaseState());
      const targetValues = effectiveValues(target.overrides);
      const sourceValues = effectiveValues(source.overrides);
      preview = {
        targetVersion: target.version,
        changes: Object.keys(definitions)
          .filter(key => definition(key as ConfigKey).store === 'business')
          .map(key => {
            const secret = Boolean(definition(key as ConfigKey).secret);
            return {
              key,
              secret,
              changed: targetValues[key as ConfigKey] !== sourceValues[key as ConfigKey],
              sourceValue: secret ? undefined : sourceValues[key as ConfigKey],
              targetValue: secret ? undefined : targetValues[key as ConfigKey]
            };
          })
      };
    } catch (error) {
      if (error instanceof ConfigError) throw error;
      throw new ConfigError('目标 MySQL 连接、表结构或配置验证失败');
    } finally {
      await candidate.pool.end();
    }
  }
  if ('REDIS_URL' in parsed && values.REDIS_URL !== infrastructureValue('REDIS_URL'))
    await validateRedis(values.REDIS_URL ?? '');
  const digest = configDigest('switch-preview', JSON.stringify({ version: infra.version, parsed, preview }));
  return { ...preview, confirmation: digest };
}
async function saveConfigurationUnlocked(
  store: ConfigStore,
  body: unknown,
  { actor, adminId }: { actor: string; adminId?: number }
) {
  if (
    !body ||
    typeof body !== 'object' ||
    !('version' in body) ||
    !Number.isSafeInteger(body.version) ||
    !('changes' in body)
  )
    throw new ConfigError('提交格式无效');
  const version = body.version as number;
  const changes = parseChanges(body.changes, store);
  if (!Object.keys(changes).length) throw new ConfigError('没有配置变更');
  if (store === 'infrastructure') {
    const infra = readInfrastructure();
    if (infra.version !== version) throw new ConfigError('配置已被修改，请重新加载', 409);
    const preview = await previewInfrastructure(changes, adminId);
    if (
      'DATABASE_URL' in changes &&
      preview.targetVersion !== undefined &&
      (!('confirmation' in body) || body.confirmation !== preview.confirmation)
    )
      throw new ConfigError('请先预览目标库配置差异并确认', 409);
    writeInfrastructure(version, applyChanges(infra.overrides, changes), { actor, fields: Object.keys(changes) });
    currentDatabase();
  } else {
    const database = await getDatabaseState();
    const infra = readInfrastructure();
    const expectedContext = `${infra.version}:${database.identity}`;
    if (!('contextVersion' in body) || body.contextVersion !== expectedContext)
      throw new ConfigError('基础设施配置已变化，请重新加载', 409);
    await database.db.transaction(async tx => {
      const rows = await tx.select().from(runtimeConfig).where(eq(runtimeConfig.id, 1)).for('update');
      const row = rows[0];
      if (!row || row.version !== version) throw new ConfigError('配置已被修改，请重新加载', 409);
      const overrides = applyChanges(decodeValues(row.payload), changes);
      validatePairs(effectiveValues(overrides), changes);
      // SQLite changes are synchronous in this process: recheck immediately before SQL writes.
      if (readInfrastructure().version !== infra.version) throw new ConfigError('基础设施配置已变化，请重新加载', 409);
      await tx
        .update(runtimeConfig)
        .set({ version: version + 1, payload: encodeValues(overrides) })
        .where(eq(runtimeConfig.id, 1));
      await tx
        .insert(runtimeConfigAudit)
        .values({ version: version + 1, actor, fields: JSON.stringify(Object.keys(changes)) });
    });
  }
}

let mutation = Promise.resolve();
export function saveConfiguration(...args: Parameters<typeof saveConfigurationUnlocked>) {
  const result = mutation.then(() => saveConfigurationUnlocked(...args));
  mutation = result.catch(() => {});
  return result;
}

function configSource(key: ConfigKey, overrides: ConfigValues) {
  if (key in overrides) return 'database';
  return process.env[key] ? 'environment' : 'default';
}

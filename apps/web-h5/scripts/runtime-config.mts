import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nextRequire = createRequire(import.meta.url);
const { loadEnvConfig } = createRequire(nextRequire.resolve('next/package.json'))('@next/env') as {
  loadEnvConfig: (directory: string, development: boolean) => unknown;
};
loadEnvConfig(root, process.env.NODE_ENV !== 'production');
process.env.H5_RUNTIME_CONFIG_SQLITE_PATH ||= path.join(root, 'data/runtime-config/config.sqlite');
const { backupInfrastructure, readInfrastructure, writeInfrastructure } = await import('../lib/runtime-config/sqlite');
const { ConfigError, definition, definitions, effectiveValues, parseChanges } =
  await import('../lib/runtime-config/definitions');
const { currentDatabase, withRuntimeScope } = await import('../db');
const { applyChanges, previewInfrastructure, readBusiness, saveConfiguration } =
  await import('../lib/runtime-config/service');
const { encodeValues } = await import('../lib/runtime-config/crypto');
const { eq } = await import('drizzle-orm');
const { runtimeConfig, runtimeConfigAudit } = await import('../db/scheam/managed/runtime_config');
type Key = keyof typeof definitions;
const [command, argument, inputFile] = process.argv.slice(2);
try {
  await withRuntimeScope(async () => {
    if (command === 'init') {
      const infra = readInfrastructure();
      const changes = Object.fromEntries(
        Object.keys(definitions)
          .filter(
            key =>
              definition(key as Key).store === 'infrastructure' &&
              !(key in infra.overrides) &&
              Boolean(process.env[key])
          )
          .map(key => [key, process.env[key]])
      );
      const validated = parseChanges(changes, 'infrastructure');
      writeInfrastructure(infra.version, applyChanges(infra.overrides, validated), {
        actor: 'local:init',
        fields: Object.keys(validated)
      });
      const database = currentDatabase();
      const stored = await readBusiness(database);
      const businessChanges = Object.fromEntries(
        Object.keys(definitions)
          .filter(
            key =>
              definition(key as Key).store === 'business' && !(key in stored.overrides) && Boolean(process.env[key])
          )
          .map(key => [key, process.env[key]])
      );
      const parsed = parseChanges(businessChanges, 'business');
      if (Object.keys(parsed).length)
        await database.db.transaction(async tx => {
          const rows = await tx.select().from(runtimeConfig).where(eq(runtimeConfig.id, 1)).for('update');
          if (rows[0]?.version !== stored.version) throw new ConfigError('配置已变化，请重新初始化', 409);
          await tx
            .update(runtimeConfig)
            .set({ version: stored.version + 1, payload: encodeValues(applyChanges(stored.overrides, parsed)) })
            .where(eq(runtimeConfig.id, 1));
          await tx
            .insert(runtimeConfigAudit)
            .values({ version: stored.version + 1, actor: 'local:init', fields: JSON.stringify(Object.keys(parsed)) });
        });
      console.log('配置初始化完成（已保存的配置未被覆盖）。');
    } else if (command === 'inspect') {
      const stored = readInfrastructure();
      const values = effectiveValues(stored.overrides);
      console.log(
        JSON.stringify(
          {
            version: stored.version,
            fields: Object.keys(definitions)
              .filter(key => definition(key as Key).store === 'infrastructure')
              .map(key => ({
                key,
                configured: Boolean(values[key as Key]),
                source: key in stored.overrides ? 'sqlite' : 'environment'
              }))
          },
          null,
          2
        )
      );
    } else if (command === 'recover' && argument) {
      // Host filesystem access is the recovery authority. This intentionally does not depend on MySQL/JWT.
      const parsed = parseChanges(JSON.parse(await readFile(argument, 'utf8')), 'infrastructure');
      const stored = readInfrastructure();
      writeInfrastructure(stored.version, applyChanges(stored.overrides, parsed), {
        actor: 'local:recovery',
        fields: Object.keys(parsed)
      });
      console.log('基础设施配置已恢复；运行进程将在后续请求读取新配置。');
    } else if (command === 'backup' && argument) {
      await backupInfrastructure(argument);
      console.log('SQLite 备份完成，请同时安全保管部署加密密钥。');
    } else if (command === 'set' && (argument === 'infrastructure' || argument === 'business') && inputFile) {
      const changes: unknown = JSON.parse(await readFile(inputFile, 'utf8'));
      const stored = argument === 'infrastructure' ? readInfrastructure() : await readBusiness(currentDatabase());
      const infra = readInfrastructure();
      const db = currentDatabase();
      const preview = argument === 'infrastructure' ? await previewInfrastructure(changes) : undefined;
      await saveConfiguration(
        argument,
        {
          version: stored.version,
          contextVersion: `${infra.version}:${db.identity}`,
          changes,
          confirmation: preview?.confirmation
        },
        { actor: 'local:set' }
      );
      console.log('配置保存成功。');
    } else {
      throw new ConfigError(
        '用法: pnpm --filter web-h5 run config init | inspect | recover <JSON文件> | backup <目标文件> | set <infrastructure|business> <JSON文件>'
      );
    }
  })();
} catch (error) {
  console.error(
    error instanceof ConfigError
      ? error.message
      : '操作失败，请检查配置文件、部署密钥和数据库迁移；未输出底层错误以保护凭证。'
  );
  process.exitCode = 1;
} finally {
  // CLI owns its pools. No application request can be using this process.
  try {
    await currentDatabase().pool.end();
  } catch {
    /* No database is needed for recovery. */
  }
}

import { createRequire } from 'node:module';
import path from 'node:path';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';
import { ConfigError, effectiveValues } from './lib/runtime-config/definitions';
import { readInfrastructure } from './lib/runtime-config/sqlite';

async function run() {
  const root = process.cwd();
  const appRequire = createRequire(path.join(root, 'package.json'));
  const { loadEnvConfig } = createRequire(appRequire.resolve('next/package.json'))('@next/env') as {
    loadEnvConfig: (directory: string, development: boolean) => unknown;
  };
  loadEnvConfig(root, process.env.NODE_ENV !== 'production');
  process.env.H5_RUNTIME_CONFIG_SQLITE_PATH ||= path.join(root, 'data/runtime-config/config.sqlite');

  const databaseUrl = effectiveValues(readInfrastructure().overrides).DATABASE_URL;
  if (!databaseUrl) throw new ConfigError('DATABASE_URL 尚未配置');
  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new ConfigError('DATABASE_URL 格式无效');
  }
  if (url.protocol !== 'mysql:' || !url.hostname || url.pathname.length <= 1) {
    throw new ConfigError('DATABASE_URL 必须为包含数据库名的 MySQL URL');
  }

  const options = { migrationsFolder: path.join(root, 'drizzle') };
  const files = readMigrationFiles(options);
  if (process.argv.includes('--check')) {
    console.log(`迁移检查通过：MySQL 驱动已加载，配置有效，共 ${files.length} 个迁移文件；未连接或修改数据库。`);
    return;
  }

  // Import the application driver directly; drizzle-kit's isolated pnpm directory cannot always resolve it.
  const connection = await mysql.createConnection(databaseUrl);
  try {
    console.log('Starting migration...');
    await migrate(drizzle(connection, { mode: 'default' }), options);
    console.log('Migration completed successfully!');
  } finally {
    await connection.end();
  }
}

function errorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return;
  if ('code' in error && typeof error.code === 'string' && /^[A-Z0-9_]+$/.test(error.code)) return error.code;
  if ('cause' in error && error.cause !== error) return errorCode(error.cause);
}

run().catch((error: unknown) => {
  // Driver errors can contain connection credentials, SQL parameters or existing configuration payloads.
  const message = error instanceof ConfigError ? error.message : '迁移失败，请检查数据库连接、权限与迁移记录';
  const code = errorCode(error);
  console.error(code ? `${message} (${code})` : message);
  process.exitCode = 1;
});

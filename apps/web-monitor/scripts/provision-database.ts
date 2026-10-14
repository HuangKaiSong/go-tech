import { randomBytes } from 'node:crypto';
import { chmod, readFile, rename, writeFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import { type RowDataPacket, createConnection } from 'mysql2/promise';
import { ReportCodec } from '../src/storage/codec';
import { MysqlReportStore } from '../src/storage/mysql-report-store';

const sourceFile = process.env.MONITOR_PROVISION_SOURCE_ENV;
if (!sourceFile) throw new Error('MONITOR_PROVISION_SOURCE_ENV is required');
const source = parseEnv(await readFile(sourceFile, 'utf8'));
const sourceUrl = source.DATABASE_URL;
if (!sourceUrl) throw new Error('Source DATABASE_URL is missing');
const database = decodeURIComponent(new URL(sourceUrl).pathname.slice(1));
if (database !== 'go-tech') throw new Error('Provisioning requires the existing go-tech database');
let env = await readFile('.env', 'utf8');
const configured = parseEnv(env);
const tables = [
  'monitor_reports',
  'monitor_report_payloads',
  'monitor_replays',
  'monitor_import_runs',
  'monitor_import_items',
  'monitor_upload_chunks'
];
const journal = 'monitor_schema_migrations';
const admin = await createConnection(sourceUrl);
let stage = 'check-existing-tables';
try {
  const [existing] = await admin.query<RowDataPacket[]>(
    'SELECT table_name AS name FROM information_schema.tables WHERE table_schema=? AND table_name IN (?)',
    [database, [...tables, journal]]
  );
  const hasJournal = existing.some(row => row.name === journal);
  if (existing.length && !hasJournal) throw new Error('Untracked monitor tables already exist');
  if (existing.length && !configured.MONITOR_AUTH_ENCRYPTION_KEY)
    throw new Error('Existing monitor data requires its original encryption key');
  const key = configured.MONITOR_AUTH_ENCRYPTION_KEY || randomBytes(32).toString('hex');
  stage = 'schema-migration';
  // This journal is independent from web-h5's __drizzle_migrations in the same database.
  await migrate(drizzle(admin), { migrationsFolder: './drizzle', migrationsTable: journal });
  stage = 'verify-monitor-tables';
  const store = new MysqlReportStore({
    url: sourceUrl,
    retentionMs: Number(configured.MONITOR_RETENTION_DAYS ?? 7) * 86400000,
    maxReports: Number(configured.MONITOR_MAX_REPORTS ?? 10000),
    codec: new ReportCodec(configured.MONITOR_AUTH_KEY_VERSION || 'v1', {
      [configured.MONITOR_AUTH_KEY_VERSION || 'v1']: key
    })
  });
  try {
    await store.initialize();
  } finally {
    await store.close();
  }
  stage = 'write-configuration';
  const updates = {
    MONITOR_DATABASE_URL: sourceUrl,
    MONITOR_AUTH_ENCRYPTION_KEY: key,
    MONITOR_AUTH_KEY_VERSION: configured.MONITOR_AUTH_KEY_VERSION || 'v1'
  };
  for (const [name, value] of Object.entries(updates)) {
    const pattern = new RegExp(`^${name}=.*$`, 'm');
    const line = `${name}=${JSON.stringify(value)}`;
    env = pattern.test(env) ? env.replace(pattern, () => line) : `${env.trimEnd()}\n${line}\n`;
  }
  await writeFile('.env.provision.tmp', env, { mode: 0o600 });
  await chmod('.env.provision.tmp', 0o600);
  await rename('.env.provision.tmp', '.env');
  console.log(
    JSON.stringify({
      database,
      monitorTables: tables.length,
      migrationTable: journal,
      schemaMigrated: true,
      configurationWritten: true,
      storage: 'mysql'
    })
  );
} catch (error) {
  console.error(
    JSON.stringify({
      stage,
      code: typeof error === 'object' && error !== null && 'code' in error ? error.code : 'VALIDATION_FAILED'
    })
  );
  console.error('Monitor table provisioning failed; existing business tables were not modified.');
  process.exitCode = 1;
} finally {
  await admin.end();
}

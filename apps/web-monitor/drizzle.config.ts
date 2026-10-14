import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { defineConfig } from 'drizzle-kit';

if (existsSync('.env')) loadEnvFile('.env');

export default defineConfig({
  dialect: 'mysql',
  migrations: { table: 'monitor_schema_migrations' },
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.MONITOR_MIGRATION_DATABASE_URL ?? process.env.MONITOR_DATABASE_URL ?? '' }
});

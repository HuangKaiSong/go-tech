import { sql } from 'drizzle-orm';
import { bigint, datetime, int, mysqlTable, text, varchar } from 'drizzle-orm/mysql-core';
export const runtimeConfig = mysqlTable('h5_runtime_config', {
  id: int().primaryKey(),
  version: int().notNull().default(0),
  payload: text().notNull()
});
export const runtimeConfigAudit = mysqlTable('h5_runtime_config_audit', {
  id: bigint({ mode: 'number', unsigned: true }).primaryKey().autoincrement(),
  version: int().notNull(),
  actor: varchar({ length: 128 }).notNull(),
  fields: text().notNull(),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
});

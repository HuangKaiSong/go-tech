import { bigint, date, datetime, int, mysqlTable, primaryKey, varchar } from 'drizzle-orm/mysql-core';

/** 租户表 */
export const platformTenant = mysqlTable(
  'platform_tenant',
  {
    id: bigint({ mode: 'number' }).autoincrement().notNull(),
    tenantId: varchar('tenant_id', { length: 6 }).notNull(),
    tenantName: varchar('tenant_name', { length: 50 }).notNull(),
    bizCode: varchar('biz_code', { length: 10 }).notNull(),
    unitCount: int('unit_count').default(0).notNull(),
    status: int().notNull(),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    expireDate: date('expire_date', { mode: 'string' }).notNull(),
    relateOrder: varchar('relate_order', { length: 20 }),
    createTime: datetime('create_time', { mode: 'string' }).notNull()
  },
  table => [primaryKey({ columns: [table.id], name: 'platform_tenant_id' })]
);

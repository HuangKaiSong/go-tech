import { sql } from 'drizzle-orm';
import { bigint, datetime, int, mysqlTable, primaryKey, varchar } from 'drizzle-orm/mysql-core';

/** 平台客户 */
export const platformCustomer = mysqlTable(
  'platform_customer',
  {
    id: bigint({ mode: 'number' }).autoincrement().notNull(),
    custCode: varchar('cust_code', { length: 30 }).notNull(),
    custName: varchar('cust_name', { length: 50 }).notNull(),
    password: varchar({ length: 64 }).notNull(),
    phone: varchar({ length: 20 }).notNull(),
    email: varchar({ length: 50 }).notNull(),
    companyName: varchar('company_name', { length: 120 }),
    registerTime: datetime('register_time', { mode: 'string' })
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    vipLevel: int('vip_level').default(1).notNull(),
    status: int().notNull(),
    createUser: bigint('create_user', { mode: 'number' }),
    createTime: datetime('create_time', { mode: 'string' }).notNull(),
    isDeleted: int('is_deleted').notNull()
  },
  table => [primaryKey({ columns: [table.id], name: 'platform_customer_id' })]
);

export type PlatformCustomer = typeof platformCustomer.$inferSelect;
export type NewPlatformCustomer = typeof platformCustomer.$inferInsert;

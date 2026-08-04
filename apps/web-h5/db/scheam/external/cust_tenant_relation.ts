import { bigint, mysqlTable, varchar } from 'drizzle-orm/mysql-core';

/** 用户租户关联 */
export const custTenantRelation = mysqlTable('cust_tenant_relation', {
  custId: bigint('cust_id', { mode: 'number' }).notNull(),
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  tenantId: varchar('tenant_id', { length: 6 }).notNull()
});

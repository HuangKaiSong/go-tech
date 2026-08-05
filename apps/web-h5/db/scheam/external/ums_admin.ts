import { bigint, datetime, decimal, int, mysqlTable, primaryKey, text, tinyint, varchar } from 'drizzle-orm/mysql-core';

/** 后台用户 */
export const umsAdmin = mysqlTable(
  'ums_admin',
  {
    id: bigint({ mode: 'number' }).autoincrement().notNull(),
    username: varchar({ length: 64 }).notNull(),
    password: varchar({ length: 64 }),
    icon: varchar({ length: 500 }),
    email: varchar({ length: 80 }),
    nickName: varchar('nick_name', { length: 200 }),
    createTime: datetime('create_time', { mode: 'string' }),
    loginTime: datetime('login_time', { mode: 'string' }),
    status: int().default(1),
    platformType: tinyint('platform_type'),
    type: tinyint(),
    adminStatus: tinyint('admin_status').default(2),
    deptId: bigint('dept_id', { mode: 'number' }),
    position: varchar({ length: 255 }),
    workPhone: varchar('work_phone', { length: 100 }),
    personalPhone: varchar('personal_phone', { length: 100 }),
    companyName: varchar('company_name', { length: 255 }),
    companyPhone: varchar('company_phone', { length: 100 }),
    salary: decimal({ precision: 10, scale: 2 }),
    urgentLiaison: varchar('urgent_liaison', { length: 80 }),
    urgentLiaisonPhone: varchar('urgent_liaison_phone', { length: 100 }),
    bankName: varchar('bank_name', { length: 100 }),
    bankCode: varchar('bank_code', { length: 100 }),
    chequePayee: varchar('cheque_payee', { length: 150 }),
    sign: text(),
    tenantId: varchar('tenant_id', { length: 6 }).default('000000')
  },
  table => [primaryKey({ columns: [table.id], name: 'ums_admin_id' })]
);

export type UmsAdmin = typeof umsAdmin.$inferSelect;
export type NewUmsAdmin = typeof umsAdmin.$inferInsert;

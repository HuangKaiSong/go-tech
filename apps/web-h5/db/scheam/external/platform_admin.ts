import { bigint, datetime, int, mysqlTable, primaryKey, varchar } from 'drizzle-orm/mysql-core';

/** 后台用户 */
export const umsAdmin = mysqlTable(
  'platform_admin',
  {
    id: bigint({ mode: 'number' }).autoincrement().notNull(),
    username: varchar({ length: 64 }).notNull(),
    password: varchar({ length: 64 }),
    icon: varchar({ length: 500 }),
    email: varchar({ length: 80 }),
    nickName: varchar('nick_name', { length: 200 }),
    createTime: datetime('create_time', { mode: 'string' }),
    loginTime: datetime('login_time', { mode: 'string' }),
    status: int().default(1)
  },
  table => [primaryKey({ columns: [table.id], name: 'ums_admin_id' })]
);

export type UmsAdmin = typeof umsAdmin.$inferSelect;
export type NewUmsAdmin = typeof umsAdmin.$inferInsert;

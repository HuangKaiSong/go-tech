import { bigint, datetime, int, mysqlTable, primaryKey, varchar } from 'drizzle-orm/mysql-core';

/** 平台管理员 */
export const platformAdmin = mysqlTable(
  'platform_admin',
  {
    id: bigint({ mode: 'number' }).autoincrement().notNull(),
    username: varchar({ length: 64 }).notNull(),
    password: varchar({ length: 64 }).notNull(),
    nickName: varchar('nick_name', { length: 200 }),
    icon: varchar({ length: 500 }),
    email: varchar({ length: 80 }),
    phone: varchar({ length: 20 }),
    status: int().default(1),
    loginTime: datetime('login_time', { mode: 'string' }),
    createTime: datetime('create_time', { mode: 'string' })
  },
  table => [primaryKey({ columns: [table.id], name: 'platform_admin_id' })]
);

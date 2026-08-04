import { sql } from 'drizzle-orm';
import { bigint, datetime, int, longtext, mysqlTable, primaryKey, varchar } from 'drizzle-orm/mysql-core';

/** 留言 */
export const leaveMessage = mysqlTable(
  'leave_message',
  {
    id: bigint({ mode: 'number' }).autoincrement().notNull(),
    name: varchar({ length: 30 }).notNull(),
    email: varchar({ length: 50 }).notNull(),
    phone: varchar({ length: 64 }).notNull(),
    message: longtext().notNull(),
    isRead: int('is_read').default(0).notNull(),
    createTime: datetime('create_time', { mode: 'string' })
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updateTime: datetime('update_time', { mode: 'string' })
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull()
  },
  table => [primaryKey({ columns: [table.id], name: 'leave_message_id' })]
);

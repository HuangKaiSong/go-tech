import { sql } from 'drizzle-orm';
import { bigint, date, datetime, int, mysqlTable, primaryKey, varchar } from 'drizzle-orm/mysql-core';

/** 优惠活动 */
export const platformPromotion = mysqlTable(
  'platform_promotion',
  {
    id: bigint({ mode: 'number' }).autoincrement().notNull(),
    promotionNo: varchar('promotion_no', { length: 20 }).notNull(),
    promotionName: varchar('promotion_name', { length: 30 }).notNull(),
    promotionDesc: varchar('promotion_desc', { length: 200 }).notNull(),
    promotionType: int('promotion_type').notNull(),
    promotionCode: varchar('promotion_code', { length: 30 }),
    maxCount: int('max_count'),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    startTime: date('start_time', { mode: 'string' }).notNull(),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    endTime: date('end_time', { mode: 'string' }).notNull(),
    remark: varchar({ length: 255 }),
    status: int().default(0),
    createUser: bigint('create_user', { mode: 'number' }),
    createTime: datetime('create_time', { mode: 'string' })
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull()
  },
  table => [primaryKey({ columns: [table.id], name: 'platform_promotion_id' })]
);

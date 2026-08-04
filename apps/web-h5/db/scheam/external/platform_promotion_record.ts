import { bigint, datetime, decimal, int, mysqlTable, primaryKey, varchar } from 'drizzle-orm/mysql-core';

/** 优惠活动使用记录 */
export const platformPromotionRecord = mysqlTable(
  'platform_promotion_record',
  {
    id: int().autoincrement().notNull(),
    promotionId: bigint('promotion_id', { mode: 'number' }).notNull(),
    orderNo: varchar('order_no', { length: 30 }),
    custCode: varchar('cust_code', { length: 30 }).notNull(),
    discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).notNull(),
    useTime: datetime('use_time', { mode: 'string' }),
    status: int()
  },
  table => [primaryKey({ columns: [table.id], name: 'platform_promotion_record_id' })]
);

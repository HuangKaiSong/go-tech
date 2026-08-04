import { bigint, decimal, int, mysqlTable, primaryKey, varchar } from 'drizzle-orm/mysql-core';

/** 优惠活动明细项 */
export const platformPromotionItem = mysqlTable(
  'platform_promotion_item',
  {
    id: bigint({ mode: 'number' }).autoincrement().notNull(),
    promotionId: bigint('promotion_id', { mode: 'number' }).notNull(),
    ruleType: int('rule_type').notNull(),
    packageId: bigint('package_id', { mode: 'number' }).notNull(),
    packageName: varchar('package_name', { length: 20 }).notNull(),
    thresholdAmount: decimal('threshold_amount', { precision: 10, scale: 2 }),
    discountValue: decimal('discount_value', { precision: 10, scale: 2 })
  },
  table => [primaryKey({ columns: [table.id], name: 'platform_promotion_item_id' })]
);

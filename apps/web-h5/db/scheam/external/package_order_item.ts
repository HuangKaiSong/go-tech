import { bigint, decimal, int, mysqlTable, primaryKey, varchar } from 'drizzle-orm/mysql-core';

/** 套餐订单项 */
export const packageOrderItem = mysqlTable(
  'package_order_item',
  {
    id: bigint({ mode: 'number' }).autoincrement().notNull(),
    orderId: bigint('order_id', { mode: 'number' }).notNull(),
    packageId: bigint('package_id', { mode: 'number' }).notNull(),
    itemType: int('item_type').notNull(),
    itemCode: varchar('item_code', { length: 30 }),
    itemName: varchar('item_name', { length: 30 }).notNull(),
    price: decimal({ precision: 10, scale: 2 }).default('0.00').notNull(),
    count: int().default(0).notNull(),
    days: int(),
    amount: decimal({ precision: 10, scale: 2 }).notNull()
  },
  table => [primaryKey({ columns: [table.id], name: 'package_order_item_id' })]
);

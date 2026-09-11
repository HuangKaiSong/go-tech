import { bigint, datetime, decimal, int, json, mysqlTable, primaryKey, varchar } from 'drizzle-orm/mysql-core';

/** 套餐 */
export const platformPackageNew = mysqlTable(
  'package_item',
  {
    id: bigint({ mode: 'number' }).autoincrement().notNull(),
    bizCode: varchar('biz_code', { length: 10 }).notNull(),
    packageCode: varchar('package_code', { length: 20 }).notNull(),
    packageName: varchar('package_name', { length: 30 }).notNull(),
    itemName: varchar('item_name', { length: 30 }).notNull(),
    itemType: int('item_type').notNull(),
    detail: json().notNull(),
    price: decimal({ precision: 10, scale: 2 }).notNull(),
    priceA: decimal('price_a', { precision: 10, scale: 2 }).notNull(),
    priceB: decimal('price_b', { precision: 10, scale: 2 }).notNull(),
    priceC: decimal('price_c', { precision: 10, scale: 2 }).notNull(),
    status: int().notNull(),
    createUser: bigint('create_user', { mode: 'number' }),
    createTime: datetime('create_time', { mode: 'string' }).notNull()
  },
  table => [primaryKey({ columns: [table.id], name: 'package_item_id' })]
);

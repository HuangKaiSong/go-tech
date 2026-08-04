import { bigint, datetime, decimal, int, mysqlTable, primaryKey, varchar } from 'drizzle-orm/mysql-core';

/** 套餐 */
export const platformPackage = mysqlTable(
  'platform_package',
  {
    id: bigint({ mode: 'number' }).autoincrement().notNull(),
    packageName: varchar('package_name', { length: 20 }).notNull(),
    unitCount: int('unit_count').notNull(),
    price: decimal({ precision: 10, scale: 2 }).notNull(),
    priceA: decimal('price_a', { precision: 10, scale: 2 }).notNull(),
    priceB: decimal('price_b', { precision: 10, scale: 2 }).notNull(),
    priceC: decimal('price_c', { precision: 10, scale: 2 }).notNull(),
    addUnitPrice: decimal('add_unit_price', { precision: 10, scale: 2 }),
    rentSysPrice: decimal('rent_sys_price', { precision: 10, scale: 2 }),
    venueSysPrice: decimal('venue_sys_price', { precision: 10, scale: 2 }),
    accountingSysPrice: decimal('accounting_sys_price', { precision: 10, scale: 2 }),
    custServiceSysPrice: decimal('cust_service_sys_price', { precision: 10, scale: 2 }),
    status: int().notNull(),
    createUser: bigint('create_user', { mode: 'number' }),
    createTime: datetime('create_time', { mode: 'string' }).notNull()
  },
  table => [primaryKey({ columns: [table.id], name: 'platform_package_id' })]
);

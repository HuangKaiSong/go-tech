import { bigint, int, mysqlTable, primaryKey, varchar } from 'drizzle-orm/mysql-core';

/** 套餐内容明细 */
export const platformPackageItem = mysqlTable(
  'platform_package_item',
  {
    id: bigint({ mode: 'number' }).autoincrement().notNull(),
    packageId: bigint('package_id', { mode: 'number' }).notNull(),
    menuId: bigint('menu_id', { mode: 'number' }).notNull(),
    level: int(),
    menuTitle: varchar('menu_title', { length: 100 }).notNull()
  },
  table => [primaryKey({ columns: [table.id], name: 'platform_package_item_id' })]
);

import { bigint, date, datetime, decimal, int, mysqlTable, primaryKey, varchar } from 'drizzle-orm/mysql-core';

/** 套餐订单 */
export const packageOrder = mysqlTable(
  'package_order',
  {
    id: bigint({ mode: 'number' }).autoincrement().notNull(),
    orderNo: varchar('order_no', { length: 30 }).notNull(),
    custCode: varchar('cust_code', { length: 30 }).notNull(),
    orderType: int('order_type').default(0).notNull(),
    bizCode: varchar('biz_code', { length: 10 }).notNull(),
    originalOrder: varchar('original_order', { length: 30 }),
    orderAmount: decimal('order_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
    discountRate: decimal('discount_rate', { precision: 10, scale: 2 }).default('0.00').notNull(),
    discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
    residualAmount: decimal('residual_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
    finalAmount: decimal('final_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
    payType: int('pay_type'),
    payEvidence: varchar('pay_evidence', { length: 255 }),
    payTime: datetime('pay_time', { mode: 'string' }),
    orderStatus: int('order_status').notNull(),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    expireDate: date('expire_date', { mode: 'string' }),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    activateDate: date('activate_date', { mode: 'string' }),
    invoiceNo: varchar('invoice_no', { length: 20 }),
    invoiceHeader: varchar('invoice_header', { length: 60 }),
    businessRegNo: varchar('business_reg_no', { length: 60 }),
    tenantId: varchar('tenant_id', { length: 6 }),
    createUser: bigint('create_user', { mode: 'number' }).notNull(),
    createTime: datetime('create_time', { mode: 'string' }).notNull()
  },
  table => [primaryKey({ columns: [table.id], name: 'package_order_id' })]
);

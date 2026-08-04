import { bigint, datetime, decimal, int, json, mysqlTable, primaryKey, varchar } from 'drizzle-orm/mysql-core';

/** 支付记录 */
export const payRecord = mysqlTable(
  'pay_record',
  {
    id: bigint({ mode: 'number' }).autoincrement().notNull(),
    orderNo: varchar('order_no', { length: 30 }),
    payOrderNo: varchar('pay_order_no', { length: 32 }),
    payAmount: decimal('pay_amount', { precision: 10, scale: 2 }),
    requestUrl: varchar('request_url', { length: 255 }),
    requestData: json('request_data'),
    requestTime: datetime('request_time', { mode: 'string' }),
    notifyData: json('notify_data'),
    notifyTime: datetime('notify_time', { mode: 'string' }),
    status: int()
  },
  table => [primaryKey({ columns: [table.id], name: 'pay_record_id' })]
);

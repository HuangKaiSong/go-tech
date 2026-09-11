/** 订单路由只接受正整数 ID，不能把响应对象或错误文本拼入路径。 */
export function isOrderId(value: unknown): value is string | number {
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^[1-9]\d*$/.test(value))) return false;
  return Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

/** 新响应为 { orderId }；保留对旧版直接返回数字 ID 的兼容。 */
export function getCreatedOrderId(data: unknown): number {
  const value = typeof data === 'object' && data !== null && 'orderId' in data ? data.orderId : data;
  if (!isOrderId(value)) throw new Error('創建訂單響應缺少有效的訂單 ID');
  return Number(value);
}

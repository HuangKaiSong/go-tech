import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getCreatedOrderId, isOrderId } from './order-id';

test('从新订单响应读取 orderId，而不是序列化整个对象', () => {
  assert.equal(getCreatedOrderId({ orderId: 83, managedOrderNo: 'example' }), 83);
  assert.equal(getCreatedOrderId({ orderId: '83' }), 83);
  assert.equal(getCreatedOrderId(83), 83);
});

test('拒绝异常路由及缺失或非法订单 ID', () => {
  for (const value of ['[object Object]', '[object%20Object]', 'undefined', {}, null, 0, -1, 1.5, '', Number.NaN]) {
    assert.equal(isOrderId(value), false);
    assert.throws(() => getCreatedOrderId(value));
  }
  assert.throws(() => getCreatedOrderId({ orderId: {} }));
  assert.throws(() => getCreatedOrderId({ orderId: null }));
  assert.throws(() => getCreatedOrderId({ orderId: Number.MAX_SAFE_INTEGER + 1 }));
});

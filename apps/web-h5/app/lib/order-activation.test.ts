import assert from 'node:assert/strict';
import test from 'node:test';
import { OrderStatusEnum, OrderTypeEnum } from '../constants/order';
import { PayTypeEnum } from '../constants/payment';
import { shouldPollOrderActivation, shouldSyncTenantsForOrder } from './order-activation';

test('线上支付回跳后持续轮询待支付、待确认和待开通状态', () => {
  for (const orderStatus of [OrderStatusEnum.WAIT_PAY, OrderStatusEnum.PROCESSING, OrderStatusEnum.ACTIVATION]) {
    assert.equal(
      shouldPollOrderActivation({
        fromKpay: true,
        orderStatus,
        payType: PayTypeEnum.Online
      }),
      true
    );
  }
});

test('线上支付回跳后在订单进入终态时停止轮询', () => {
  for (const orderStatus of [OrderStatusEnum.COMPLETED, OrderStatusEnum.CANCELED, OrderStatusEnum.REJECT]) {
    assert.equal(
      shouldPollOrderActivation({
        fromKpay: true,
        orderStatus,
        payType: PayTypeEnum.Online
      }),
      false
    );
  }
});

test('非 KPay 回跳或非线上支付不启动开通状态轮询', () => {
  assert.equal(
    shouldPollOrderActivation({
      fromKpay: false,
      orderStatus: OrderStatusEnum.WAIT_PAY,
      payType: PayTypeEnum.Online
    }),
    false
  );
  assert.equal(
    shouldPollOrderActivation({
      fromKpay: true,
      orderStatus: OrderStatusEnum.WAIT_PAY,
      payType: PayTypeEnum.FPS
    }),
    false
  );
});

test('只有已完成的购买订单需要同步租户', () => {
  assert.equal(
    shouldSyncTenantsForOrder({
      orderStatus: OrderStatusEnum.COMPLETED,
      orderType: OrderTypeEnum.PURCHASE
    }),
    true
  );
  assert.equal(
    shouldSyncTenantsForOrder({
      orderStatus: OrderStatusEnum.ACTIVATION,
      orderType: OrderTypeEnum.PURCHASE
    }),
    false
  );
  assert.equal(
    shouldSyncTenantsForOrder({
      orderStatus: OrderStatusEnum.COMPLETED,
      orderType: OrderTypeEnum.RENEWAL
    }),
    false
  );
});

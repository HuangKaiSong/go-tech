import assert from 'node:assert/strict';
import test from 'node:test';
import { OrderStatusEnum, OrderTypeEnum } from '../constants/order';
import { PayTypeEnum } from '../constants/payment';
import {
  clearPendingTenantActivation,
  createVisibilityAwarePoller,
  getTenantActivationPollingConfig,
  readPendingTenantActivation,
  shouldPollOrderActivation,
  shouldSyncTenantsForOrder,
  stashPendingTenantActivation
} from './order-activation';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(promiseResolve => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

function createTestScheduler() {
  let nextId = 1;
  const jobs = new Map<number, { callback: () => void; delay: number }>();

  return {
    clear(handle: unknown) {
      jobs.delete(handle as number);
    },
    get jobs() {
      return [...jobs.values()];
    },
    runNext() {
      const next = jobs.entries().next().value;
      assert.ok(next);
      const [id, job] = next;
      jobs.delete(id);
      job.callback();
    },
    set(callback: () => void, delay: number) {
      const id = nextId;
      nextId += 1;
      jobs.set(id, { callback, delay });
      return id;
    }
  };
}

function createMemoryStorage() {
  const values = new Map<string, string>();

  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    }
  };
}

const flushPromises = () =>
  new Promise<void>(resolve => {
    setImmediate(resolve);
  });

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

test('线上购买会保存全局租户同步标记，清除标记后不再读取到任务', () => {
  const storage = createMemoryStorage();
  const pending = stashPendingTenantActivation(
    {
      orderId: 83,
      ownerId: 'user:7',
      payType: PayTypeEnum.Online
    },
    { now: () => 1_000, storage }
  );

  assert.deepEqual(pending, {
    expiresAt: 301_000,
    orderId: 83,
    ownerId: 'user:7',
    payType: PayTypeEnum.Online
  });
  assert.deepEqual(readPendingTenantActivation({ storage }), pending);
  assert.deepEqual(getTenantActivationPollingConfig(pending, 1_000), {
    intervalMs: 5_000,
    timeoutMs: 300_000
  });

  clearPendingTenantActivation({ storage });
  assert.equal(readPendingTenantActivation({ storage }), null);
});

test('FPS 购买使用低频长时同步，并拒绝损坏的租户同步标记', () => {
  const storage = createMemoryStorage();
  const pending = stashPendingTenantActivation(
    {
      orderId: 84,
      ownerId: 'user:8',
      payType: PayTypeEnum.FPS
    },
    { now: () => 2_000, storage }
  );

  assert.deepEqual(getTenantActivationPollingConfig(pending, 2_000), {
    intervalMs: 60_000,
    timeoutMs: 86_400_000
  });

  storage.setItem('GO_TECH_PENDING_TENANT_ACTIVATION', '{invalid');
  assert.equal(readPendingTenantActivation({ storage }), null);
});

test('轮询请求完成后才安排下一次请求，避免异步请求重叠', async () => {
  const scheduler = createTestScheduler();
  const firstPoll = createDeferred<boolean>();
  const pollSignals: AbortSignal[] = [];
  const poller = createVisibilityAwarePoller({
    intervalMs: 5_000,
    isVisible: () => true,
    poll(signal) {
      pollSignals.push(signal);
      return pollSignals.length === 1 ? firstPoll.promise : new Promise(() => {});
    },
    scheduler,
    timeoutMs: 300_000
  });

  poller.start();
  assert.equal(scheduler.jobs[0]?.delay, 5_000);
  scheduler.runNext();
  assert.equal(pollSignals.length, 1);
  assert.equal(scheduler.jobs.length, 0);

  firstPoll.resolve(true);
  await flushPromises();
  assert.equal(scheduler.jobs.length, 1);
  assert.equal(scheduler.jobs[0]?.delay, 5_000);

  scheduler.runNext();
  assert.equal(pollSignals.length, 2);
  poller.stop();
});

test('页面隐藏时中止在途请求，恢复后只立即轮询一次', async () => {
  const scheduler = createTestScheduler();
  const firstPoll = createDeferred<boolean>();
  const pollSignals: AbortSignal[] = [];
  let visible = true;
  const poller = createVisibilityAwarePoller({
    intervalMs: 5_000,
    isVisible: () => visible,
    poll(signal) {
      pollSignals.push(signal);
      return pollSignals.length === 1 ? firstPoll.promise : new Promise(() => {});
    },
    scheduler,
    timeoutMs: 300_000
  });

  poller.start();
  scheduler.runNext();
  visible = false;
  poller.handleVisibilityChange();
  assert.equal(pollSignals[0]?.aborted, true);

  visible = true;
  poller.handleVisibilityChange();
  assert.equal(pollSignals.length, 1);
  assert.equal(scheduler.jobs.length, 0);

  firstPoll.resolve(true);
  await flushPromises();
  assert.equal(scheduler.jobs.length, 1);
  assert.equal(scheduler.jobs[0]?.delay, 0);

  scheduler.runNext();
  assert.equal(pollSignals.length, 2);
  assert.equal(scheduler.jobs.length, 0);
  poller.stop();
});

test('页面休眠超过截止时间后恢复只执行一次最终同步', async () => {
  const scheduler = createTestScheduler();
  let now = 0;
  let polls = 0;
  let stopped = 0;
  let visible = false;
  const poller = createVisibilityAwarePoller({
    intervalMs: 5_000,
    isVisible: () => visible,
    now: () => now,
    onStop: () => {
      stopped += 1;
    },
    poll: async () => {
      polls += 1;
      return true;
    },
    scheduler,
    timeoutMs: 300_000
  });

  poller.start();
  now = 300_001;
  visible = true;
  poller.handleVisibilityChange();
  scheduler.runNext();
  await flushPromises();

  assert.equal(polls, 1);
  assert.equal(stopped, 1);
  assert.equal(scheduler.jobs.length, 0);
});

test('轮询返回终态后停止且不再安排请求', async () => {
  const scheduler = createTestScheduler();
  let stopped = 0;
  const poller = createVisibilityAwarePoller({
    intervalMs: 5_000,
    isVisible: () => true,
    onStop: () => {
      stopped += 1;
    },
    poll: async () => false,
    scheduler,
    timeoutMs: 300_000
  });

  poller.start();
  scheduler.runNext();
  await flushPromises();

  assert.equal(stopped, 1);
  assert.equal(scheduler.jobs.length, 0);
  poller.stop();
  assert.equal(stopped, 1);
});

test('可见页面的轮询错误会上报并在间隔后重试', async () => {
  const scheduler = createTestScheduler();
  const errors: unknown[] = [];
  const expectedError = new Error('network failed');
  const poller = createVisibilityAwarePoller({
    intervalMs: 5_000,
    isVisible: () => true,
    onError: error => errors.push(error),
    poll: async () => {
      throw expectedError;
    },
    scheduler,
    timeoutMs: 300_000
  });

  poller.start();
  scheduler.runNext();
  await flushPromises();

  assert.deepEqual(errors, [expectedError]);
  assert.equal(scheduler.jobs.length, 1);
  assert.equal(scheduler.jobs[0]?.delay, 5_000);
  poller.stop();
});

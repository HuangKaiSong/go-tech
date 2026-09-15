import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { type ClientHttpErrorEvent, subscribeClientHttpErrors } from '@/lib/client-http/error-events';
import { enterOrStartTrial, enterTenant, filterTenantsByBizCode, goNow, startFreeTrial } from './go-now';

const originalFetch = globalThis.fetch;
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const originalHrTrialHost = process.env.NEXT_PUBLIC_HR_TRIAL_HOST;
const originalPmsTrialHost = process.env.NEXT_PUBLIC_PMS_TRIAL_HOST;
const cleanups: Array<() => void> = [];

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(body), { ...init, headers });
}

function captureEvents() {
  const events: ClientHttpErrorEvent[] = [];
  cleanups.push(subscribeClientHttpErrors(event => events.push(event)));
  return events;
}

function installWindow(open: (url?: string | URL, target?: string) => unknown) {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { open },
    writable: true
  });
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  cleanups.splice(0).forEach(cleanup => cleanup());

  if (originalWindow) {
    Object.defineProperty(globalThis, 'window', originalWindow);
  } else {
    Reflect.deleteProperty(globalThis, 'window');
  }

  if (originalHrTrialHost === undefined) {
    delete process.env.NEXT_PUBLIC_HR_TRIAL_HOST;
  } else {
    process.env.NEXT_PUBLIC_HR_TRIAL_HOST = originalHrTrialHost;
  }

  if (originalPmsTrialHost === undefined) {
    delete process.env.NEXT_PUBLIC_PMS_TRIAL_HOST;
  } else {
    process.env.NEXT_PUBLIC_PMS_TRIAL_HOST = originalPmsTrialHost;
  }
});

test('filterTenantsByBizCode 只保留当前产品的租户并维持原有顺序', () => {
  const tenants: Tenant[] = [
    { bizCode: 'pms', tenantId: 'pms-1', tenantName: 'PMS 1' },
    { bizCode: 'hr', tenantId: 'hr-1', tenantName: 'HR 1' },
    { bizCode: 'pms', tenantId: 'pms-2', tenantName: 'PMS 2' },
    { bizCode: 'hr', tenantId: 'hr-2', tenantName: 'HR 2' }
  ];

  assert.deepEqual(
    filterTenantsByBizCode(tenants, 'hr').map(tenant => tenant.tenantId),
    ['hr-1', 'hr-2']
  );
  assert.deepEqual(
    filterTenantsByBizCode(tenants, 'pms').map(tenant => tenant.tenantId),
    ['pms-1', 'pms-2']
  );
});

test('filterTenantsByBizCode 没有对应产品租户时返回空数组', () => {
  const tenants: Tenant[] = [{ bizCode: 'pms', tenantId: 'pms-1', tenantName: 'PMS' }];

  assert.deepEqual(filterTenantsByBizCode(tenants, 'hr'), []);
});

test('goNow 使用最后一个租户请求进入码，并沿用租户自身的 PMS 业务类型', async () => {
  let callbackUri: string | undefined;

  globalThis.fetch = async (input, init) => {
    assert.equal(input, '/go-tech/platform/platformCustomer/gotoCode?tenantId=pms-tenant');
    assert.deepEqual(init?.headers, {
      'Content-Type': 'application/json',
      Authorization: 'Bearer access-token',
      'User-type': 'platform_customer'
    });
    return jsonResponse({ code: 200, data: 'tenant-code' });
  };

  await goNow({
    generateCallback: uri => {
      callbackUri = uri;
    },
    tenants: [
      { bizCode: 'hr', tenantId: 'hr-tenant', tenantName: 'HR' },
      { bizCode: 'pms', tenantId: 'pms-tenant', tenantName: 'PMS' }
    ],
    token: 'access-token'
  });

  assert.equal(callbackUri, 'tenantCallback?code=tenant-code');
});

test('goNow 的 HR 租户使用公共试用地址打开新窗口', async () => {
  let openedUrl: string | URL | undefined;

  process.env.NEXT_PUBLIC_HR_TRIAL_HOST = 'https://hr.example.com/trial?source=web';
  installWindow(url => {
    openedUrl = url;
  });
  globalThis.fetch = async () => jsonResponse({ code: 200, data: 'hr-code' });

  await goNow({
    tenants: [{ bizCode: 'hr', tenantId: 'hr-tenant', tenantName: 'HR' }],
    token: 'access-token'
  });

  assert.equal(String(openedUrl), 'https://hr.example.com/trial?source=web&code=hr-code');
});

test('goNow 在 HR 试用地址缺失时通知调用方', async () => {
  let missingHostCalls = 0;

  delete process.env.NEXT_PUBLIC_HR_TRIAL_HOST;
  globalThis.fetch = async () => jsonResponse({ code: 200, data: 'hr-code' });

  await goNow({
    onHrTrialHostMissing: () => {
      missingHostCalls += 1;
    },
    tenants: [{ bizCode: 'hr', tenantId: 'hr-tenant', tenantName: 'HR' }],
    token: 'access-token'
  });

  assert.equal(missingHostCalls, 1);
});

test('enterTenant 在 HR 试用地址缺失时通知调用方', async () => {
  let missingHostCalls = 0;

  delete process.env.NEXT_PUBLIC_HR_TRIAL_HOST;
  globalThis.fetch = async () => jsonResponse({ code: 200, data: 'hr-code' });

  await enterTenant({
    onHrTrialHostMissing: () => {
      missingHostCalls += 1;
    },
    tenant: { bizCode: 'hr', tenantId: 'hr-tenant', tenantName: 'HR' },
    token: 'access-token'
  });

  assert.equal(missingHostCalls, 1);
});

test('enterTenant 在 PMS 回调完成后再通知界面更新状态', async () => {
  const events: string[] = [];

  globalThis.fetch = async () => jsonResponse({ code: 200, data: 'tenant-code' });

  await enterTenant({
    generateCallback: () => {
      events.push('callback');
    },
    onPmsEntered: () => {
      events.push('entered');
    },
    tenant: { bizCode: 'pms', tenantId: 'pms-tenant', tenantName: 'PMS' },
    token: 'access-token'
  });

  assert.deepEqual(events, ['callback', 'entered']);
});

test('goNow 未提供 PMS 回调时沿用公共 PMS 试用地址', async () => {
  let openedUrl: string | URL | undefined;

  process.env.NEXT_PUBLIC_PMS_TRIAL_HOST = 'https://pms.example.com';
  installWindow(url => {
    openedUrl = url;
  });
  globalThis.fetch = async () => jsonResponse({ code: 200, data: 'tenant-code' });

  await goNow({
    tenants: [{ bizCode: 'pms', tenantId: 'pms-tenant', tenantName: 'PMS' }],
    token: 'access-token'
  });

  assert.equal(String(openedUrl), 'https://pms.example.com/oauth/tenantCallback?code=tenant-code');
});

test('startFreeTrial 未指定业务类型时保持既有 PMS 试用行为', async () => {
  let callbackUri: string | undefined;

  globalThis.fetch = async input => {
    assert.equal(input, '/go-tech/platform/platformCustomer/trialCode?bizCode=pms');
    return jsonResponse({ code: 200, data: 'trial-code' });
  };

  await startFreeTrial({
    generateCallback: uri => {
      callbackUri = uri;
    },
    token: 'access-token'
  });

  assert.equal(callbackUri, 'tryCallback?code=trial-code');
});

test('enterTenant 遇到非 200 业务码时发布业务说明且不进入系统', async () => {
  const events = captureEvents();
  let callbackCalls = 0;
  globalThis.fetch = async () => jsonResponse({ code: 40301, message: '该账户无权进入' });

  await enterTenant({
    generateCallback: () => {
      callbackCalls += 1;
    },
    tenant: { bizCode: 'pms', tenantId: 'pms-tenant', tenantName: 'PMS' },
    token: 'access-token'
  });

  assert.equal(callbackCalls, 0);
  assert.equal(events.length, 1);
  assert.equal(events[0].userMessage, '该账户无权进入');
});

test('startFreeTrial 遇到空 HTTP 错误响应时发布状态码', async () => {
  const events = captureEvents();
  globalThis.fetch = async () => new Response(null, { status: 503 });

  await startFreeTrial({ bizCode: 'pms', token: 'access-token' });

  assert.equal(events.length, 1);
  assert.equal(events[0].status, 503);
});

test('goNow 遇到网络失败时发布网络错误', async () => {
  const events = captureEvents();
  globalThis.fetch = async () => {
    throw new TypeError('Failed to fetch');
  };

  await goNow({
    tenants: [{ bizCode: 'pms', tenantId: 'pms-tenant', tenantName: 'PMS' }],
    token: 'access-token'
  });

  assert.equal(events.length, 1);
  assert.equal(events[0].kind, 'network');
});

test('startFreeTrial 在 HR 试用地址缺失时通知调用方', async () => {
  let missingHostCalls = 0;

  delete process.env.NEXT_PUBLIC_HR_TRIAL_HOST;
  globalThis.fetch = async () => jsonResponse({ code: 200, data: 'hr-code' });

  await startFreeTrial({
    bizCode: 'hr',
    onHrTrialHostMissing: () => {
      missingHostCalls += 1;
    },
    token: 'access-token'
  });

  assert.equal(missingHostCalls, 1);
});

test('enterOrStartTrial 有租户时进入最后一个租户', async () => {
  let callbackUri: string | undefined;

  globalThis.fetch = async () => jsonResponse({ code: 200, data: 'tenant-code' });

  await enterOrStartTrial({
    generateCallback: uri => {
      callbackUri = uri;
    },
    tenants: [{ bizCode: 'pms', tenantId: 'pms-tenant', tenantName: 'PMS' }],
    token: 'access-token'
  });

  assert.equal(callbackUri, 'tenantCallback?code=tenant-code');
});

test('enterOrStartTrial 没有租户时按指定业务类型开始试用', async () => {
  let openedUrl: string | URL | undefined;

  process.env.NEXT_PUBLIC_HR_TRIAL_HOST = 'https://hr.example.com/trial';
  installWindow(url => {
    openedUrl = url;
  });
  globalThis.fetch = async () => jsonResponse({ code: 200, data: 'trial-code' });

  await enterOrStartTrial({ bizCode: 'hr', tenants: [], token: 'access-token' });

  assert.equal(String(openedUrl), 'https://hr.example.com/trial?code=trial-code');
});

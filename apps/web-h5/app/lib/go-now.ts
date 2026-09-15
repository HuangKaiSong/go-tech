import type { PackageBizCode } from '@go-tech/types';

interface CallbackOptions {
  generateCallback?: (uri: string) => void;
  onHrTrialHostMissing?: () => void;
  token: string | undefined;
}

interface TrialCallbackOptions extends CallbackOptions {
  bizCode?: PackageBizCode;
}

interface GoNowOptions extends CallbackOptions {
  tenants: Tenant[];
}

interface EnterOrStartTrialOptions extends GoNowOptions {
  bizCode?: PackageBizCode;
}

interface EnterTenantOptions extends CallbackOptions {
  onPmsEntered?: () => void;
  tenant: Tenant;
}

interface OpenTrialEnvironmentOptions {
  bizCode: PackageBizCode;
  code: unknown;
  generateCallback?: (uri: string) => void;
  onHrTrialHostMissing?: () => void;
  onPmsEntered?: () => void;
  pmsCallbackPath: 'tenantCallback' | 'tryCallback';
}

/** Auth 缓存保留全量租户，产品切换时仅在消费端派生当前业务的租户列表。 */
export function filterTenantsByBizCode(tenants: Tenant[], bizCode: PackageBizCode) {
  return tenants.filter(tenant => tenant.bizCode === bizCode);
}

function completeCallback(uri: string, generateCallback?: (uri: string) => void) {
  if (generateCallback) {
    generateCallback(uri);
    return;
  }

  const trialHost = process.env.NEXT_PUBLIC_PMS_TRIAL_HOST;
  window.open(`${trialHost}/oauth/${uri}`, '_blank');
}

function requestPlatformCode(url: string, token: string | undefined) {
  return fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-type': 'platform_customer'
    }
  });
}

function openHrTrial(code: unknown, onHrTrialHostMissing?: () => void) {
  const hrTrialHost = process.env.NEXT_PUBLIC_HR_TRIAL_HOST;
  if (!hrTrialHost) {
    onHrTrialHostMissing?.();
    return;
  }

  const targetUrl = new URL(hrTrialHost);
  targetUrl.searchParams.set('code', String(code));
  window.open(targetUrl.toString(), '_blank');
}

function openTrialEnvironment({
  bizCode,
  code,
  generateCallback,
  onHrTrialHostMissing,
  onPmsEntered,
  pmsCallbackPath
}: OpenTrialEnvironmentOptions) {
  if (bizCode === 'pms') {
    completeCallback(`${pmsCallbackPath}?code=${code}`, generateCallback);
    onPmsEntered?.();
    return;
  }

  if (bizCode === 'hr') {
    openHrTrial(code, onHrTrialHostMissing);
  }
}

/** 统一租户进入流程；PMS/HR 的导航规则在此集中，toast 和弹窗状态等 UI 差异由可选回调保留。 */
export async function enterTenant({
  generateCallback,
  onHrTrialHostMissing,
  onPmsEntered,
  tenant,
  token
}: EnterTenantOptions) {
  const response = await requestPlatformCode(
    `/go-tech/platform/platformCustomer/gotoCode?tenantId=${tenant.tenantId}`,
    token
  ).then(res => res.json());

  if (response.code !== 200) return;

  openTrialEnvironment({
    bizCode: tenant.bizCode,
    code: response.data,
    generateCallback,
    onHrTrialHostMissing,
    onPmsEntered,
    pmsCallbackPath: 'tenantCallback'
  });
}

export async function goNow({ generateCallback, onHrTrialHostMissing, tenants, token }: GoNowOptions) {
  const tenant = tenants.at(-1);
  if (!tenant) return;

  return enterTenant({ generateCallback, onHrTrialHostMissing, tenant, token });
}

export async function startFreeTrial({
  bizCode = 'pms',
  generateCallback,
  onHrTrialHostMissing,
  token
}: TrialCallbackOptions) {
  // 未传业务类型的旧入口仍进入 PMS，显式传值的入口则按当前选择进入对应产品。
  const response = await requestPlatformCode(`/go-tech/platform/platformCustomer/trialCode?bizCode=${bizCode}`, token);

  if (response.ok) {
    const result = await response.json();
    if (result.code && result.code === 200) {
      openTrialEnvironment({
        bizCode,
        code: result.data,
        generateCallback,
        onHrTrialHostMissing,
        pmsCallbackPath: 'tryCallback'
      });
    }
  }
}

export function enterOrStartTrial(options: EnterOrStartTrialOptions) {
  return options.tenants.length > 0 ? goNow(options) : startFreeTrial(options);
}

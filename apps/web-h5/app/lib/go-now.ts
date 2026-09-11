interface TrialCallbackOptions {
  generateCallback?: (uri: string) => void;
  token: string | undefined;
}

interface GoNowOptions extends TrialCallbackOptions {
  tenants: Tenant[];
}

function completeCallback(uri: string, generateCallback?: (uri: string) => void) {
  if (generateCallback) {
    generateCallback(uri);
    return;
  }

  const trialHost = process.env.NEXT_PUBLIC_TRIAL_HOST;
  window.open(`${trialHost}/oauth/${uri}`, '_blank');
}

export async function goNow({ generateCallback, tenants, token }: GoNowOptions) {
  const tenant = tenants.at(-1);
  if (!tenant) return;

  const response = await fetch(`/go-tech/platform/platformCustomer/gotoPmsCode?tenantId=${tenant.tenantId}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-type': 'platform_customer'
    }
  }).then(res => res.json());

  if (response.code === 200) {
    completeCallback(`tenantCallback?code=${response.data}`, generateCallback);
  }
}

export async function startFreeTrial({ generateCallback, token }: TrialCallbackOptions) {
  const response = await fetch('/go-tech/platform/platformCustomer/trialCode', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-type': 'platform_customer'
    }
  });

  if (response.ok) {
    const result = await response.json();
    if (result.code === 200) {
      completeCallback(`tryCallback?code=${result.data}`, generateCallback);
    }
  }
}

export function enterOrStartTrial(options: GoNowOptions) {
  return options.tenants.length > 0 ? goNow(options) : startFreeTrial(options);
}

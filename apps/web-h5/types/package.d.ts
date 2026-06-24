import type { Packages as CorePackages, Tenant as CoreTenant } from '@go-tech/core-types';

declare global {
  type Packages = CorePackages;
  type Tenant = CoreTenant;
}

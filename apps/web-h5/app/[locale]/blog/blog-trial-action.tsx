'use client';

import { buttonVariants } from '@go-tech-frontend/ui';
import { TrialAction } from '@/app/components/trial-action';
import { filterTenantsByBizCode } from '@/app/lib/go-now';
import { useAuth } from '@/contexts/AuthContext';
import { useProductSelection } from '@/contexts/ProductSelectionContext';

export default function BlogTrialAction() {
  const { isLoggedIn, tenants } = useAuth();
  const { product } = useProductSelection();
  const hasTenant = isLoggedIn && filterTenantsByBizCode(tenants, product).length > 0;
  return (
    <TrialAction className={buttonVariants({ variant: 'trial', size: 'lg' })}>
      {hasTenant ? '立即使用' : '立即開始14天免費試用'}
    </TrialAction>
  );
}

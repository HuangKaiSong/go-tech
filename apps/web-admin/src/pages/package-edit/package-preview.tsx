import { PackageCard } from '@go-tech/package-ui';
import { toPackageCardPlan } from './package-model';
import type { PackageDraft } from './package-model';

export function PackagePreview({ plan }: { plan: PackageDraft }) {
  return <PackageCard plan={toPackageCardPlan(plan)} product={plan.bizCode} preview />;
}

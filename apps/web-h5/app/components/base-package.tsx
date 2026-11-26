import { BasePackageCard } from '@go-tech/package-ui';
import type { PackageBizCode, Packages } from '@go-tech/types';
import { toPackageCardPlan } from '@/app/lib/package-card-plan';
import { DynamicText } from './DynamicI18nText.client';
import Link from './Link';

export function BasePackage({
  onSelect,
  plan,
  product
}: {
  onSelect?: (plan: Packages) => void;
  plan: Packages;
  product: PackageBizCode;
}) {
  const href = plan.price ? `/select-plan/${encodeURIComponent(plan.packageCode ?? '')}?product=${product}` : '';

  return (
    <BasePackageCard
      href={href}
      LinkComponent={Link}
      onSelect={onSelect ? () => onSelect(plan) : undefined}
      plan={toPackageCardPlan(plan)}
      product={product}
      TextComponent={DynamicText}
    />
  );
}

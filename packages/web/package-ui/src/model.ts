import type { PackageBillingMode, PackageBizCode, PackageItem, PackageKind } from '@go-tech/types';

/** Presentation data only. Applications adapt their API fields to this contract. */
export interface PackageCardPlan {
  addUnitPrice?: number;
  badge?: string;
  billingLabel?: string;
  billingMode?: PackageBillingMode;
  capacityLabel?: string;
  count?: number;
  features?: readonly string[];
  isRecommended?: boolean;
  itemType?: number;
  menu?: readonly Pick<PackageItem, 'isHighlight' | 'menuId' | 'menuTitle' | 'sortOrder'>[];
  note?: string;
  originalPrice?: number;
  packageKind?: PackageKind;
  packageName: string;
  price?: number;
  subtitle?: string;
  summary?: string;
}

export const billingLabels = {
  employee_month: '每名員工 / 月',
  month: '每月收費',
  unit_month: '每個單位 / 月',
  year: '每年收費'
} as const;

export const formatPackagePrice = (value: number | undefined) =>
  typeof value === 'number' && Number.isFinite(value)
    ? new Intl.NumberFormat('en-HK', { maximumFractionDigits: 2 }).format(value)
    : null;

export function getPackageFeatures(plan: Pick<PackageCardPlan, 'features' | 'menu'>): readonly string[] {
  if (plan.features?.length) return plan.features;
  const items = (plan.menu ?? []).toSorted(
    (left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0) || left.menuId - right.menuId
  );
  const highlights = items.filter(item => item.isHighlight);
  return [...new Set((highlights.length ? highlights : items).map(item => item.menuTitle))].slice(0, 6);
}

export const getBillingLabel = (plan: Pick<PackageCardPlan, 'billingLabel' | 'billingMode'>) =>
  plan.billingLabel || billingLabels[plan.billingMode ?? 'year'];

export function getAddonBillingLabel(
  plan: Pick<PackageCardPlan, 'billingLabel' | 'billingMode' | 'count' | 'itemType'>
) {
  const quantityType = plan.itemType === 2 || plan.itemType === 3;
  if (!quantityType || !Number.isSafeInteger(plan.count) || Number(plan.count) < 0) return getBillingLabel(plan);
  if (plan.billingMode === 'employee_month') return `${plan.count}名員工 / 月`;
  if (plan.billingMode === 'unit_month') return `${plan.count}個單位 / 月`;
  return getBillingLabel(plan);
}

export function getCapacityLabel(plan: Pick<PackageCardPlan, 'capacityLabel' | 'count'>, product: PackageBizCode) {
  if (plan.capacityLabel) return plan.capacityLabel;
  if (!plan.count) return '';
  return product === 'hr' ? `包含 ${plan.count} 名員工` : `最多 ${plan.count} 個物業單位`;
}

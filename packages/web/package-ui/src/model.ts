import type {
  PackageAddon,
  PackageBillingMode,
  PackageBizCode,
  PackageDetail,
  PackageItem,
  PackageKind
} from '@go-tech/types';

type PackageCardMenuItem = Pick<PackageItem, 'isHighlight' | 'menuId' | 'menuTitle' | 'sortOrder'> &
  Partial<Pick<PackageItem, 'level' | 'menuIcon' | 'parentId'>>;

/** Presentation data only. Applications adapt their API fields to this contract. */
export interface PackageCardPlan {
  badge?: string;
  billingLabel?: string;
  billingMode?: PackageBillingMode;
  capacityLabel?: string;
  count?: number;
  features?: readonly string[];
  isRecommended?: boolean;
  itemType?: number;
  menu?: readonly PackageCardMenuItem[];
  note?: string;
  originalPrice?: number;
  packageKind?: PackageKind;
  packageName: string;
  price?: number;
  subtitle?: string;
  summary?: string;
}

type AddonCardSource = Pick<PackageAddon, 'itemName' | 'itemType' | 'price'> & {
  detail?: Pick<PackageDetail, 'billingLabel' | 'billingMode' | 'dataCount' | 'features' | 'summary'> & {
    menu?: readonly PackageCardMenuItem[];
  };
};

export function toAddonCardPlan(addon: AddonCardSource, product: PackageBizCode): PackageCardPlan {
  const detail = addon.detail ?? {};
  return {
    billingLabel: detail.billingLabel,
    billingMode: detail.billingMode ?? (product === 'hr' ? 'employee_month' : 'unit_month'),
    count: addon.itemType === 2 || addon.itemType === 3 ? detail.dataCount : undefined,
    features: detail.features,
    itemType: addon.itemType,
    menu: detail.menu,
    packageKind: 'addon',
    packageName: addon.itemName,
    price: addon.price,
    summary: detail.summary
  };
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

export function getPmsFeatureGroups(menu: readonly PackageCardMenuItem[] = []) {
  const modules = menu.filter(item => item.level === 0);
  const features = menu.filter(item => item.level === 1);

  return modules.map(module => ({
    id: String(module.menuId),
    title: module.menuTitle,
    features: features.filter(item => item.parentId === module.menuId).map(item => item.menuTitle)
  }));
}

export function getHrFeatureGroups(menu: readonly PackageCardMenuItem[] = []) {
  const visibleItems = menu.filter(item => item.level !== undefined && item.level >= 1 && item.level < 4);
  const itemsById = new Map(visibleItems.map(item => [item.menuId, item]));
  const groups = visibleItems
    .filter(item => item.level === 1)
    .map(module => ({ id: String(module.menuId), title: module.menuTitle, features: [] as string[] }));
  const groupsById = new Map(groups.map(group => [group.id, group]));

  for (const item of visibleItems.filter(feature => feature.level !== 1)) {
    const visited = new Set([item.menuId]);
    let parentId = item.parentId;
    while (parentId !== null && parentId !== undefined && !visited.has(parentId)) {
      visited.add(parentId);
      const parent = itemsById.get(parentId);
      if (!parent) break;
      if (parent.level === 1) {
        groupsById.get(String(parent.menuId))?.features.push(item.menuTitle);
        break;
      }
      parentId = parent.parentId;
    }
  }

  return groups;
}

export const getBillingLabel = (plan: Pick<PackageCardPlan, 'billingLabel' | 'billingMode'>) =>
  plan.billingLabel || billingLabels[plan.billingMode ?? 'year'];

export function getAddonBillingLabel({
  billingLabel,
  billingMode,
  count,
  itemType
}: Pick<PackageCardPlan, 'billingLabel' | 'billingMode' | 'count' | 'itemType'>) {
  const customLabel = typeof billingLabel === 'string' ? billingLabel.trim() : '';
  if (customLabel) return customLabel;

  const hasCount = typeof count === 'number' && Number.isSafeInteger(count) && count > 0;
  if (itemType === 2) return ' 月';
  if (itemType === 3 && hasCount) {
    if (billingMode === 'employee_month') return `${count}名員工 / 月`;
    if (billingMode === 'unit_month') return `${count}個單位 / 月`;
  }
  return getBillingLabel({ billingMode });
}

export function getCapacityLabel(plan: Pick<PackageCardPlan, 'capacityLabel' | 'count'>, product: PackageBizCode) {
  if (plan.capacityLabel) return plan.capacityLabel;
  if (!plan.count) return '';
  return product === 'hr' ? `包含 ${plan.count} 名員工` : `最多 ${plan.count} 個物業單位`;
}

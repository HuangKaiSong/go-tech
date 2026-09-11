import type { Packages } from '@go-tech/types';

type DisplayFeature = {
  menuIcon?: string;
  menuId: number | string;
  menuTitle: string;
};

export type ExtendedPackages = Packages & {
  newFeatures: { icon?: string; label: string }[];
  newPackageItemList: DisplayFeature[];
  upgradeNote: string | null;
};

function getDisplayFeatures(plan: Packages): DisplayFeature[] {
  if (plan.detail?.features?.length) {
    return [...new Set(plan.detail.features)].map(label => ({
      menuId: `feature:${label}`,
      menuTitle: label
    }));
  }
  return (plan.detail?.menu ?? []).filter(item => item.level <= 1);
}

/** 保持接口顺序，只与前一个套餐比较；不修改原始套餐及 detail。 */
export function buildServicePlans(plans: readonly Packages[]): ExtendedPackages[] {
  const displayFeatures = plans.map(getDisplayFeatures);
  return plans.map((plan, index) => {
    const previous = plans[index - 1];
    const features = displayFeatures[index];
    if (!previous) {
      return { ...plan, newFeatures: [], newPackageItemList: features, upgradeNote: null };
    }

    const previousIds = new Set(displayFeatures[index - 1].map(feature => feature.menuId));
    const newFeatures: ExtendedPackages['newFeatures'] = [];
    const newPackageItemList: DisplayFeature[] = [];
    for (const feature of features) {
      if (previousIds.has(feature.menuId)) newPackageItemList.push(feature);
      else newFeatures.push({ label: feature.menuTitle, icon: feature.menuIcon });
    }

    const priceDiff = plan.price - previous.price;
    const countDiff = (plan.detail?.dataCount ?? 0) - (previous.detail?.dataCount ?? 0);
    const countUnit = plan.bizCode === 'hr' ? '名員工' : '個單位';
    const capacityNote = countDiff > 0 ? `，增加${countDiff}${countUnit}` : '';
    const upgradeNote = priceDiff > 0 ? `(加$${priceDiff}從${previous.packageName}升級${capacityNote})` : null;

    return { ...plan, newFeatures, newPackageItemList, upgradeNote };
  });
}

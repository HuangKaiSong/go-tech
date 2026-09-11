import type { PackageCardPlan } from '@go-tech/package-ui/model';
import type { PackageAddon, PackageBizCode, Packages } from '@go-tech/types';

const firstText = (...values: Array<string | undefined>) => values.find(Boolean);
const firstDefined = <Value>(...values: Array<Value | undefined>) => values.find(value => value !== undefined);

export const getFeaturedHrPlan = (packages: Packages[]) => {
  const plans = packages.filter(plan => (plan.detail?.packageKind ?? 'plan') === 'plan');
  return plans.find(plan => plan.detail?.isFeatured ?? plan.isFeatured ?? plan.displayConfig?.isFeatured) ?? plans[0];
};

export function toAddonCardPlan(addon: PackageAddon, product: PackageBizCode): PackageCardPlan {
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

export function toPackageCardPlan(plan: Packages): PackageCardPlan {
  const detail = plan.detail ?? {};
  const display = plan.displayConfig ?? {};
  return {
    badge: firstText(detail.badge, display.badge),
    billingLabel: firstText(detail.billingLabel, display.billingLabel),
    billingMode: firstDefined(detail.billingMode),
    capacityLabel: firstText(detail.capacityLabel, display.capacityLabel),
    count: firstDefined(detail.dataCount),
    features: firstDefined(detail.features, plan.displayFeatures, display.features),
    isRecommended: firstDefined(detail.isRecommended, display.isRecommended),
    itemType: plan.itemType,
    menu: firstDefined(detail.menu, plan.detail?.menu),
    note: firstText(detail.remind, detail.note, plan.note, display.note),
    originalPrice: firstDefined(detail.originalPrice, plan.originalPrice, display.originalPrice),
    packageKind: firstDefined(detail.packageKind),
    packageName: plan.packageName,
    price: plan.price,
    subtitle: firstText(detail.applyTo, detail.subtitle, plan.subtitle, display.subtitle),
    summary: firstText(detail.summary, display.summary)
  };
}

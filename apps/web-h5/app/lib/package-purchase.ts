import type { PackageAddon, Packages } from '@go-tech/types';

export type ServiceSelection = Record<string, number>;

export const getPurchasePlanKey = (plan: Packages) => `${plan.bizCode ?? 'pms'}:${plan.packageCode || plan.id}`;

export const getPurchaseAddonKey = (plan: Packages, addon: PackageAddon, index: number) =>
  JSON.stringify([getPurchasePlanKey(plan), addon.id ?? addon.packageCode ?? addon.itemName, index]);

export const DEFAULT_ADDON_QUANTITY = 1;

export const normalizeQuantity = (value: number) =>
  Math.min(Number.MAX_SAFE_INTEGER, Math.max(1, Number.isFinite(value) ? Math.floor(value) : 1));

export const getPlanUnitPrice = (plan: Packages, months: number) => {
  if (months >= 12) return plan.priceC ?? plan.price;
  if (months >= 6) return plan.priceB ?? plan.price;
  if (months >= 3) return plan.priceA ?? plan.price;
  return plan.price;
};

/** Multiply in cents so quantity/month changes do not accumulate floating point rounding errors. */
export const computeServiceTotal = (price: number, quantity: number, months: number) =>
  (Math.round(price * 100) * quantity * months) / 100;

export function getSelectedAddonLines(plan: Packages, selection: ServiceSelection, months: number) {
  return (plan.additionalItems ?? []).flatMap((service, index) => {
    const key = getPurchaseAddonKey(plan, service, index);
    if (!(selection[key] > 0)) return [];
    const quantity = normalizeQuantity(selection[key]);
    if (!quantity) return [];
    return [{ key, quantity, service, total: computeServiceTotal(service.price, quantity, months) }];
  });
}

export function getPurchaseTotals(plan: Packages | undefined, months: number, selection: ServiceSelection) {
  if (!plan)
    return { addonsTotal: 0, baseOriginal: 0, basePayable: 0, lines: [], originalTotal: 0, savings: 0, total: 0 };
  const lines = getSelectedAddonLines(plan, selection, months);
  const baseOriginal = computeServiceTotal(plan.price, 1, months);
  const basePayable = computeServiceTotal(getPlanUnitPrice(plan, months), 1, months);
  const addonsTotal = lines.reduce((sum, line) => sum + Math.round(line.total * 100), 0) / 100;
  const savings = Math.max(0, Math.round((baseOriginal - basePayable) * 100)) / 100;

  return {
    addonsTotal,
    baseOriginal,
    basePayable,
    lines,
    originalTotal: (Math.round(baseOriginal * 100) + Math.round(addonsTotal * 100)) / 100,
    savings,
    months,
    total: (Math.round(basePayable * 100) + Math.round(addonsTotal * 100)) / 100
  };
}

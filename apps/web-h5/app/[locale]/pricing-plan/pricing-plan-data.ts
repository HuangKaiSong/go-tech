import type { MenuType, PackageBizCode, PackageDetail, Packages } from '@go-tech/types';
import type { PricingPlanData } from './types';

interface PricingAddon {
  detail?: PackageDetail | string | null;
  id?: number;
  itemName?: string;
  itemType?: number;
  packageCode?: string;
  price?: number;
}

type PackageWithAddons = Packages & { additionalItems?: PricingAddon[] };

const emptyPricingData = (): PricingPlanData => ({ addons: [], categories: [], plans: [] });

const formatPrice = (value: number) => `$${value.toLocaleString('zh-Hans-CN')}`;

const readDetail = (value: PricingAddon['detail']): PackageDetail => {
  if (typeof value !== 'string') return value ?? {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? (parsed as PackageDetail) : {};
  } catch {
    return {};
  }
};

const getAdditionalItems = (plan: Packages) => (plan as PackageWithAddons).additionalItems ?? [];

const getAddonKey = (addon: PricingAddon) => addon.packageCode?.trim() || addon.itemName?.trim() || String(addon.id);

const getAddonFeatures = (addon: PricingAddon) => {
  const detail = readDetail(addon.detail);
  const configured = detail.features?.map(feature => feature.trim()).filter(Boolean);
  if (configured?.length) return configured;
  return detail.menu?.map(item => item.menuTitle.trim()).filter(Boolean) ?? [];
};

const getAddonAmount = (addon: PricingAddon) => {
  if (typeof addon.price !== 'number') return undefined;
  if (addon.itemType !== 2 && addon.itemType !== 3) return addon.price;
  const count = readDetail(addon.detail).dataCount;
  if (!Number.isSafeInteger(count) || Number(count) < 0) return undefined;
  const amount = addon.price * Number(count);
  return Number.isFinite(amount) ? amount : undefined;
};

const buildCategories = (menus: MenuType[], plans: Packages[]): PricingPlanData['categories'] =>
  menus.map(menu => ({
    name: menu.menuTitle,
    features:
      menu.children?.map(child => ({
        name: child.menuTitle,
        type: child.desc,
        icon: child.menuIcon,
        plans: plans.map(plan => plan.detail?.menu?.some(item => item.menuId === child.menuId) ?? false)
      })) ?? []
  }));

const buildAddons = (plans: Packages[]): PricingPlanData['addons'] => {
  const groups = new Map<string, { features: Set<string>; key: string; name: string }>();

  plans.forEach(plan => {
    getAdditionalItems(plan).forEach(addon => {
      const name = addon.itemName?.trim();
      if (!name) return;
      const key = getAddonKey(addon);
      const group = groups.get(key) ?? { features: new Set<string>(), key, name };
      getAddonFeatures(addon).forEach(feature => group.features.add(feature));
      groups.set(key, group);
    });
  });

  return Array.from(groups.values()).map(group => ({
    features: Array.from(group.features),
    key: group.key,
    name: group.name,
    prices: plans.map(plan => {
      const addon = getAdditionalItems(plan).find(candidate => getAddonKey(candidate) === group.key);
      if (!addon) return '—';
      const amount = getAddonAmount(addon);
      if (amount === undefined) return '—';
      return amount === 0 ? '已包含' : formatPrice(amount);
    })
  }));
};

const buildExtraPrice = (plan: Packages, product: PackageBizCode) => {
  const addon = getAdditionalItems(plan).find(item => item.itemType === 2 || item.itemType === 3);
  if (!addon) return '無';
  const amount = getAddonAmount(addon);
  if (amount === undefined || amount <= 0) return '無';
  const count = readDetail(addon.detail).dataCount;
  const quantity = Number.isSafeInteger(count) && Number(count) > 0 ? count : 1;
  return `${formatPrice(amount)}/${quantity}${product === 'hr' ? '名' : '個'}`;
};

export const buildPricingData = (product: PackageBizCode, packages: Packages[], menus: MenuType[]): PricingPlanData => {
  const plans = packages.filter(plan => (plan.detail?.packageKind ?? 'plan') === 'plan');
  if (plans.length === 0) return emptyPricingData();

  return {
    plans: plans.map(plan => ({
      id: plan.id,
      name: plan.packageName,
      price: typeof plan.price === 'number' ? formatPrice(plan.price) : '敬請期待',
      units: plan.detail?.dataCount?.toLocaleString('zh-Hans-CN') || '—',
      extra: buildExtraPrice(plan, product)
    })),
    categories: buildCategories(menus, plans),
    addons: buildAddons(plans)
  };
};

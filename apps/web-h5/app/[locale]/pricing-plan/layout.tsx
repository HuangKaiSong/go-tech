import type { PackageBizCode, Packages } from '@go-tech/types';
import { buildPackageCatalog } from '@/app/lib/package-catalog';
import { getBaseUrl } from '@/lib/http';
import PageClient from './page';
import type { PricingPlanData } from './types';

type AddonKey = 'accountingSysPrice' | 'custServiceSysPrice' | 'rentSysPrice' | 'venueSysPrice';

const pmsAddonDefinitions: Array<{
  features: string[];
  key: AddonKey;
  name: string;
}> = [
  { name: '升級營舖模組', features: ['商舖列表', '營銷列表'], key: 'rentSysPrice' },
  { name: '升級場地管理', features: ['手機版', '列印跟進單'], key: 'venueSysPrice' },
  { name: '升級會計', features: [], key: 'accountingSysPrice' },
  { name: '客服', features: ['客服列表', '租客portal'], key: 'custServiceSysPrice' }
];

const emptyPricingData = (): PricingPlanData => ({ addons: [], categories: [], plans: [] });

const formatPrice = (value: number) => `$${value.toLocaleString('zh-Hans-CN')}`;

const buildCategories = (menus: MenuType[], packages: Packages[]): PricingPlanData['categories'] =>
  menus.map(menu => ({
    name: menu.title,
    features:
      menu.children?.map(child => ({
        name: child.title,
        type: child.desc,
        icon: child.icon,
        plans: packages.map(plan => plan.packageItemList?.some(item => item.menuId === child.id) || false)
      })) || []
  }));

const buildPmsAddons = (packages: Packages[]): PricingPlanData['addons'] =>
  pmsAddonDefinitions.map(addon => ({
    ...addon,
    prices: packages.map(plan => {
      const price = plan[addon.key];
      if (typeof price !== 'number') return '—';
      return price === 0 ? '已包含' : `${formatPrice(price)} each`;
    })
  }));

const buildHrAddons = (packages: Packages[], plans: Packages[]): PricingPlanData['addons'] => {
  const addonGroups = new Map<string, Packages[]>();

  packages
    .filter(plan => plan.packageKind === 'addon')
    .forEach(addon => {
      const groupKey = addon.addonCode || addon.packageCode || addon.packageName;
      addonGroups.set(groupKey, [...(addonGroups.get(groupKey) || []), addon]);
    });

  return Array.from(addonGroups.values()).map(addons => {
    const firstAddon = addons[0];
    const features = Array.from(
      new Set(
        addons.flatMap(addon => addon.displayFeatures || addon.packageItemList?.map(item => item.menuTitle) || [])
      )
    );

    return {
      name: firstAddon.packageName,
      features,
      key: firstAddon.addonCode || firstAddon.packageCode || String(firstAddon.id),
      prices: plans.map(plan => {
        const addon = addons.find(candidate => candidate.parentId === plan.id);
        if (!addon || typeof addon.price !== 'number') return '—';
        return addon.price === 0 ? '已包含' : formatPrice(addon.price);
      })
    };
  });
};

const buildPricingData = (product: PackageBizCode, packages: Packages[], menus: MenuType[]): PricingPlanData => {
  const plans = packages.filter(plan => (plan.packageKind || 'plan') === 'plan');
  if (plans.length === 0) return emptyPricingData();

  return {
    plans: plans.map(plan => ({
      id: plan.id,
      name: plan.packageName,
      price: typeof plan.price === 'number' ? formatPrice(plan.price) : '敬請期待',
      units: plan.unitCount?.toLocaleString('zh-Hans-CN') || '—',
      extra:
        plan.addUnitPrice > 0
          ? `${formatPrice(plan.addUnitPrice)}/${plan.overageStep || 1}${product === 'hr' ? '名' : '個'}`
          : '無'
    })),
    categories: buildCategories(menus, plans),
    addons: product === 'hr' ? buildHrAddons(packages, plans) : buildPmsAddons(plans)
  };
};

const fetchData = async (url: string): Promise<unknown> => {
  try {
    const response = await fetch(url);
    return response.ok ? response.json() : undefined;
  } catch {
    return undefined;
  }
};

export default async function Layout() {
  const baseUrl = getBaseUrl();
  const [packageResponse, pmsMenuResponse, hrMenuResponse] = await Promise.all([
    fetchData(`${baseUrl}/go-tech/platform/platformPackage/enabledList`),
    fetchData(`${baseUrl}/go-tech/platform/platformPackage/menuTree?bizCode=pms`),
    fetchData(`${baseUrl}/go-tech/platform/platformPackage/menuTree?bizCode=hr`)
  ]);
  const catalog = buildPackageCatalog(packageResponse);
  const pmsMenus = (pmsMenuResponse as HttpBaseResponse<MenuType[]> | undefined)?.data || [];
  const hrMenus = (hrMenuResponse as HttpBaseResponse<MenuType[]> | undefined)?.data || [];

  return (
    <PageClient
      pricingCatalog={{
        pms: buildPricingData('pms', catalog.pms, pmsMenus),
        hr: buildPricingData('hr', catalog.hr, hrMenus)
      }}
    />
  );
}

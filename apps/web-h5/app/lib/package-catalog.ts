import type {
  PackageAddon,
  PackageBizCode,
  PackageDetail,
  PackageDisplayConfig,
  PackageKind,
  Packages
} from '@go-tech/types';

export type PackageCatalog = Record<PackageBizCode, Packages[]>;

const productKeys: PackageBizCode[] = ['pms', 'hr'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toProductKey = (value: unknown): PackageBizCode | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.toLowerCase();
  return normalized === 'pms' || normalized === 'hr' ? normalized : null;
};

const toPackageKind = (value: unknown, parentId: unknown): PackageKind => {
  if (value === 'addon' || value === 'plan') return value;
  return typeof parentId === 'number' ? 'addon' : 'plan';
};

const toDisplayConfig = (value: unknown): PackageDisplayConfig | undefined => {
  if (isRecord(value)) return value as PackageDisplayConfig;

  if (typeof value !== 'string' || !value.trim()) return undefined;
  try {
    const parsed = JSON.parse(value) as unknown;
    return isRecord(parsed) ? (parsed as PackageDisplayConfig) : undefined;
  } catch {
    return undefined;
  }
};

const toPackageDetail = (value: unknown): PackageDetail | undefined =>
  toDisplayConfig(value) as PackageDetail | undefined;

const normalizeAdditionalItems = (value: unknown, bizCode: PackageBizCode): PackageAddon[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    if (!isRecord(item) || typeof item.itemName !== 'string' || typeof item.price !== 'number') return [];
    const itemType = Number(item.itemType);
    if (![1, 2, 3].includes(itemType)) return [];
    return [
      { ...item, itemName: item.itemName, price: item.price, itemType, bizCode, detail: toPackageDetail(item.detail) }
    ];
  });
};

const normalizePackage = (value: unknown, sourceIndex: number, forcedProduct?: PackageBizCode): Packages | null => {
  if (!isRecord(value) || value.packageCode === '' || typeof value.packageName !== 'string') return null;

  const bizCode = forcedProduct || toProductKey(value.bizCode ?? value.biz_code) || 'pms';
  const parentId = value.parentId ?? value.parent_id;
  const rawSortOrder = value.sortOrder ?? value.sort_order;
  const detail = toPackageDetail(value.detail);

  return {
    ...value,
    additionalItems: normalizeAdditionalItems(value.additionalItems, bizCode),
    bizCode,
    detail,
    displayConfig: toDisplayConfig(value.displayConfig ?? value.display_config),
    packageKind: toPackageKind(value.packageKind ?? value.package_kind ?? detail?.packageKind, parentId),
    parentId: typeof parentId === 'number' ? parentId : null,
    sortOrder: typeof rawSortOrder === 'number' ? rawSortOrder : sourceIndex
  } as unknown as Packages;
};

const sortPackages = (packages: Packages[]) =>
  packages.toSorted((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0) || left.id - right.id);

/** EnabledList 过渡适配器。支持 data 为混合数组，也支持 data.pms / data.hr 分组返回。 旧数据没有 bizCode 时按 PMS 处理，避免尚未升级的接口让首页套餐消失。 */
export function buildPackageCatalog(response: unknown): PackageCatalog {
  const catalog: PackageCatalog = { hr: [], pms: [] };
  const data = isRecord(response) && 'data' in response ? response.data : response;
  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      const normalized = normalizePackage(item, index);
      if (normalized?.bizCode) catalog[normalized.bizCode].push(normalized);
    });
  } else if (isRecord(data)) {
    productKeys.forEach(product => {
      const productPackages = data[product];
      if (!Array.isArray(productPackages)) return;

      productPackages.forEach((item, index) => {
        const normalized = normalizePackage(item, index, product);
        if (normalized) catalog[product].push(normalized);
      });
    });
  }

  catalog.pms = sortPackages(catalog.pms);
  catalog.hr = sortPackages(catalog.hr);
  return catalog;
}

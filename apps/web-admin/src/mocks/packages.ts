import type {
  PackageAddon,
  PackageBillingMode,
  PackageBizCode,
  PackageDisplayConfig,
  PackageKind
} from '@go-tech/types';

export interface PackageMenuItem {
  isHighlight?: boolean;
  level: number;
  menuIcon?: string;
  menuId: number;
  menuTitle: string;
  /** Direct parent's menuId; null for a root. Older snapshots may omit this field. */
  parentId?: number | null;
  sortOrder?: number;
  [key: string]: unknown;
}

export interface PackageDetail extends PackageDisplayConfig {
  applyTo?: string;
  billingMode?: PackageBillingMode;
  dataCount?: number;
  menu?: PackageMenuItem[];
  packageKind?: PackageKind;
  remind?: string;
  summary?: string;
  [key: string]: unknown;
}

/** Admin edit shape for an add-on; it keeps the existing runtime fields unchanged. */
export interface PackageAddonItem extends Omit<Partial<PackageAddon>, 'detail'> {
  detail: PackageDetail & { dataCount: number; menu?: PackageMenuItem[] };
  itemName: string;
  itemType: number;
  price: number;
  [key: string]: unknown;
}

export interface PackageItem {
  additionalItems: PackageAddonItem[];
  bizCode: PackageBizCode;
  detail: PackageDetail;
  itemName?: string;
  itemType?: number;
  packageCode: string;
  packageName: string;
  price: number;
  priceA: number;
  priceB: number;
  priceC: number;
  status: number;
}

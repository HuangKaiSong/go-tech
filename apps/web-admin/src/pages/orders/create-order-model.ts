import type { PackageAddon, Packages } from '@go-tech/types';
import { OrderItemTypeEnum, OrderTypeEnum } from '@/constants/order';
import { PayTypeEnum } from '@/constants/payment';

export const DAYS_PER_MONTH = 30;
export const DEFAULT_ADDON_QUANTITY = 1;

export type AddonSelection = Record<string, number>;

export interface PurchaseLine {
  key: string;
  quantity: number;
  service: PackageAddon;
  total: number;
}

export interface PurchaseTotals {
  addonsTotal: number;
  baseOriginal: number;
  basePayable: number;
  lines: PurchaseLine[];
  months: number;
  originalTotal: number;
  savings: number;
  total: number;
}

export interface CreateOrderItem {
  count: number;
  days: number;
  itemCode?: string;
  itemName?: string;
  itemType: OrderItemTypeEnum;
  packageCode?: string;
  packageItemId?: number;
  price: number;
}

export interface CreateOrderPayload {
  activateDate?: string;
  createUser?: number | string;
  custCode: string;
  orderItems: CreateOrderItem[];
  orderType: OrderTypeEnum;
  payType: PayTypeEnum;
  promotionId?: number;
}

const toCents = (value: number) => Math.round(value * 100);
const fromCents = (value: number) => value / 100;

export const normalizeMonths = (value: number) => (Number.isSafeInteger(value) && value >= 1 ? value : 1);

export const normalizeQuantity = (value: number) =>
  Math.min(Number.MAX_SAFE_INTEGER, Math.max(1, Number.isFinite(value) ? Math.floor(value) : 1));

export const getAddonKey = (plan: Packages, addon: PackageAddon, index: number) =>
  JSON.stringify([plan.packageCode ?? plan.id, addon.id ?? addon.packageCode ?? addon.itemName, index]);

export const getPlanUnitPrice = (plan: Packages, months: number) => {
  if (months >= 12) return plan.priceC ?? plan.price;
  if (months >= 6) return plan.priceB ?? plan.price;
  if (months >= 3) return plan.priceA ?? plan.price;
  return plan.price;
};

export const getPurchaseTotals = (
  plan: Packages | undefined,
  requestedMonths: number,
  selection: AddonSelection
): PurchaseTotals => {
  const months = normalizeMonths(requestedMonths);
  if (!plan) {
    return {
      addonsTotal: 0,
      baseOriginal: 0,
      basePayable: 0,
      lines: [],
      months,
      originalTotal: 0,
      savings: 0,
      total: 0
    };
  }

  const lines = (plan.additionalItems ?? []).flatMap((service, index) => {
    const key = getAddonKey(plan, service, index);
    if (!(selection[key] > 0)) return [];
    const quantity = normalizeQuantity(selection[key]);
    return [{ key, quantity, service, total: fromCents(toCents(service.price) * quantity * months) }];
  });
  const baseOriginal = fromCents(toCents(plan.price) * months);
  const basePayable = fromCents(toCents(getPlanUnitPrice(plan, months)) * months);
  const addonsTotal = fromCents(lines.reduce((sum, line) => sum + toCents(line.total), 0));
  const savings = fromCents(Math.max(0, toCents(baseOriginal) - toCents(basePayable)));

  return {
    addonsTotal,
    baseOriginal,
    basePayable,
    lines,
    months,
    originalTotal: fromCents(toCents(baseOriginal) + toCents(addonsTotal)),
    savings,
    total: fromCents(toCents(basePayable) + toCents(addonsTotal))
  };
};

export const buildCreateOrderPayload = ({
  activateDate,
  createUser,
  custCode,
  months,
  payType,
  plan,
  promotionId,
  selection
}: {
  activateDate?: string;
  createUser?: number | string;
  custCode: string;
  months: number;
  payType: PayTypeEnum;
  plan: Packages;
  promotionId?: number;
  selection: AddonSelection;
}): CreateOrderPayload => {
  const totals = getPurchaseTotals(plan, months, selection);
  const days = totals.months * DAYS_PER_MONTH;
  const orderItems: CreateOrderItem[] = [
    {
      itemType: OrderItemTypeEnum.PACKAGE,
      packageItemId: plan.id,
      itemName: plan.itemName ?? plan.packageName,
      packageCode: plan.packageCode,
      price: plan.price,
      count: totals.months,
      days
    },
    ...totals.lines.map(({ quantity, service }) => ({
      itemType: OrderItemTypeEnum.ADDITION,
      count: quantity,
      price: service.price,
      packageCode: plan.packageCode,
      itemName: service.itemName,
      packageItemId: service.id,
      itemCode: service.packageCode,
      days
    }))
  ];

  return {
    orderType: OrderTypeEnum.PURCHASE,
    payType,
    orderItems,
    custCode,
    ...(activateDate ? { activateDate } : {}),
    ...(createUser !== undefined ? { createUser } : {}),
    ...(promotionId !== undefined ? { promotionId } : {})
  };
};

export const getCreatedOrderId = (data: unknown): number => {
  const value = typeof data === 'object' && data !== null && 'orderId' in data ? data.orderId : data;
  const isNumericId = typeof value === 'number' || (typeof value === 'string' && /^[1-9]\d*$/.test(value));
  if (!isNumericId || !Number.isSafeInteger(Number(value)) || Number(value) <= 0) {
    throw new Error('創建訂單響應缺少有效的訂單 ID');
  }
  return Number(value);
};

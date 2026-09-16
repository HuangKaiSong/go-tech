import assert from 'node:assert/strict';
import test from 'node:test';
import type { Packages } from '@go-tech/types';
import { DEFAULT_ADDON_QUANTITY, getPurchaseAddonKey, getPurchaseTotals, normalizeQuantity } from './package-purchase';

const plan: Packages = {
  bizCode: 'hr',
  id: 10,
  packageName: '基礎版',
  packageCode: 'hr-base',
  price: 2000,
  priceA: 1900,
  priceB: 1800,
  priceC: 1600,
  detail: { dataCount: 20, menu: [] },
  additionalItems: [
    { itemName: '發薪管理', itemType: 1, price: 30, detail: { dataCount: 0 } },
    { itemName: '日常管理', itemType: 3, price: 20, detail: { dataCount: 5 } }
  ]
};
const addons = plan.additionalItems ?? [];
const key = getPurchaseAddonKey(plan, addons[0], 0);

test('configured monthly prices and savings follow all duration boundaries without discount percentages', () => {
  for (const [months, unitPrice] of [
    [1, 2000],
    [2, 2000],
    [3, 1900],
    [5, 1900],
    [6, 1800],
    [11, 1800],
    [12, 1600],
    [15, 1600]
  ]) {
    const result = getPurchaseTotals(plan, months, { selection: {} });
    assert.equal(result.basePayable, unitPrice * months);
    assert.equal(result.savings, (2000 - unitPrice) * months);
  }
  assert.equal(getPurchaseTotals({ ...plan, priceC: 0 }, 12, { selection: {} }).basePayable, 0);
  assert.equal(getPurchaseTotals({ ...plan, priceA: undefined }, 3, { selection: {} }).savings, 0);
});

test('selected modules follow purchased quantity and months without a capacity limit', () => {
  assert.equal(DEFAULT_ADDON_QUANTITY, 1);
  const result = getPurchaseTotals(plan, 12, { selection: { [key]: 20 } });
  assert.equal(result.addonsTotal, 7200);
  assert.equal(result.total, 26400);
  assert.equal(result.originalTotal, 31200);
  assert.equal(result.savings, 4800);
  assert.equal(getPurchaseTotals(plan, 6, { selection: { [key]: 5 } }).addonsTotal, 900);
  assert.equal(getPurchaseTotals(plan, 12, { selection: { [key]: 100 } }).lines[0].quantity, 100);
  assert.equal(getPurchaseTotals(plan, 12, { selection: {} }).addonsTotal, 0);
  assert.equal(getPurchaseTotals(plan, 12, { selection: {} }).total, 19200);
  assert.equal(
    getPurchaseTotals({ ...plan, detail: { dataCount: 0 } }, 12, { selection: { [key]: 20 } }).lines.length,
    1
  );
});

test('promotion discount is included in the payable total', () => {
  const result = getPurchaseTotals(plan, 12, { promotionDiscount: 1200.55, selection: { [key]: 20 } });
  assert.equal(result.promotionDiscount, 1200.55);
  assert.equal(result.total, 25199.45);
  assert.equal(getPurchaseTotals(plan, 1, { promotionDiscount: 3000, selection: {} }).total, 0);
  assert.equal(getPurchaseTotals(plan, 1, { promotionDiscount: -100, selection: {} }).promotionDiscount, 0);
  assert.equal(getPurchaseTotals(plan, 1, { promotionDiscount: Number.NaN, selection: {} }).total, 2000);
});

test('isolates other plans, allows id-less modules, and avoids decimal accumulation', () => {
  const other = { ...plan, id: 11, packageCode: 'other' };
  assert.equal(getPurchaseTotals(other, 12, { selection: { [key]: 20 } }).lines.length, 0);
  const secondKey = getPurchaseAddonKey(plan, addons[1], 1);
  assert.notEqual(key, secondKey);
  const decimal = { ...plan, additionalItems: [{ ...addons[0], price: 0.1 }] };
  assert.equal(getPurchaseTotals(decimal, 3, { selection: { [key]: 3 } }).addonsTotal, 0.9);
  assert.equal(normalizeQuantity(Number.NaN), 1);
  assert.equal(normalizeQuantity(3.8), 3);
});

test('all product and item types start at one and allow quantities above dataCount', () => {
  for (const bizCode of ['hr', 'pms'] as const) {
    for (const itemType of [1, 2, 3]) {
      const variant = {
        ...plan,
        bizCode,
        detail: { dataCount: 0 },
        additionalItems: [{ ...addons[0], itemType, detail: { dataCount: 500 } }]
      };
      const serviceKey = getPurchaseAddonKey(variant, variant.additionalItems[0], 0);
      assert.equal(
        getPurchaseTotals(variant, 12, { selection: { [serviceKey]: DEFAULT_ADDON_QUANTITY } }).addonsTotal,
        360
      );
      assert.equal(getPurchaseTotals(variant, 12, { selection: { [serviceKey]: 600 } }).addonsTotal, 216000);
    }
  }
});

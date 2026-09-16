import type { Packages } from '@go-tech/types';
import { describe, expect, it } from 'vitest';
import { OrderItemTypeEnum, OrderTypeEnum } from '@/constants/order';
import { PayTypeEnum } from '@/constants/payment';
import { buildCreateOrderPayload, getAddonKey, getCreatedOrderId, getPurchaseTotals } from './create-order-model';

const rentAddon = { id: 31, itemName: '租務模組', itemType: 1, packageCode: 'rent', price: 12.5 };

const plan: Packages = {
  id: 12,
  packageCode: 'pms-pro',
  packageName: '專業版',
  itemName: '專業版套餐',
  price: 100,
  priceA: 90,
  priceB: 80,
  priceC: 70,
  additionalItems: [rentAddon, { id: 32, itemName: '客服模組', itemType: 1, packageCode: 'support', price: 20 }]
};

describe('create order model', () => {
  it('uses duration pricing and selected dynamic add-ons for totals', () => {
    const selection = { [getAddonKey(plan, rentAddon, 0)]: 2 };

    expect(getPurchaseTotals(plan, 6, selection)).toMatchObject({
      addonsTotal: 150,
      baseOriginal: 600,
      basePayable: 480,
      originalTotal: 750,
      savings: 120,
      total: 630
    });
  });

  it('builds the same package and add-on item contract as the H5 purchase flow', () => {
    const selection = { [getAddonKey(plan, rentAddon, 0)]: 2 };

    expect(
      buildCreateOrderPayload({
        activateDate: '2026-09-16',
        createUser: 7,
        custCode: 'C001',
        months: 3,
        payType: PayTypeEnum.FPS,
        plan,
        promotionId: 88,
        selection
      })
    ).toEqual({
      activateDate: '2026-09-16',
      createUser: 7,
      custCode: 'C001',
      orderItems: [
        {
          count: 3,
          days: 90,
          itemName: '專業版套餐',
          itemType: OrderItemTypeEnum.PACKAGE,
          packageCode: 'pms-pro',
          packageItemId: 12,
          price: 100
        },
        {
          count: 2,
          days: 90,
          itemCode: 'rent',
          itemName: '租務模組',
          itemType: OrderItemTypeEnum.ADDITION,
          packageCode: 'pms-pro',
          packageItemId: 31,
          price: 12.5
        }
      ],
      orderType: OrderTypeEnum.PURCHASE,
      payType: PayTypeEnum.FPS,
      promotionId: 88
    });
  });

  it('accepts both current and legacy order id response shapes', () => {
    expect(getCreatedOrderId({ orderId: 83, managedOrderNo: 'example' })).toBe(83);
    expect(getCreatedOrderId('84')).toBe(84);
    expect(() => getCreatedOrderId({ orderId: null })).toThrow('有效的訂單 ID');
  });
});

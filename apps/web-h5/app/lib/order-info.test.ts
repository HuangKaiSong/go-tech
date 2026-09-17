import assert from 'node:assert/strict';
import test from 'node:test';
import type { Packages } from '@go-tech/types';
import { OrderItemTypeEnum, OrderTypeEnum } from '../constants/order';
import { PayTypeEnum } from '../constants/payment';
import { buildOrderInfo } from './order-info';
import { getPurchaseAddonKey } from './package-purchase';

const purchasePlan = {
  additionalItems: [
    {
      id: 21,
      itemName: '发薪管理',
      itemType: 1,
      packageCode: 'payroll',
      price: 30
    }
  ],
  id: 10,
  itemType: 1,
  itemName: 'HR 基础版',
  packageCode: 'hr-base',
  packageName: 'HR 基础版',
  price: 2000
} satisfies Packages;

const sourceOrder = {
  orderItems: [
    {
      count: 12,
      days: 360,
      id: 10,
      itemName: 'HR 基础版',
      itemType: OrderItemTypeEnum.PACKAGE,
      price: 2000
    },
    {
      count: 2,
      id: 21,
      itemName: '发薪管理',
      itemType: 2,
      price: 30
    }
  ],
  orderNo: 'ORD-2026-001',
  packageDetail: purchasePlan
};

test('购买订单根据套餐和选择记录在公共方法内生成全部订单条目', () => {
  const serviceKey = getPurchaseAddonKey(purchasePlan, purchasePlan.additionalItems[0], 0);

  const result = buildOrderInfo({
    additionalServiceSelection: { [serviceKey]: 3 },
    orderType: OrderTypeEnum.PURCHASE,
    otherOrderInfo: {
      invoiceHeader: 'GO TECH LIMITED',
      months: 12,
      plan: purchasePlan,
      promotionId: 88
    },
    payType: PayTypeEnum.FPS
  });

  assert.deepEqual(result, {
    invoiceHeader: 'GO TECH LIMITED',
    orderItems: [
      {
        count: 12,
        days: 360,
        itemName: 'HR 基础版',
        itemType: OrderItemTypeEnum.PACKAGE,
        packageCode: 'hr-base',
        packageItemId: 10,
        price: 2000
      },
      {
        count: 3,
        days: 360,
        itemCode: 'payroll',
        itemName: '发薪管理',
        itemType: 2,
        packageCode: 'hr-base',
        packageItemId: 21,
        price: 30
      }
    ],
    orderType: OrderTypeEnum.PURCHASE,
    payType: PayTypeEnum.FPS,
    promotionId: 88
  });
});

test('增值订单根据原订单套餐和选择记录查找增值服务', () => {
  const result = buildOrderInfo({
    additionalServiceSelection: { '21': 2 },
    orderType: OrderTypeEnum.ADDITION,
    otherOrderInfo: {
      order: sourceOrder,
      promotionId: 89
    },
    payType: PayTypeEnum.Online
  });

  assert.deepEqual(result, {
    orderItems: [
      {
        count: 2,
        itemName: '发薪管理',
        itemType: 2,
        packageCode: 'payroll',
        packageId: 10,
        packageItemId: 21,
        price: 30
      }
    ],
    orderType: OrderTypeEnum.ADDITION,
    originalOrder: 'ORD-2026-001',
    payType: PayTypeEnum.Online,
    promotionId: 89
  });
});

test('升级订单在公共方法内查找目标套餐并生成套餐及增值服务条目', () => {
  const upgradePlan = {
    id: 11,
    itemName: 'HR 专业版',
    packageCode: 'hr-pro',
    packageName: 'HR 专业版',
    price: 3000
  } satisfies Packages;

  const result = buildOrderInfo({
    additionalServiceSelection: { '21': 1 },
    orderType: OrderTypeEnum.UPGRADE,
    otherOrderInfo: {
      availablePlans: [upgradePlan],
      order: sourceOrder,
      promotionId: 90,
      selectedPlanCode: 'hr-pro'
    },
    payType: PayTypeEnum.FPS
  });

  assert.deepEqual(result, {
    orderItems: [
      {
        count: 12,
        days: 360,
        itemName: 'HR 专业版',
        itemType: OrderItemTypeEnum.PACKAGE,
        packageCode: 'hr-pro',
        packageItemId: 11,
        price: 3000
      },
      {
        count: 1,
        itemName: '发薪管理',
        itemType: OrderItemTypeEnum.ADDITION,
        packageCode: 'payroll',
        packageId: 10,
        packageItemId: 21,
        price: 30
      }
    ],
    orderType: OrderTypeEnum.UPGRADE,
    originalOrder: 'ORD-2026-001',
    payType: PayTypeEnum.FPS,
    promotionId: 90
  });
});

test('续费订单从原订单中筛选增值服务并按续费月数生成套餐条目', () => {
  const result = buildOrderInfo({
    orderType: OrderTypeEnum.RENEWAL,
    otherOrderInfo: {
      months: 3,
      order: sourceOrder
    },
    payType: PayTypeEnum.Online
  });

  assert.deepEqual(result, {
    orderItems: [
      {
        count: 3,
        days: 90,
        itemName: 'HR 基础版',
        itemType: OrderItemTypeEnum.PACKAGE,
        packageCode: 'hr-base',
        packageItemId: 10,
        price: 2000
      },
      {
        count: 2,
        itemName: '发薪管理',
        itemType: OrderItemTypeEnum.ADDITION,
        packageCode: 'hr-base',
        packageItemId: 21,
        price: 30
      }
    ],
    orderType: OrderTypeEnum.RENEWAL,
    originalOrder: 'ORD-2026-001',
    payType: PayTypeEnum.Online
  });
});

test('升级套餐不存在时拒绝构建不完整订单', () => {
  assert.throws(
    () =>
      buildOrderInfo({
        additionalServiceSelection: {},
        orderType: OrderTypeEnum.UPGRADE,
        otherOrderInfo: {
          availablePlans: [],
          order: sourceOrder,
          selectedPlanCode: 'missing'
        },
        payType: PayTypeEnum.FPS
      }),
    /未找到升级套餐/
  );
});

test('购买套餐不存在时拒绝构建不完整订单', () => {
  assert.throws(
    () =>
      buildOrderInfo({
        additionalServiceSelection: {},
        orderType: OrderTypeEnum.PURCHASE,
        otherOrderInfo: {
          months: 1,
          plan: undefined
        },
        payType: PayTypeEnum.FPS
      }),
    /未找到购买套餐/
  );
});

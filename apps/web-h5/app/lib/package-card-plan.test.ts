import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Packages } from '@go-tech/types';
import { getFeaturedHrPlan, toAddonCardPlan, toPackageCardPlan } from './package-card-plan';
import { buildPackageCatalog } from './package-catalog';

const plan: Packages = {
  id: 1,
  detail: {
    menu: [{ menuId: 7, menuTitle: '租約管理', menuIcon: '', level: 1 }],
    dataCount: 50
  },
  packageName: '基礎套餐',
  price: 100
};

test('retains H5 display configuration fallbacks without changing the API model', () => {
  const adapted = toPackageCardPlan({
    ...plan,
    displayConfig: {
      badge: '推薦',
      billingLabel: '每季收費',
      capacityLabel: '不限數量',
      features: ['自訂功能'],
      isRecommended: true,
      note: '提示',
      originalPrice: 200,
      subtitle: '適用人群',
      summary: '摘要'
    }
  });
  assert.equal(adapted.count, 50);
  assert.equal(adapted.note, '提示');
  assert.equal(adapted.subtitle, '適用人群');
  assert.equal(adapted.billingLabel, '每季收費');
  assert.equal(adapted.capacityLabel, '不限數量');
  assert.deepEqual(adapted.features, ['自訂功能']);
  assert.deepEqual(adapted.menu, plan.detail?.menu);
  assert.equal(adapted.originalPrice, 200);
});

test('uses detail summary and features saved by the admin editor', () => {
  const adapted = toPackageCardPlan({
    ...plan,
    itemType: 2,
    detail: {
      applyTo: '適用於 HR 團隊',
      billingMode: 'employee_month',
      dataCount: 100,
      features: ['行政管理', '打卡管理'],
      packageKind: 'addon',
      remind: '按員工數量計費',
      summary: '考勤、假期與審批一站處理'
    },
    displayConfig: { features: ['舊功能'], summary: '舊摘要' }
  });
  assert.equal(adapted.packageKind, 'addon');
  assert.equal(adapted.billingMode, 'employee_month');
  assert.equal(adapted.count, 100);
  assert.equal(adapted.itemType, 2);
  assert.equal(adapted.subtitle, '適用於 HR 團隊');
  assert.equal(adapted.summary, '考勤、假期與審批一站處理');
  assert.equal(adapted.note, '按員工數量計費');
  assert.deepEqual(adapted.features, ['行政管理', '打卡管理']);
});

test('parses a serialized detail before adapting H5 package cards', () => {
  const catalog = buildPackageCatalog({
    data: [
      {
        ...plan,
        bizCode: 'hr',
        itemType: 2,
        detail: JSON.stringify({
          billingMode: 'employee_month',
          features: ['假期設定', '審批管理'],
          packageKind: 'addon',
          summary: '日常管理模塊'
        })
      }
    ]
  });
  const adapted = toPackageCardPlan(catalog.hr[0]);
  assert.equal(adapted.packageKind, 'addon');
  assert.equal(adapted.summary, '日常管理模塊');
  assert.deepEqual(adapted.features, ['假期設定', '審批管理']);
});

test('explicit values retain precedence, including zero prices and false recommendation', () => {
  const adapted = toPackageCardPlan({
    ...plan,
    originalPrice: 0,
    subtitle: '直接副標題',
    displayFeatures: [],
    displayConfig: { originalPrice: 200, isRecommended: true, subtitle: '配置副標題', features: ['配置功能'] }
  });
  assert.equal(adapted.originalPrice, 0);
  assert.equal(adapted.isRecommended, false);
  assert.equal(adapted.subtitle, '直接副標題');
  assert.deepEqual(adapted.features, []);
});

test('HR modules use the featured parent and retain nested names and serialized detail', () => {
  const catalog = buildPackageCatalog({
    data: [
      { ...plan, bizCode: 'hr', additionalItems: [{ itemName: '其他套餐模塊', itemType: 1, price: 10 }] },
      {
        ...plan,
        id: 2,
        bizCode: 'hr',
        detail: { packageKind: 'plan', isFeatured: true },
        additionalItems: [
          {
            bizCode: 'pms',
            itemName: '日常管理模塊',
            itemType: '1',
            price: 20,
            detail: JSON.stringify({ summary: '考勤與審批', features: ['打卡管理'], dataCount: 0 })
          },
          { itemName: '增加員工', itemType: 2, price: 100, detail: { dataCount: 8 } }
        ]
      }
    ]
  });
  const featured = getFeaturedHrPlan(catalog.hr);
  assert.equal(featured?.id, 2);
  const addons = featured?.additionalItems ?? [];
  assert.equal(addons.length, 2);
  assert.equal(addons[0].bizCode, 'hr');
  const permission = toAddonCardPlan(addons[0], 'hr');
  assert.equal(permission.packageName, '日常管理模塊');
  assert.equal(permission.packageKind, 'addon');
  assert.equal(permission.billingMode, 'employee_month');
  assert.equal(permission.count, undefined);
  assert.equal(permission.summary, '考勤與審批');
  assert.deepEqual(permission.features, ['打卡管理']);
  const quantity = toAddonCardPlan(addons[1], 'hr');
  assert.equal(quantity.count, 8);
  assert.equal(quantity.price, 100);
  assert.equal(getFeaturedHrPlan([]), undefined);
});

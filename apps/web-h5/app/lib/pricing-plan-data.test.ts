import assert from 'node:assert/strict';
import test from 'node:test';
import type { MenuType, Packages } from '@go-tech/types';
import { buildPricingData } from '../[locale]/pricing-plan/pricing-plan-data';

const menus: MenuType[] = [
  {
    children: [
      { desc: '已選功能', icon: 'check', id: 11, parentId: 1, title: '租約管理' },
      { desc: '舊字段功能', icon: 'minus', id: 12, parentId: 1, title: '賬單管理' }
    ],
    desc: '',
    icon: '',
    id: 1,
    parentId: 0,
    title: '管理功能'
  }
];

const plan = {
  additionalItems: [
    {
      detail: {
        dataCount: 10,
        features: ['行政管理', '打卡管理'],
        menu: [],
        packageKind: 'addon'
      },
      itemName: '日常管理模組',
      itemType: 2,
      price: 20
    }
  ],
  detail: {
    dataCount: 50,
    menu: [{ level: 1, menuIcon: 'check', menuId: 11, menuTitle: '租約管理' }],
    packageKind: 'plan'
  },
  id: 101,
  packageItemList: [{ level: 1, menuIcon: 'minus', menuId: 12, menuTitle: '賬單管理' }],
  packageName: '專業版',
  price: 100,
  unitCount: 999
} as Packages & { additionalItems: unknown[] };

test('builds feature availability exclusively from detail.menu', () => {
  const result = buildPricingData('pms', [plan], menus);
  assert.deepEqual(
    result.categories[0].features.map(feature => feature.plans),
    [[true], [false]]
  );
  assert.equal(result.plans[0].units, '50');
});

test('builds dynamic add-ons from additionalItems and their detail fields', () => {
  const result = buildPricingData('pms', [plan], menus);
  assert.deepEqual(result.addons, [
    {
      features: ['行政管理', '打卡管理'],
      key: '日常管理模組',
      name: '日常管理模組',
      prices: ['$200']
    }
  ]);
  assert.equal(result.plans[0].extra, '$200/10個');
});

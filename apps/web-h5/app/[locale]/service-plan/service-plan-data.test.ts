import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Packages } from '@go-tech/types';
import { buildServicePlans } from './service-plan-data';

const plan = (overrides: Partial<Packages> = {}): Packages => ({
  id: 1,
  packageName: '基礎版',
  price: 100,
  bizCode: 'pms',
  ...overrides
});

test('features 优先，新增功能只显示一次且不修改输入', () => {
  const plans = [
    plan({ detail: { features: ['合約'], dataCount: 10 } }),
    plan({ id: 2, price: 200, detail: { features: ['合約', '收租'], dataCount: 20 } })
  ];
  const before = structuredClone(plans);
  const result = buildServicePlans(plans);
  assert.deepEqual(
    result[0].newPackageItemList.map(item => item.menuTitle),
    ['合約']
  );
  assert.deepEqual(
    result[1].newPackageItemList.map(item => item.menuTitle),
    ['合約']
  );
  assert.deepEqual(
    result[1].newFeatures.map(item => item.label),
    ['收租']
  );
  assert.equal(result[1].upgradeNote, '(加$100從基礎版升級，增加10個單位)');
  assert.deepEqual(plans, before);
});

test('features 为空时使用菜单，过滤按钮并按 menuId 比较', () => {
  const menu = [
    { menuId: 1, menuTitle: '管理', menuIcon: 'settings', level: 1 },
    { menuId: 2, menuTitle: '新增', menuIcon: '', level: 2 }
  ];
  const result = buildServicePlans([
    plan({ detail: { menu } }),
    plan({ detail: { features: [], menu: [...menu, { ...menu[0], menuId: 3, menuTitle: '租客' }] } })
  ]);
  assert.equal(result[0].newPackageItemList.length, 1);
  assert.deepEqual(result[1].newFeatures, [{ label: '租客', icon: 'settings' }]);
});

test('完全不同的功能不会回填到已有功能；HR 使用员工数量', () => {
  const result = buildServicePlans([
    plan({ detail: { features: ['A'], dataCount: 10 } }),
    plan({ bizCode: 'hr', price: 200, detail: { features: ['B'], dataCount: 20 } })
  ]);
  assert.deepEqual(result[1].newPackageItemList, []);
  assert.match(result[1].upgradeNote ?? '', /增加10名員工/);
});

test('处理空套餐、缺失配置和数量减少', () => {
  assert.deepEqual(buildServicePlans([]), []);
  assert.deepEqual(buildServicePlans([plan()])[0].newPackageItemList, []);
  const result = buildServicePlans([
    plan({ detail: { dataCount: 10 } }),
    plan({ price: 200, detail: { dataCount: 5 } })
  ]);
  assert.equal(result[1].upgradeNote, '(加$100從基礎版升級)');
});

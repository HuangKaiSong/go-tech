import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getBillingLabel, getCapacityLabel, getPackageFeatures } from '@go-tech/package-ui/model';
import {
  buildPackagePayload,
  createPackageDraft,
  getMenuChecked,
  menuTreeSchema,
  parsePackage,
  splitFeatures,
  toPackageCardPlan,
  toggleMenuSelection
} from './package-model';
import type { MenuNode, PackageDraft } from './package-model';

const plan: PackageDraft = {
  ...createPackageDraft(),
  id: 7,
  itemType: 2,
  packageName: '標準套餐',
  price: 0,
  priceA: 90,
  priceB: 180,
  priceC: 365,
  detail: { dataCount: 50, originalPrice: 99, extraConfig: { enabled: true, quota: [1, 2] } }
};

const action: MenuNode = { children: [], id: 4, level: 3, title: '新增租約' };
const feature: MenuNode = { children: [action], id: 3, level: 2, title: '租約管理' };
const sibling: MenuNode = { children: [], id: 5, level: 2, title: '單位管理' };
const group: MenuNode = { children: [feature, sibling], id: 2, level: 1, title: '物業管理' };
const root: MenuNode = { children: [group], id: 1, level: 0, title: 'PMS' };
const tree = [root];

test('round-trips detail extensions without leaking display fields into the top level', () => {
  const loaded = parsePackage({ ...plan, id: '7', price: '0.00', detail: JSON.stringify(plan.detail) });
  const payload = buildPackagePayload({
    ...loaded,
    detail: {
      ...loaded.detail,
      dataCount: 100,
      originalPrice: undefined,
      features: splitFeatures('租約\n\n單位\n租約')
    }
  });
  const saved = JSON.parse(JSON.stringify(payload));
  assert.equal(payload.itemType, 2);
  assert.equal(payload.price, 0);
  assert.equal(payload.detail.dataCount, 100);
  assert.deepEqual(payload.detail.extraConfig, plan.detail.extraConfig);
  assert.deepEqual(payload.detail.features, ['租約', '單位']);
  assert.equal('originalPrice' in saved.detail, false);
  assert.equal('dataCount' in payload, false);
  assert.equal('menu' in payload, false);
  assert.equal('features' in payload, false);
});

test('new packages omit id and require complete, finite prices and integer capacity', () => {
  const draft = createPackageDraft();
  assert.throws(() => buildPackagePayload(draft));
  const payload = buildPackagePayload({ ...plan, id: undefined });
  assert.equal('id' in JSON.parse(JSON.stringify(payload)), false);
  for (const price of [undefined, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => buildPackagePayload({ ...plan, price }));
  }
  for (const dataCount of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => buildPackagePayload({ ...plan, detail: { dataCount } }), /數量.*非負整數/);
  }
  assert.equal(buildPackagePayload({ ...plan, detail: { dataCount: 0 } }).detail.dataCount, 0);
  assert.throws(() => parsePackage({ ...plan, detail: '{invalid-json' }));
  assert.throws(() => parsePackage({ ...plan, detail: { features: [123] } }));
});

test('allows omitted descriptions and normalizes null descriptions from the API', () => {
  const descriptions = { applyTo: '', summary: '', remind: '' };
  for (const detail of [{}, descriptions, { applyTo: null, summary: null, remind: null }]) {
    for (const raw of [detail, JSON.stringify(detail)]) {
      const loaded = parsePackage({ ...plan, detail: raw });
      const payload = buildPackagePayload(loaded);
      for (const key of ['applyTo', 'summary', 'remind'] as const) {
        assert.equal(loaded.detail[key], '');
        assert.equal(payload.detail[key], '');
      }
    }
  }
  assert.doesNotThrow(() => buildPackagePayload({ ...plan, detail: {} }));
});

test('saves and previews descriptions from detail without top-level fields', () => {
  const descriptions = { applyTo: '中小型企業', summary: '完整租務管理', remind: '價格未含附加單位費用' };
  const loaded = parsePackage({
    ...plan,
    applyTo: '舊適用人群',
    summary: '舊摘要',
    remind: '舊提示',
    detail: JSON.stringify({ ...plan.detail, ...descriptions })
  });
  const payload = buildPackagePayload(loaded);
  for (const key of ['applyTo', 'summary', 'remind'] as const) {
    assert.equal(payload.detail[key], descriptions[key]);
    assert.equal(key in payload, false);
  }
  const preview = toPackageCardPlan(payload);
  assert.equal(preview.subtitle, descriptions.applyTo);
  assert.equal(preview.summary, descriptions.summary);
  assert.equal(preview.note, descriptions.remind);
});

test('reports the actual invalid detail field instead of a generic capacity error', () => {
  const fields = [
    { key: 'applyTo', label: '適用人群' },
    { key: 'summary', label: '套餐摘要' },
    { key: 'remind', label: '溫馨提示' }
  ] as const;
  for (const { key, label } of fields) {
    assert.doesNotThrow(() => buildPackagePayload({ ...plan, detail: { [key]: '字'.repeat(120) } }));
    assert.throws(() => buildPackagePayload({ ...plan, detail: { [key]: '字'.repeat(121) } }), {
      message: `${label}必須為不超過 120 字的文字`
    });
  }
  assert.throws(() => buildPackagePayload({ ...plan, detail: { originalPrice: -1 } }), /劃線原價.*非負金額/);
});

test('normalizes the current numeric detail fields before saving', () => {
  const loaded = parsePackage({ ...plan, detail: { dataCount: '50' } });
  const payload = buildPackagePayload(loaded);
  assert.equal(payload.detail.dataCount, 50);
});

test('keeps the existing addon fields and fills parent relationships in each addon menu', () => {
  const loaded = parsePackage({
    ...plan,
    additionalItems: [
      {
        bizCode: 'hr',
        itemName: '增加租約額度',
        itemType: '3',
        price: '12.50',
        detail: {
          dataCount: '4',
          features: ['行政管理', '打卡管理'],
          menu: [
            { menuId: '1', menuTitle: root.title, level: 0 },
            { menuId: '2', menuTitle: group.title, level: 1 },
            { menuId: '3', menuTitle: feature.title, level: 2 },
            { menuId: '4', menuTitle: action.title, level: 3 }
          ],
          addonMeta: '保留',
          summary: '考勤、假期與審批一站處理'
        },
        backendMeta: { enabled: true }
      }
    ]
  });
  assert.equal(loaded.additionalItems[0].bizCode, 'pms');
  const payload = buildPackagePayload(loaded, tree);
  assert.deepEqual(
    payload.additionalItems[0].detail.menu.map(({ menuId, parentId }) => [menuId, parentId]),
    [
      [1, null],
      [2, 1],
      [3, 2],
      [4, 3]
    ]
  );
  assert.equal(payload.additionalItems[0].itemName, '增加租約額度');
  assert.equal(payload.additionalItems[0].bizCode, payload.bizCode);
  assert.equal(payload.additionalItems[0].itemType, 3);
  assert.equal(payload.additionalItems[0].detail.dataCount, 4);
  assert.equal(payload.additionalItems[0].price, 12.5);
  assert.deepEqual(payload.additionalItems[0].detail.features, ['行政管理', '打卡管理']);
  assert.equal(payload.additionalItems[0].detail.summary, '考勤、假期與審批一站處理');
  assert.equal(payload.additionalItems[0].detail.addonMeta, '保留');
  assert.deepEqual(payload.additionalItems[0].backendMeta, { enabled: true });
  assert.equal('amount' in payload.additionalItems[0], false);
  assert.equal('total' in payload.additionalItems[0], false);
});

test('validates addon name, quantity and price through their existing fields', () => {
  const addon = { itemName: '額外功能', itemType: 2, price: 10, detail: { dataCount: 2, menu: [] } };
  const payload = buildPackagePayload({ ...plan, additionalItems: [addon] });
  assert.equal(payload.additionalItems[0].bizCode, plan.bizCode);
  assert.throws(() => buildPackagePayload({ ...plan, additionalItems: [{ ...addon, itemName: '' }] }), /功能名稱/);
  assert.throws(
    () => buildPackagePayload({ ...plan, additionalItems: [{ ...addon, detail: { dataCount: 1.5, menu: [] } }] }),
    /數量.*非負整數/
  );
  assert.throws(() => buildPackagePayload({ ...plan, additionalItems: [{ ...addon, price: -1 }] }), /單價.*非負金額/);
});

test('uses itemType to control addon quantity and menu requirements', () => {
  const selectedMenu = [
    { menuId: 1, menuTitle: root.title, level: 0 },
    { menuId: 2, menuTitle: group.title, level: 1 },
    { menuId: 3, menuTitle: feature.title, level: 2 }
  ];
  const permission = buildPackagePayload(
    {
      ...plan,
      additionalItems: [{ itemName: '權限功能', itemType: 1, price: 20, detail: { dataCount: 9, menu: selectedMenu } }]
    },
    tree
  ).additionalItems[0];
  assert.equal(permission.detail.dataCount, 0);
  assert.equal(permission.detail.menu.length, 3);

  const quantity = buildPackagePayload(
    {
      ...plan,
      additionalItems: [{ itemName: '數量功能', itemType: 2, price: 20, detail: { dataCount: 9, menu: selectedMenu } }]
    },
    tree
  ).additionalItems[0];
  assert.equal(quantity.detail.dataCount, 9);
  assert.deepEqual(quantity.detail.menu, []);

  const combined = buildPackagePayload(
    {
      ...plan,
      additionalItems: [{ itemName: '混合功能', itemType: 3, price: 20, detail: { dataCount: 9, menu: selectedMenu } }]
    },
    tree
  ).additionalItems[0];
  assert.equal(combined.detail.dataCount, 9);
  assert.equal(combined.detail.menu.length, 3);

  for (const itemType of [1, 3]) {
    assert.throws(
      () =>
        buildPackagePayload({
          ...plan,
          additionalItems: [{ itemName: '缺少菜單', itemType, price: 20, detail: { dataCount: 1, menu: [] } }]
        }),
      /綁定功能/
    );
  }
  assert.throws(
    () =>
      buildPackagePayload({
        ...plan,
        additionalItems: [{ itemName: '未知類型', itemType: 4, price: 20, detail: { dataCount: 1, menu: [] } }]
      }),
    /功能類型/
  );
});

test('normalizes menu identifiers before matching saved selections', () => {
  const parsed = menuTreeSchema.parse([{ id: '4', title: action.title, level: '3', children: null }]);
  const loaded = parsePackage({ ...plan, detail: { menu: [{ menuId: '4', menuTitle: action.title, level: 3 }] } });
  assert.equal(getMenuChecked(parsed[0], new Set(loaded.detail.menu?.map(item => item.menuId))), true);
});

test('selects and clears every descendant, including deeply nested actions', () => {
  const selected = toggleMenuSelection({ tree, current: [], target: root, checked: true });
  assert.deepEqual(
    selected.map(item => item.menuId).toSorted((left, right) => left - right),
    [1, 2, 3, 4, 5]
  );
  assert.equal(getMenuChecked(root, new Set(selected.map(item => item.menuId))), true);
  assert.deepEqual(
    selected.map(({ menuId, parentId }) => [menuId, parentId]),
    [
      [1, null],
      [2, 1],
      [3, 2],
      [4, 3],
      [5, 2]
    ]
  );
  assert.deepEqual(toggleMenuSelection({ tree, current: selected, target: root, checked: false }), []);
});

test('fills parent relationships when saving an untouched legacy selection', () => {
  const menu = [
    { menuId: 4, menuTitle: action.title, level: 3, isHighlight: true, permissions: ['create'] },
    { menuId: 1, menuTitle: root.title, level: 0 },
    { menuId: 3, menuTitle: feature.title, level: 2, parentId: 999, sortOrder: 7 },
    { menuId: 2, menuTitle: group.title, level: 1 }
  ];
  const loaded = parsePackage({ ...plan, detail: { ...plan.detail, menu } });
  const payload = buildPackagePayload(loaded, tree);
  assert.deepEqual(
    payload.detail.menu?.map(({ menuId, parentId }) => [menuId, parentId]),
    [
      [4, 3],
      [1, null],
      [3, 2],
      [2, 1]
    ]
  );
  assert.equal(
    payload.detail.menu?.some(item => item.menuId === sibling.id),
    false
  );
  assert.equal(payload.detail.menu?.[0].isHighlight, true);
  assert.deepEqual(payload.detail.menu?.[0].permissions, ['create']);
  assert.equal(payload.detail.menu?.[2].sortOrder, 7);
  assert.equal(loaded.detail.menu?.[0].parentId, undefined);
  assert.equal(loaded.detail.menu?.[2].parentId, 999);
  assert.deepEqual(getPackageFeatures(toPackageCardPlan(payload)), [action.title]);
  const reloaded = parsePackage(JSON.parse(JSON.stringify(payload)));
  assert.deepEqual(reloaded.detail.menu, payload.detail.menu);
  assert.equal(getMenuChecked(feature, new Set(reloaded.detail.menu?.map(item => item.menuId))), true);
});

test('distinguishes parents at the same level across multiple roots, including id zero', () => {
  const firstRoot: MenuNode = {
    children: [{ children: [], id: 10, level: 1, title: '新增' }],
    id: 0,
    level: 0,
    title: '管理層'
  };
  const secondRoot: MenuNode = {
    children: [{ children: [], id: 20, level: 1, title: '新增' }],
    id: 8,
    level: 0,
    title: '業務層'
  };
  const roots = [firstRoot, secondRoot];
  const first = toggleMenuSelection({ tree: roots, current: [], target: firstRoot, checked: true });
  const selected = toggleMenuSelection({ tree: roots, current: first, target: secondRoot, checked: true });
  assert.deepEqual(
    selected.map(({ menuId, parentId }) => [menuId, parentId]),
    [
      [0, null],
      [10, 0],
      [8, null],
      [20, 8]
    ]
  );
  assert.deepEqual(
    toggleMenuSelection({ tree: roots, current: selected, target: firstRoot, checked: false }),
    selected.filter(item => item.menuId === 8 || item.menuId === 20)
  );
});

test('normalizes and validates saved parent identifiers while accepting legacy snapshots', () => {
  const menuItem = { menuId: '4', menuTitle: action.title, level: 3 };
  for (const [raw, expected] of [
    ['3', 3],
    [0, 0],
    [null, null],
    [undefined, undefined]
  ] as const) {
    const loaded = parsePackage({ ...plan, detail: { menu: [{ ...menuItem, parentId: raw }] } });
    assert.equal(loaded.detail.menu?.[0].parentId, expected);
    assert.equal(buildPackagePayload(loaded).detail.menu?.[0].parentId, expected);
  }
  for (const parentId of [-1, 1.5, 'invalid']) {
    assert.throws(() => parsePackage({ ...plan, detail: { menu: [{ ...menuItem, parentId }] } }));
  }
});

test('preserves historical relationships absent from the current menu tree without inventing roots', () => {
  const historical = { menuId: 99, menuTitle: '歷史功能', level: 1, parentId: 98 };
  const legacy = { menuId: 100, menuTitle: '舊版功能', level: 1 };
  const payload = buildPackagePayload({ ...plan, detail: { menu: [historical, legacy] } }, tree);
  const saved = JSON.parse(JSON.stringify(payload));
  assert.deepEqual(saved.detail.menu, [historical, legacy]);
});

test('updates ancestors and partial selection when toggling the last action', () => {
  const selected = toggleMenuSelection({ tree, current: [], target: action, checked: true });
  assert.deepEqual(new Set(selected.map(item => item.menuId)), new Set([1, 2, 3, 4]));
  assert.equal(getMenuChecked(root, new Set(selected.map(item => item.menuId))), 'indeterminate');
  assert.deepEqual(toggleMenuSelection({ tree, current: selected, target: action, checked: false }), []);
});

test('preserves sibling metadata and saved menus absent from the fetched tree', () => {
  const current = [
    {
      menuId: 5,
      menuTitle: '單位管理',
      level: 2,
      menuIcon: 'home',
      sortOrder: 9,
      isHighlight: true,
      permissions: ['read']
    },
    { menuId: 99, menuTitle: '歷史功能', level: 1 }
  ];
  const selected = toggleMenuSelection({ tree, current, target: action, checked: true });
  assert.deepEqual(
    selected.find(item => item.menuId === 5),
    { ...current[0], parentId: group.id }
  );
  assert.deepEqual(
    selected.find(item => item.menuId === 99),
    current[1]
  );
  const cleared = toggleMenuSelection({ tree, current: selected, target: feature, checked: false });
  assert.deepEqual(new Set(cleared.map(item => item.menuId)), new Set([1, 2, 5, 99]));
  assert.deepEqual(
    current.map(item => item.menuId),
    [5, 99]
  );
});

test('matches H5 feature priority, ordering, deduplication and the six-item fallback', () => {
  const menu = Array.from({ length: 8 }, (_value, index) => ({ menuId: index, menuTitle: `功能${index}`, level: 1 }));
  assert.equal(getPackageFeatures({ menu }).length, 6);
  const highlights = [
    ...menu,
    { menuId: 9, menuTitle: '重點B', level: 1, isHighlight: true, sortOrder: 2 },
    { menuId: 10, menuTitle: '重點A', level: 1, isHighlight: true, sortOrder: 1 }
  ];
  assert.deepEqual(getPackageFeatures({ menu: highlights }), ['重點A', '重點B']);
  assert.deepEqual(getPackageFeatures({ menu: highlights, features: ['自訂賣點'] }), ['自訂賣點']);
  assert.equal(highlights[0].menuId, 0);
});

test('uses detail billing and capacity labels for both products', () => {
  assert.equal(getBillingLabel({ billingMode: 'employee_month' }), '每名員工 / 月');
  assert.equal(getBillingLabel({ billingMode: 'month', billingLabel: '每季付款' }), '每季付款');
  assert.equal(getCapacityLabel(toPackageCardPlan(plan), plan.bizCode), '最多 50 個物業單位');
  assert.equal(getCapacityLabel(toPackageCardPlan(plan), 'hr'), '包含 50 名員工');
  assert.equal(
    getCapacityLabel(
      toPackageCardPlan({ ...plan, detail: { dataCount: 50, capacityLabel: '不限數量' } }),
      plan.bizCode
    ),
    '不限數量'
  );
});

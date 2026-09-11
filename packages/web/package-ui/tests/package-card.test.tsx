import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { test } from 'vitest';
import { PackageCard } from '../src/index';
import type { PackageLinkProps, PackageTextProps } from '../src/index';
import { formatPackagePrice, getAddonBillingLabel, getPackageFeatures } from '../src/model';
import type { PackageCardPlan } from '../src/model';

const plan: PackageCardPlan = {
  addUnitPrice: 8,
  billingMode: 'employee_month',
  count: 50,
  features: ['租約管理', '單位管理'],
  itemType: 2,
  note: '港幣計價',
  originalPrice: 2000,
  packageName: '基礎套餐',
  price: 1200.5,
  subtitle: '中小型團隊',
  summary: '完整業務流程'
};

const Text = ({ text }: PackageTextProps) => <span data-translated>{text}</span>;
const Link = ({ children, href, ...props }: PackageLinkProps) => (
  <a {...props} href={`/zh-TW${href}`}>
    {children}
  </a>
);

test('customer and preview cards share content and layout while only navigation differs', () => {
  const live = renderToStaticMarkup(<PackageCard product="pms" plan={plan} />);
  const preview = renderToStaticMarkup(<PackageCard product="pms" plan={plan} preview />);
  for (const content of ['1,200.5', 'HK$ 2,000', '每名員工 / 月', '最多 50 個物業單位', '租約管理', '港幣計價']) {
    assert.ok(live.includes(content));
    assert.ok(preview.includes(content));
  }
  assert.ok(live.includes('href="/service-plan?product=pms"'));
  assert.ok(!preview.includes('href='));
  assert.ok(preview.includes('aria-disabled="true"'));
  assert.equal(live.split('<a ')[0], preview.split('<button ')[0]);
});

test('HR base and addon variants use shared pricing and feature rendering', () => {
  const base = renderToStaticMarkup(<PackageCard product="hr" plan={plan} />);
  assert.ok(base.includes('必選基礎套餐'));
  assert.ok(base.includes('包含 50 名員工'));
  assert.ok(base.includes('超額員工 / 月'));
  assert.ok(base.includes('href="/service-plan?product=hr"'));
  const addon = renderToStaticMarkup(<PackageCard product="hr" plan={{ ...plan, packageKind: 'addon' }} preview />);
  assert.ok(addon.includes('+$1,200.5'));
  assert.ok(addon.includes('HKD / 50名員工 / 月'));
  assert.ok(addon.includes('完整業務流程'));
  assert.ok(addon.includes('租約管理'));
  assert.ok(!addon.includes('必選基礎套餐'));
  assert.ok(!addon.includes('href='));
});

test('PMS addons use the same compact addon card without a plan action', () => {
  const addon = renderToStaticMarkup(
    <PackageCard product="pms" plan={{ ...plan, billingMode: 'unit_month', packageKind: 'addon' }} preview />
  );
  assert.ok(addon.includes('+$1,200.5'));
  assert.ok(addon.includes('HKD / 50個單位 / 月'));
  assert.ok(addon.includes('租約管理'));
  assert.ok(!addon.includes('了解此方案'));
});

test('addon quantity labels follow itemType without changing saved fields', () => {
  assert.equal(getAddonBillingLabel({ billingMode: 'unit_month', count: 8, itemType: 2 }), '8個單位 / 月');
  assert.equal(getAddonBillingLabel({ billingMode: 'employee_month', count: 12, itemType: 3 }), '12名員工 / 月');
  assert.equal(getAddonBillingLabel({ billingMode: 'unit_month', count: 8, itemType: 1 }), '每個單位 / 月');
});

test('hosts can supply translation and navigation without Next.js dependencies', () => {
  const html = renderToStaticMarkup(<PackageCard plan={plan} product="hr" TextComponent={Text} LinkComponent={Link} />);
  assert.ok(html.includes('data-translated="true"'));
  assert.ok(html.includes('href="/zh-TW/service-plan?product=hr"'));
  assert.ok(!html.includes('<button'));
});

test('preserves zero pricing and prioritizes explicit features over sorted menu highlights', () => {
  assert.equal(formatPackagePrice(0), '0');
  assert.equal(formatPackagePrice(undefined), null);
  assert.equal(formatPackagePrice(Number.NaN), null);
  const menu = [
    { menuId: 1, menuTitle: '普通功能' },
    { menuId: 2, menuTitle: '重點B', isHighlight: true, sortOrder: 2 },
    { menuId: 3, menuTitle: '重點A', isHighlight: true, sortOrder: 1 }
  ];
  assert.deepEqual(getPackageFeatures({ menu }), ['重點A', '重點B']);
  assert.deepEqual(getPackageFeatures({ menu, features: ['自訂功能'] }), ['自訂功能']);
});

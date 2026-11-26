import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import type { PackageAddonItem } from '@/mocks/packages';
import { PackageAddonsEditor } from './package-addons-editor';
import { buildPackagePayload, createPackageDraft, parsePackage } from './package-model';
import { PackagePreview } from './package-preview';

afterEach(cleanup);

test('sets, reloads and clears custom billing copy in the addon editor and live preview', () => {
  const onChange = vi.fn<(values: PackageAddonItem[]) => void>();
  const plan = { ...createPackageDraft(), packageName: '標準套餐', price: 100, priceA: 90, priceB: 180, priceC: 365 };
  const view = (additionalItems: PackageAddonItem[]) => (
    <>
      <PackageAddonsEditor additionalItems={additionalItems} onChange={onChange} product="pms" tree={[]} />
      <PackagePreview plan={{ ...plan, additionalItems }} />
    </>
  );
  const { rerender } = render(view([]));
  fireEvent.click(screen.getByRole('button', { name: '新增附加功能' }));
  const dialog = within(screen.getByRole('dialog'));
  fireEvent.change(dialog.getByRole('textbox', { name: '功能名稱' }), { target: { value: '額外單位' } });
  fireEvent.change(dialog.getByRole('textbox', { name: '自訂計費說明' }), { target: { value: ' 每組 / 季 ' } });
  expect(dialog.getByRole('status')).toHaveTextContent('HKD / 每組 / 季');
  fireEvent.click(dialog.getByRole('button', { name: '保存' }));

  const saved = buildPackagePayload({ ...plan, additionalItems: onChange.mock.calls[0][0] });
  const reloaded = parsePackage(JSON.parse(JSON.stringify(saved)));
  expect(reloaded.additionalItems[0].detail.billingLabel).toBe('每組 / 季');
  rerender(view(reloaded.additionalItems));
  expect(screen.getAllByText('HKD / 每組 / 季')).toHaveLength(2);
  expect(screen.getByRole('button', { name: '選擇基礎版並加購模組' })).toBeDisabled();

  fireEvent.click(screen.getByRole('button', { name: '編輯 額外單位' }));
  const edit = within(screen.getByRole('dialog'));
  const billingLabel = edit.getByRole('textbox', { name: '自訂計費說明' });
  expect(billingLabel).toHaveValue('每組 / 季');
  fireEvent.change(billingLabel, { target: { value: '' } });
  expect(edit.getByRole('status')).toHaveTextContent('HKD / 每個單位 / 月');
  fireEvent.click(edit.getByRole('button', { name: '保存' }));
  rerender(view(onChange.mock.calls[1][0]));
  expect(screen.getAllByText('HKD / 每個單位 / 月')).toHaveLength(2);
});

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

test('edits and saves a capacity addon with a consistent unit label', () => {
  const addon: PackageAddonItem = {
    itemName: '額外資源',
    itemType: 5,
    price: 1.25,
    detail: { dataCount: 10, menu: [] }
  };
  const onChange = vi.fn();
  const { rerender } = render(
    <PackageAddonsEditor additionalItems={[addon]} onChange={onChange} product="hr" tree={[]} />
  );
  expect(screen.getByText('HKD / 10GB / 月')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '編輯 額外資源' }));
  const dialog = within(screen.getByRole('dialog'));
  expect(dialog.getByRole('status').textContent).toContain('10GB / 月');
  const quantity = dialog.getByRole('spinbutton', { name: '數量' });
  fireEvent.change(quantity, { target: { value: '0' } });
  expect(dialog.getByRole('status').textContent).toContain('每GB / 月');
  fireEvent.change(quantity, { target: { value: '20' } });
  expect(dialog.getByRole('status').textContent).toContain('20GB / 月');
  fireEvent.click(dialog.getByRole('button', { name: '保存' }));
  expect(onChange).toHaveBeenCalledWith([
    expect.objectContaining({ itemType: 5, price: 1.25, detail: expect.objectContaining({ dataCount: 20 }) })
  ]);
  rerender(
    <PackageAddonsEditor
      additionalItems={[{ ...addon, detail: { ...addon.detail, dataCount: 20 } }]}
      onChange={onChange}
      product="hr"
      tree={[]}
    />
  );
  expect(screen.getByText('HKD / 20GB / 月')).toBeTruthy();
});

test('shows the total entry count and saves the individual counts and their sum', () => {
  const addon: PackageAddonItem = {
    itemName: '額外条目',
    itemType: 4,
    price: 1.25,
    detail: { dataCount: 100, customerCount: 2, consultCount: 3, contractCount: 5, followCount: 7, invoiceCount: 11 }
  };
  const onChange = vi.fn<(values: PackageAddonItem[]) => void>();
  const { rerender } = render(
    <PackageAddonsEditor additionalItems={[addon]} onChange={onChange} product="pms" tree={[]} />
  );
  expect(screen.getByText('HKD / 28条 / 月')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '編輯 額外条目' }));
  const dialog = within(screen.getByRole('dialog'));
  expect(dialog.getByRole('status').textContent).toContain('28条 / 月');

  const count = dialog.getByRole('spinbutton', { name: '客户条目数量' });
  expect(count).toHaveValue(2);
  fireEvent.change(count, { target: { value: '-1' } });
  fireEvent.click(dialog.getByRole('button', { name: '保存' }));
  expect(dialog.getByRole('alert')).toHaveTextContent('客户条目数量必須為有效的非負整數');
  expect(onChange).not.toHaveBeenCalled();

  fireEvent.change(count, { target: { value: '12' } });
  expect(dialog.getByRole('status').textContent).toContain('38条 / 月');
  fireEvent.click(dialog.getByRole('button', { name: '保存' }));
  const savedAddons = onChange.mock.calls[0]?.[0] ?? [];
  expect(savedAddons[0]?.detail).toMatchObject({
    dataCount: 38,
    customerCount: 12,
    consultCount: 3,
    contractCount: 5,
    followCount: 7,
    invoiceCount: 11
  });
  rerender(<PackageAddonsEditor additionalItems={savedAddons} onChange={onChange} product="pms" tree={[]} />);
  expect(screen.getByText('HKD / 38条 / 月')).toBeTruthy();
});

test('keeps the legacy total when an entry addon has no individual counts', () => {
  const addon: PackageAddonItem = {
    itemName: '額外条目',
    itemType: 4,
    price: 1.25,
    detail: { dataCount: 10 }
  };
  const onChange = vi.fn();
  render(<PackageAddonsEditor additionalItems={[addon]} onChange={onChange} product="pms" tree={[]} />);
  expect(screen.getByText('HKD / 10条 / 月')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '編輯 額外条目' }));
  const dialog = within(screen.getByRole('dialog'));
  expect(dialog.getByRole('status').textContent).toContain('10条 / 月');
  fireEvent.click(dialog.getByRole('button', { name: '保存' }));
  expect(onChange).toHaveBeenCalledWith([
    expect.objectContaining({ detail: expect.objectContaining({ dataCount: 10 }) })
  ]);
});

test('creates an entry addon with only the configured counts', () => {
  const scrollIntoView = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView');
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() });
  try {
    const onChange = vi.fn();
    render(<PackageAddonsEditor additionalItems={[]} onChange={onChange} product="pms" tree={[]} />);
    fireEvent.click(screen.getByRole('button', { name: '新增附加功能' }));
    const dialog = within(screen.getByRole('dialog'));
    fireEvent.change(dialog.getByRole('textbox', { name: '功能名稱' }), { target: { value: '額外条目' } });
    fireEvent.keyDown(dialog.getByRole('combobox', { name: '功能類型' }), { key: 'Enter' });
    fireEvent.click(screen.getByRole('option', { name: '条目' }));

    fireEvent.change(dialog.getByRole('spinbutton', { name: '跟进单条目数量' }), { target: { value: '4' } });
    fireEvent.change(dialog.getByRole('spinbutton', { name: '发票条目数量' }), { target: { value: '0' } });
    expect(dialog.getByRole('status')).toHaveTextContent('4条 / 月');
    fireEvent.click(dialog.getByRole('button', { name: '保存' }));
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({
        itemType: 4,
        detail: expect.objectContaining({ dataCount: 4, followCount: 4, invoiceCount: 0 })
      })
    ]);
  } finally {
    if (scrollIntoView) Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', scrollIntoView);
    else Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  }
});

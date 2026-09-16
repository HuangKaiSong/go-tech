import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea
} from '@go-tech-frontend/ui';
import { PackageCard } from '@go-tech/package-ui';
import { formatPackagePrice, getAddonBillingLabel } from '@go-tech/package-ui/model';
import type { PackageBizCode } from '@go-tech/types';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import type { PackageAddonItem } from '@/mocks/packages';
import { NumberField } from './package-fields';
import { PackageMenuEditor } from './package-menu-editor';
import { splitFeatures } from './package-model';
import type { MenuNode } from './package-model';

type AddonFormValue = {
  bizCode?: PackageBizCode;
  detail: PackageAddonItem['detail'];
  id?: number;
  itemName: string;
  itemType: string;
  price: number;
};

const createAddon = (): AddonFormValue => ({
  detail: { dataCount: 0, features: [], menu: [], packageKind: 'addon', summary: '' },
  itemName: '',
  itemType: '2',
  price: 0
});

const usesMenu = (itemType: number | string) =>
  itemType === 1 || itemType === 3 || itemType === '1' || itemType === '3';
const usesQuantity = (itemType: number | string) =>
  itemType === 2 || itemType === 3 || itemType === '2' || itemType === '3';
const addonItemTypes = new Set([1, 2, 3]);

const getAmount = (dataCount: number, price: number) => {
  if (!Number.isSafeInteger(dataCount) || dataCount < 0 || !Number.isFinite(price) || price < 0) return null;
  const cents = dataCount * Math.round(price * 100);
  return Number.isSafeInteger(cents) ? cents / 100 : null;
};

const getAddonFormError = (formValue: AddonFormValue, itemName: string, itemType: number) => {
  const requiresQuantity = usesQuantity(itemType);
  const requiresMenu = usesMenu(itemType);
  const { dataCount } = formValue.detail;
  if (!itemName) return '請輸入功能名稱';
  if (itemName.length > 30) return '功能名稱不可超過 30 字';
  if (!addonItemTypes.has(itemType)) return '請選擇有效的功能類型';
  if (requiresQuantity) {
    if (!Number.isSafeInteger(dataCount) || dataCount < 0) return '數量必須為非負整數';
  }
  if (requiresMenu && !formValue.detail.menu?.length) return '請至少綁定一項菜單';
  if (!Number.isFinite(formValue.price) || formValue.price < 0) return '價格必須為有效的非負金額';
  if (Math.abs(formValue.price * 100 - Math.round(formValue.price * 100)) > 0.000001) {
    return '價格最多保留兩位小數';
  }
  if (requiresQuantity && getAmount(dataCount, formValue.price) === null) return '數量與價格的計算結果過大';
  return null;
};

const parseAddonFormValue = (
  formValue: AddonFormValue,
  featuresText: string,
  bizCode: PackageBizCode
): { error: string } | { value: PackageAddonItem } => {
  const itemName = formValue.itemName.trim();
  const itemType = Number(formValue.itemType);
  const { dataCount } = formValue.detail;
  const error = getAddonFormError(formValue, itemName, itemType);
  if (error) return { error };
  return {
    value: {
      ...formValue,
      bizCode,
      detail: {
        ...formValue.detail,
        dataCount: usesQuantity(itemType) ? dataCount : 0,
        features: splitFeatures(featuresText),
        menu: usesMenu(itemType) ? (formValue.detail.menu ?? []) : [],
        packageKind: 'addon',
        summary: formValue.detail.summary?.trim() ?? ''
      },
      itemName,
      itemType
    }
  };
};

export function PackageAddonsEditor({
  additionalItems,
  onChange,
  product,
  tree
}: {
  additionalItems: PackageAddonItem[];
  onChange: (values: PackageAddonItem[]) => void;
  product: PackageBizCode;
  tree: MenuNode[];
}) {
  console.log(additionalItems);

  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formValue, setFormValue] = useState<AddonFormValue>(createAddon);
  const [featuresText, setFeaturesText] = useState('');
  const [error, setError] = useState('');
  const fieldPrefix = useId();

  const closeDialog = () => {
    setOpen(false);
    setEditingIndex(null);
    setFormValue(createAddon());
    setFeaturesText('');
    setError('');
  };

  const startCreate = () => {
    setEditingIndex(null);
    setFormValue(createAddon());
    setFeaturesText('');
    setError('');
    setOpen(true);
  };

  const startEdit = (index: number) => {
    const addon = additionalItems[index];
    setEditingIndex(index);
    setFormValue({
      ...addon,
      detail: { ...addon.detail, menu: [...(addon.detail.menu ?? [])] },
      itemType: String(addon.itemType)
    });
    setFeaturesText(addon.detail.features?.join('\n') ?? '');
    setError('');
    setOpen(true);
  };

  const handleSave = () => {
    const result = parseAddonFormValue(formValue, featuresText, product);
    if ('error' in result) return setError(result.error);
    onChange(
      editingIndex === null
        ? [...additionalItems, result.value]
        : additionalItems.map((addon, index) => (index === editingIndex ? result.value : addon))
    );
    closeDialog();
  };

  return (
    <div className="space-y-3">
      {additionalItems.map((addon, index) => {
        return (
          <article key={addon.id ?? `${addon.itemName}-${index}`} aria-label={addon.itemName} className="min-w-0">
            <PackageCard
              product={product}
              preview
              plan={{
                billingMode: addon.detail.billingMode ?? (product === 'hr' ? 'employee_month' : 'unit_month'),
                count: usesQuantity(addon.itemType) ? addon.detail.dataCount : undefined,
                features: addon.detail.features,
                itemType: addon.itemType,
                menu: addon.detail.menu,
                packageKind: 'addon',
                packageName: addon.itemName,
                price: addon.price,
                summary: addon.detail.summary
              }}
              addonActions={
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-card/90"
                    aria-label={`編輯 ${addon.itemName}`}
                    onClick={() => startEdit(index)}
                  >
                    <Pencil aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-card/90 text-destructive"
                    aria-label={`刪除 ${addon.itemName}`}
                    onClick={() => onChange(additionalItems.filter((_item, itemIndex) => itemIndex !== index))}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </>
              }
            />
          </article>
        );
      })}

      <Button type="button" variant="outline" className="h-14 w-full border-dashed text-primary" onClick={startCreate}>
        <Plus aria-hidden="true" />
        新增附加功能
      </Button>

      <Dialog open={open} onOpenChange={nextOpen => (nextOpen ? setOpen(true) : closeDialog())}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingIndex === null ? '新增附加功能' : '編輯附加功能'}</DialogTitle>
            <DialogDescription>設定名稱、摘要、展示賣點、類型、綁定菜單、數量與價格</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label htmlFor={`${fieldPrefix}-name`} className="text-xs text-muted-foreground">
                功能名稱
              </label>
              <Input
                id={`${fieldPrefix}-name`}
                maxLength={30}
                required
                value={formValue.itemName}
                onChange={event => {
                  setFormValue(previous => ({ ...previous, itemName: event.target.value }));
                  setError('');
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor={`${fieldPrefix}-summary`} className="text-xs text-muted-foreground">
                摘要
              </label>
              <Textarea
                id={`${fieldPrefix}-summary`}
                maxLength={120}
                rows={2}
                value={formValue.detail.summary ?? ''}
                onChange={event => {
                  setFormValue(previous => ({
                    ...previous,
                    detail: { ...previous.detail, summary: event.target.value }
                  }));
                  setError('');
                }}
                placeholder="例如：考勤、假期與審批一站處理"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor={`${fieldPrefix}-features`} className="text-xs text-muted-foreground">
                展示賣點（每行一項）
              </label>
              <Textarea
                id={`${fieldPrefix}-features`}
                rows={4}
                value={featuresText}
                onChange={event => {
                  setFeaturesText(event.target.value);
                  setError('');
                }}
                placeholder={'行政管理\n打卡管理\n假期設定'}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor={`${fieldPrefix}-type`} className="text-xs text-muted-foreground">
                功能類型
              </label>
              <Select
                value={formValue.itemType}
                onValueChange={value => {
                  setFormValue(previous => ({ ...previous, itemType: value }));
                  setError('');
                }}
              >
                <SelectTrigger id={`${fieldPrefix}-type`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">權限</SelectItem>
                  <SelectItem value="2">數量</SelectItem>
                  <SelectItem value="3">權限／數量</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className={usesQuantity(formValue.itemType) ? 'grid grid-cols-2 gap-4' : undefined}>
              {usesQuantity(formValue.itemType) && (
                <NumberField
                  id={`${fieldPrefix}-count`}
                  label="數量"
                  required
                  value={formValue.detail.dataCount}
                  onChange={value => {
                    setFormValue(previous => ({
                      ...previous,
                      detail: { ...previous.detail, dataCount: value ?? 0 }
                    }));
                    setError('');
                  }}
                />
              )}
              <NumberField
                id={`${fieldPrefix}-price`}
                label={usesQuantity(formValue.itemType) ? '單價' : '價格'}
                required
                price
                value={formValue.price}
                onChange={value => {
                  setFormValue(previous => ({ ...previous, price: value ?? 0 }));
                  setError('');
                }}
              />
            </div>
            {usesQuantity(formValue.itemType) && (
              <div className="flex items-center justify-between rounded-lg bg-primary/5 px-4 py-3 text-sm">
                <output aria-live="polite" className="font-semibold tabular-nums text-primary">
                  + ${formatPackagePrice(formValue.price)} HKD /{' '}
                  {getAddonBillingLabel({
                    billingMode: formValue.bizCode === 'hr' ? 'employee_month' : 'unit_month',
                    itemType: Number.parseInt(formValue.itemType, 10),
                    count: formValue.detail.dataCount
                  })}
                </output>
              </div>
            )}
            {usesMenu(formValue.itemType) && (
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium">綁定菜單</p>
                  <p className="text-xs text-muted-foreground">選擇此附加功能包含的菜單與操作</p>
                </div>
                {tree.length ? (
                  <PackageMenuEditor
                    menu={formValue.detail.menu ?? []}
                    tree={tree}
                    onChange={menu => {
                      setFormValue(previous => ({ ...previous, detail: { ...previous.detail, menu } }));
                      setError('');
                    }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">此系統暫無可選功能</p>
                )}
              </div>
            )}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>
              取消
            </Button>
            <Button type="button" onClick={handleSave}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

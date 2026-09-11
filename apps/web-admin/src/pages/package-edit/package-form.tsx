import {
  Badge,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
  toast
} from '@go-tech-frontend/ui';
// import { billingLabels } from '@go-tech/package-ui/model';
// import type { PackageBillingMode } from '@go-tech/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Boxes, CalendarClock, Eye, Package, PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PackageAddonItem, PackageDetail } from '@/mocks/packages';
import { PackageAddonsEditor } from './package-addons-editor';
import { getPackageMenuTree, savePackage } from './package-api';
import { FormField, NumberField, SectionCard } from './package-fields';
import { PackageMenuEditor } from './package-menu-editor';
import { splitFeatures } from './package-model';
import type { PackageDraft } from './package-model';
import { PackagePreview } from './package-preview';

const textFields = [
  { key: 'packageName', label: '套餐名稱', maxLength: 30 }
  // { key: 'packageCode', label: '套餐編碼', maxLength: 20 },
  // { key: 'itemName', label: '項目名稱', maxLength: 30 },
] as const;

const durationFields = [
  { key: 'priceA', label: '90 天價格' },
  { key: 'priceB', label: '180 天價格' },
  { key: 'priceC', label: '365 天價格' }
] as const;

const displayFields = [
  { key: 'applyTo', label: '適用人群', placeholder: '例如：中小型企業' },
  { key: 'billingLabel', label: '自訂計費說明', placeholder: '留空時使用計費方式' },
  { key: 'capacityLabel', label: '自訂容量說明', placeholder: '留空時使用數量生成說明' },
  { key: 'badge', label: '套餐標籤', placeholder: '例如：最受歡迎' }
] as const;

// const billingModes: PackageBillingMode[] = ['year', 'month', 'employee_month', 'unit_month'];

export function PackageForm({ initialData }: { initialData: PackageDraft }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(initialData);
  const [addons, setAddons] = useState<PackageAddonItem[]>(() =>
    (initialData.additionalItems ?? []).map(addon => ({ ...addon, bizCode: initialData.bizCode }))
  );
  const [featuresText, setFeaturesText] = useState(() => initialData.detail.features?.join('\n') ?? '');
  const plan: PackageDraft = {
    ...draft,
    additionalItems: addons,
    detail: { ...draft.detail, features: splitFeatures(featuresText) }
  };

  const updateField = <Key extends keyof PackageDraft>(key: Key, value: PackageDraft[Key]) =>
    setDraft(previous => ({ ...previous, [key]: value }));
  const updateDetail = <Key extends keyof PackageDetail>(key: Key, value: PackageDetail[Key]) =>
    setDraft(previous => ({ ...previous, detail: { ...previous.detail, [key]: value } }));

  const menuQuery = useQuery({
    queryKey: ['platform/platformPackage/menuTree', draft.bizCode],
    queryFn: ({ signal }) => getPackageMenuTree(draft.bizCode, signal)
  });

  const saveMutation = useMutation({
    mutationFn: async (submittedPlan: PackageDraft) => {
      const menuTree =
        submittedPlan.detail.menu?.length || submittedPlan.additionalItems.some(addon => addon.detail.menu?.length)
          ? await queryClient.ensureQueryData({
              queryKey: ['platform/platformPackage/menuTree', submittedPlan.bizCode],
              queryFn: ({ signal }) => getPackageMenuTree(submittedPlan.bizCode, signal)
            })
          : [];
      return savePackage(submittedPlan, menuTree);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['platform/platformPackage/page'] }),
        queryClient.invalidateQueries({ queryKey: ['platform/platformPackage/detail'] })
      ]);
      toast.success('套餐已保存');
      navigate('/packages', { replace: true });
    },
    onError: (error: Error) => toast.error(error.message)
  });

  return (
    <form
      className="space-y-6 pb-12"
      onSubmit={event => {
        event.preventDefault();
        if (!saveMutation.isPending) saveMutation.mutate(plan);
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate('/packages')}
            disabled={saveMutation.isPending}
          >
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
            返回
          </Button>
          <h1 className="text-2xl font-bold">
            {draft.packageName || (draft.id === undefined ? '新增套餐' : '編輯套餐')}
          </h1>
          <Badge variant={draft.status === 1 ? 'default' : 'secondary'}>
            {draft.status === 1 ? '啟用中' : '已停用'}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          {/* <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
            <Label htmlFor="package-status">套餐狀態</Label>
            <Switch
              id="package-status"
              checked={draft.status === 1}
              onCheckedChange={checked => updateField('status', checked ? 1 : 0)}
              disabled={saveMutation.isPending}
            />
          </div> */}
          <Button type="submit" loading={saveMutation.isPending} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? '保存中…' : '保存'}
          </Button>
        </div>
      </div>

      <fieldset
        disabled={saveMutation.isPending}
        className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-2 2xl:grid-cols-3"
      >
        <div className="min-w-0 space-y-6">
          <SectionCard icon={Package} title="基本設定" description="套餐資料、容量及基礎價格">
            <FormField id="package-system" label="歸屬系統">
              <Select
                value={draft.bizCode}
                onValueChange={value => {
                  if ((value !== 'pms' && value !== 'hr') || value === draft.bizCode) return;
                  setDraft(previous => ({ ...previous, bizCode: value, detail: { ...previous.detail, menu: [] } }));
                  setAddons(previous =>
                    previous.map(addon => ({ ...addon, bizCode: value, detail: { ...addon.detail, menu: [] } }))
                  );
                }}
              >
                <SelectTrigger id="package-system">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pms">PMS 租務系統</SelectItem>
                  <SelectItem value="hr">HR 人力資源系統</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            {textFields.map(field => (
              <FormField key={field.key} id={field.key} label={field.label}>
                <Input
                  id={field.key}
                  maxLength={field.maxLength}
                  required={field.key === 'packageName'}
                  value={draft[field.key]}
                  onChange={event => updateField(field.key, event.target.value)}
                />
              </FormField>
            ))}
            {/* <NumberField
              id="item-type"
              label="項目類型"
              value={draft.itemType}
              required
              onChange={value => updateField('itemType', value ?? 0)}
            /> */}
            <NumberField
              id="package-count"
              label={draft.bizCode === 'hr' ? '最大員工數量' : '物業最大單位數量'}
              value={draft.detail.dataCount}
              onChange={value => updateDetail('dataCount', value)}
            />
            <NumberField
              id="package-price"
              label="套餐價格"
              price
              required
              value={draft.price}
              onChange={value => updateField('price', value)}
            />
          </SectionCard>

          <SectionCard icon={CalendarClock} title="訂閱天數定價" description="依不同訂閱週期設定價格">
            {durationFields.map(field => (
              <NumberField
                key={field.key}
                id={field.key}
                label={field.label}
                price
                required
                value={draft[field.key]}
                onChange={value => updateField(field.key, value)}
              />
            ))}
          </SectionCard>

          <SectionCard icon={Eye} title="展示設定" description="設定客戶看到的套餐說明與核心賣點">
            {/* <FormField id="billing-mode" label="計費方式">
              <Select
                value={draft.detail.billingMode ?? 'year'}
                onValueChange={value => {
                  const mode = billingModes.find(item => item === value);
                  if (mode) updateDetail('billingMode', mode);
                }}
              >
                <SelectTrigger id="billing-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {billingModes.map(mode => (
                    <SelectItem key={mode} value={mode}>
                      {billingLabels[mode]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField> */}
            <NumberField
              id="original-price"
              label="劃線原價"
              price
              value={draft.detail.originalPrice}
              onChange={value => updateDetail('originalPrice', value)}
            />
            {displayFields.map(field => (
              <FormField key={field.key} id={field.key} label={field.label}>
                <Input
                  id={field.key}
                  maxLength={field.key === 'applyTo' ? 120 : undefined}
                  placeholder={field.placeholder}
                  value={draft.detail[field.key] ?? ''}
                  onChange={event => updateDetail(field.key, event.target.value)}
                />
              </FormField>
            ))}
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="is-recommended">推薦套餐</Label>
              <Switch
                id="is-recommended"
                checked={draft.detail.isRecommended ?? false}
                onCheckedChange={checked => updateDetail('isRecommended', checked)}
              />
            </div>
            <FormField id="package-summary" label="套餐摘要">
              <Textarea
                id="package-summary"
                maxLength={120}
                rows={3}
                value={draft.detail.summary ?? ''}
                onChange={event => updateDetail('summary', event.target.value)}
              />
            </FormField>
            <FormField id="package-remind" label="溫馨提示">
              <Textarea
                id="package-remind"
                maxLength={120}
                rows={3}
                value={draft.detail.remind ?? ''}
                onChange={event => updateDetail('remind', event.target.value)}
              />
            </FormField>
            <FormField id="package-features" label="展示賣點（每行一項）">
              <Textarea
                id="package-features"
                rows={5}
                value={featuresText}
                onChange={event => setFeaturesText(event.target.value)}
                placeholder="留空時展示所選功能，優先使用重點功能，最多六項"
              />
            </FormField>
          </SectionCard>
        </div>

        <div className="min-w-0 space-y-6">
          <SectionCard icon={Boxes} title="套餐功能內容" description="勾選此套餐可使用的系統功能模組">
            {menuQuery.isPending && (
              <p role="status" className="text-sm text-muted-foreground">
                正在載入功能選單…
              </p>
            )}
            {menuQuery.isError && (
              <div role="alert" className="space-y-2 text-sm text-destructive">
                <p>{menuQuery.error.message}</p>
                <Button type="button" variant="outline" size="sm" onClick={() => menuQuery.refetch()}>
                  重新載入
                </Button>
              </div>
            )}
            {menuQuery.isSuccess &&
              (menuQuery.data.length ? (
                <PackageMenuEditor
                  key={draft.bizCode}
                  tree={menuQuery.data}
                  menu={draft.detail.menu ?? []}
                  onChange={menu => updateDetail('menu', menu)}
                />
              ) : (
                <p className="text-sm text-muted-foreground">此系統暫無可選功能</p>
              ))}
          </SectionCard>
          <SectionCard icon={PlusCircle} title="附加功能" description="套餐额外功能">
            {menuQuery.isSuccess && (
              <PackageAddonsEditor
                key={draft.bizCode}
                tree={menuQuery.data}
                additionalItems={addons}
                product={draft.bizCode}
                onChange={setAddons}
              />
            )}
            {menuQuery.isPending && (
              <p role="status" className="text-sm text-muted-foreground">
                正在載入功能選單…
              </p>
            )}
            {menuQuery.isError && (
              <div role="alert" className="space-y-2 text-sm text-destructive">
                <p>功能選單載入失敗，暫時無法設定附加功能</p>
                <Button type="button" variant="outline" size="sm" onClick={() => menuQuery.refetch()}>
                  重新載入
                </Button>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="min-w-0 lg:col-span-2 2xl:sticky 2xl:top-6 2xl:col-span-1">
          <SectionCard icon={Eye} title="即時預覽" description="參照客戶端套餐展示，內容隨編輯即時更新">
            <div className="mx-auto max-w-lg break-words">
              <PackagePreview plan={plan} />
            </div>
          </SectionCard>
        </div>
      </fieldset>
    </form>
  );
}

'use client';

import { Button } from '@go-tech-frontend/ui';
import { formatPackagePrice, getPackageFeatures } from '@go-tech/package-ui/model';
import type { Packages } from '@go-tech/types';
import { useAtom } from 'jotai';
import { Check, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { DynamicText } from '@/app/components/DynamicI18nText.client';
import Footer from '@/app/components/Footer';
import Header from '@/app/components/v2/Header';
import { useProgressRouter } from '@/app/hooks/use-progress-router';
import {
  DEFAULT_ADDON_QUANTITY,
  getPurchaseAddonKey,
  getPurchaseTotals,
  normalizeQuantity
} from '@/app/lib/package-purchase';
import servicePlanBg from '@/assets/service-plan-bg.jpg';
import { needAddonsAtom, selectedMonthsAtom, selectedServicesAtom } from '@/contexts/Order.jotai';
import { useProductSelection } from '@/contexts/ProductSelectionContext';

const periods = [1, 2, 3, 6, 12];
const money = (value: number) => formatPackagePrice(value) ?? '—';

const getBaseFeatures = (plan: Packages) =>
  plan.detail?.features?.length ? plan.detail.features : (plan.detail?.menu ?? []).map(item => item.menuTitle);
const getCapacityText = (plan: Packages) =>
  plan.detail?.capacityLabel ||
  (plan.bizCode === 'hr'
    ? `包含 ${plan.detail?.dataCount ?? 0} 名員工`
    : `最多可創建 ${plan.detail?.dataCount ?? 0} 個單位`);

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 text-lg font-bold text-foreground">
      <span className="h-6 w-1 rounded-full bg-primary" />
      {children}
    </h2>
  );
}

function QuantityInput({
  label,
  onChange,
  value
}: {
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={`減少${label}`}
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
        className="flex h-8 w-8 items-center justify-center rounded border border-border hover:bg-muted disabled:opacity-40"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        aria-label={label}
        type="number"
        min={1}
        max={Number.MAX_SAFE_INTEGER}
        step={1}
        value={value}
        onChange={event => onChange(Number(event.target.value))}
        className="h-8 w-16 rounded border border-border bg-background text-center text-sm font-medium"
      />
      <button
        type="button"
        aria-label={`增加${label}`}
        disabled={value >= Number.MAX_SAFE_INTEGER}
        onClick={() => onChange(value + 1)}
        className="flex h-8 w-8 items-center justify-center rounded border border-border hover:bg-muted disabled:opacity-40"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

const SelectPlan = ({ plan: inputPlan, planId }: { plan: Packages; planId?: string }) => {
  const router = useProgressRouter();
  const { product } = useProductSelection();
  const plan = { ...inputPlan, bizCode: inputPlan.bizCode ?? product };
  const addons = plan.additionalItems ?? [];
  const [needAddons, setNeedAddons] = useAtom(needAddonsAtom);
  const [selectedMonths, setSelectedMonths] = useAtom(selectedMonthsAtom);
  const [customPeriod, setCustomPeriod] = useState(!periods.includes(selectedMonths));
  const [selectedServices, setSelectedServices] = useAtom(selectedServicesAtom);
  const totals = getPurchaseTotals(plan, selectedMonths, {
    selection: needAddons ? selectedServices : {}
  });
  const baseFeatures = getBaseFeatures(plan);
  const selectedCount = totals.lines.length;

  const setQuantity = (key: string, value: number) => {
    const quantity = normalizeQuantity(value);
    setSelectedServices(previous => ({ ...previous, [key]: quantity }));
  };
  const toggleService = (key: string) => {
    setSelectedServices(previous => {
      const next = { ...previous };
      if (next[key] > 0) delete next[key];
      else next[key] = DEFAULT_ADDON_QUANTITY;
      return next;
    });
  };
  const selectAll = () =>
    setSelectedServices(
      Object.fromEntries(
        addons.flatMap((addon, index) => {
          const quantity = DEFAULT_ADDON_QUANTITY;
          return quantity > 0 ? [[getPurchaseAddonKey(plan, addon, index), quantity]] : [];
        })
      )
    );
  const handleNext = () => {
    // Persist only entries that belong to this plan and have valid positive quantities.
    setSelectedServices(Object.fromEntries(totals.lines.map(line => [line.key, line.quantity])));
    router.push(
      `/confirm-order/${encodeURIComponent(planId ?? String(plan.id ?? plan.packageCode))}?product=${plan.bizCode}`
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <section
        className="relative bg-cover bg-center pb-16 pt-32"
        style={{ backgroundImage: `url(${servicePlanBg.src})` }}
      >
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-2 text-4xl font-bold text-primary md:text-5xl">
            <DynamicText text="選擇套餐" />
          </h1>
        </div>
      </section>
      <section className="flex-1 bg-linear-to-b from-primary/5 to-primary/10 py-12">
        <div className="container mx-auto max-w-5xl space-y-6 px-4">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <SectionTitle>
                <DynamicText text={plan.packageName} />
              </SectionTitle>
              <div className="text-primary">
                <strong className="text-2xl">${money(plan.price)}</strong> HKD / <DynamicText text="月" />
              </div>
            </div>
            <div className="mb-4 flex gap-4 text-sm">
              <span className="min-w-15 shrink-0 font-medium text-muted-foreground">
                <DynamicText text="套餐內容" />
              </span>
              <span>
                <DynamicText text={getCapacityText(plan)} />
              </span>
            </div>
            <div className="mb-4 flex gap-4 text-sm">
              <span className="min-w-15 shrink-0 font-medium text-muted-foreground">
                <DynamicText text="包含功能" />
              </span>
              <div className="flex flex-wrap gap-2">
                {baseFeatures.map((feature, index) => (
                  <span
                    key={`${feature}-${index}`}
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-muted-foreground"
                  >
                    <Check className="h-4 w-4 text-primary" />
                    <DynamicText text={feature} />
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 border-t border-border/60 pt-4">
              <span className="min-w-15 text-sm font-medium text-muted-foreground">
                <DynamicText text="開通月份" />
              </span>
              <div className="flex flex-1 flex-wrap gap-2">
                {periods.map(months => (
                  <button
                    key={months}
                    type="button"
                    aria-pressed={!customPeriod && selectedMonths === months}
                    onClick={() => {
                      setCustomPeriod(false);
                      setSelectedMonths(months);
                    }}
                    className={`rounded-md border-2 px-4 py-2 text-sm font-bold ${!customPeriod && selectedMonths === months ? 'border-primary text-primary' : 'border-border hover:border-primary/50'}`}
                  >
                    <DynamicText text={`${months} 個月`} />
                  </button>
                ))}
                <button
                  type="button"
                  aria-pressed={customPeriod}
                  onClick={() => setCustomPeriod(true)}
                  className={`rounded-md border-2 px-4 py-2 text-sm font-bold ${customPeriod ? 'border-primary text-primary' : 'border-border hover:border-primary/50'}`}
                >
                  <DynamicText text="自定義" />
                </button>
                {customPeriod && (
                  <input
                    aria-label="自定義月份"
                    type="number"
                    min={1}
                    step={1}
                    value={selectedMonths}
                    onChange={event => {
                      const value = Number(event.target.value);
                      if (Number.isSafeInteger(value) && value >= 1) setSelectedMonths(value);
                    }}
                    className="w-20 rounded-md border-2 border-primary px-2 text-center text-sm font-bold text-primary"
                  />
                )}
              </div>
              <div className="text-right" aria-live="polite">
                <span className="text-xs text-muted-foreground">
                  <DynamicText text="套餐小計：" />
                </span>
                {totals.savings > 0 && (
                  <span className="mr-1.5 text-xs text-muted-foreground line-through">
                    ${money(totals.baseOriginal)}
                  </span>
                )}
                <strong className="text-primary">${money(totals.basePayable)}</strong>
                <span className="ml-1 text-xs text-primary">HKD</span>
                {totals.savings > 0 && (
                  <p className="mt-1 text-xs text-primary">
                    <DynamicText text={`${selectedMonths} 個月(時長優惠)，已優惠 $${money(totals.savings)} HKD`} />
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <SectionTitle>
                  <DynamicText text="附加模塊 / 增值服務" />
                </SectionTitle>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  已選 {selectedCount} / {addons.length}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {needAddons && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary"
                    >
                      全選
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedServices({})}
                      className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary"
                    >
                      清空
                    </button>
                  </div>
                )}
                <div className="flex overflow-hidden rounded-full border border-border">
                  {[true, false].map(value => (
                    <button
                      key={String(value)}
                      type="button"
                      aria-pressed={needAddons === value}
                      onClick={() => setNeedAddons(value)}
                      className={`px-6 py-2 text-sm ${needAddons === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                    >
                      <DynamicText text={value ? '需要' : '不需要'} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {needAddons && (
              <div>
                <p className="mb-4 text-sm text-muted-foreground">
                  <DynamicText text="點擊卡片即可選購附加服務" />
                  <span className="text-primary">
                    <DynamicText text={`（可多選，依套餐開通月份計算 ${selectedMonths} 個月）`} />
                  </span>
                </p>
                {addons.length === 0 && (
                  <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                    <DynamicText text="此套餐暫無附加服務" />
                  </p>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  {addons.map((service, index) => {
                    const key = getPurchaseAddonKey(plan, service, index);
                    const line = totals.lines.find(item => item.key === key);
                    const selected = Boolean(line);
                    const quantity = line?.quantity ?? 1;
                    const features = getPackageFeatures({
                      features: service.detail?.features,
                      menu: service.detail?.menu
                    });
                    const unit = '份';
                    return (
                      <div
                        key={key}
                        className={`min-w-0 rounded-xl border-2 transition-colors ${selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                      >
                        <label className="flex cursor-pointer gap-3 p-4">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleService(key)}
                            aria-label={service.itemName}
                            className="peer sr-only"
                          />
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}
                            aria-hidden="true"
                          >
                            {selected && <Check className="h-3 w-3" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold">
                              <DynamicText text={service.itemName} />
                            </span>
                            <span className="mt-0.5 block text-sm font-bold text-primary">
                              +${money(service.price)} HKD{' '}
                              <span className="text-xs font-normal text-muted-foreground">
                                <DynamicText text={`每${unit} / 月`} />
                              </span>
                            </span>
                            {service.detail?.summary && (
                              <span className="mt-1 block text-xs text-muted-foreground">
                                <DynamicText text={service.detail.summary} />
                              </span>
                            )}
                            <span className="mt-2 flex flex-wrap gap-1.5">
                              {features.map((feature, fIndex) => (
                                <span
                                  key={`${feature}-${fIndex}`}
                                  className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary"
                                >
                                  <DynamicText text={feature} />
                                </span>
                              ))}
                            </span>
                          </span>
                        </label>
                        {selected && (
                          <div className="mx-4 mb-4 space-y-3 border-t border-primary/20 pt-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                <DynamicText text="購買數量" />
                              </span>
                              <QuantityInput
                                label={`${service.itemName}購買數量`}
                                value={quantity}
                                onChange={value => setQuantity(key, value)}
                              />
                            </div>
                            <p>
                              <span className="text-xs text-muted-foreground">小計：</span>
                              <strong className="text-primary">${money(line?.total ?? 0)}</strong>
                              <span className="ml-1 text-xs text-primary">HKD</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ${money(service.price)} × {quantity} {unit} × {selectedMonths} 個月
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="mt-4 border-t border-border pt-4 text-right" aria-live="polite">
              <span className="text-xs text-muted-foreground">
                <DynamicText text="增值服務總計：" />
              </span>
              <strong className="text-primary">${money(totals.addonsTotal)}</strong>
              <span className="ml-1 text-xs text-primary">HKD</span>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-card" aria-label="費用明細">
            <div className="flex items-center justify-between border-b border-border bg-muted/50 px-6 py-4">
              <SectionTitle>
                <DynamicText text="費用明細" />
              </SectionTitle>
              <span className="text-xs text-muted-foreground">開通 {selectedMonths} 個月</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-border px-6 py-4 text-sm">
              <div>
                <strong>
                  <DynamicText text={plan.packageName} />
                  <span className="ml-2 text-xs text-muted-foreground">套餐費用</span>
                </strong>
                <p className="mt-1 text-xs text-muted-foreground">
                  ${money(plan.price)} / 月 × {selectedMonths} 個月
                </p>
              </div>
              <strong>${money(totals.baseOriginal)}</strong>
            </div>
            {totals.lines.length ? (
              totals.lines.map(line => (
                <div key={line.key} className="flex justify-between gap-4 border-b border-border px-6 py-4 text-sm">
                  <div>
                    <DynamicText text={line.service.itemName} />
                    <p className="mt-1 text-xs text-muted-foreground">
                      ${money(line.service.price)} × {line.quantity} × {selectedMonths} 個月
                    </p>
                  </div>
                  <strong>${money(line.total)}</strong>
                </div>
              ))
            ) : (
              <p className="border-b border-border px-6 py-4 text-xs text-muted-foreground">
                <DynamicText text="未選購增值服務" />
              </p>
            )}
            <dl className="space-y-2 bg-muted/20 px-6 py-4 text-xs ">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  套餐小計 <span>(${money(plan.price)} / 月)</span>
                </dt>
                <dd>
                  {totals.savings > 0 && (
                    <span className="mr-1.5  text-muted-foreground line-through">${money(totals.baseOriginal)}</span>
                  )}
                  <strong className="text-primary">${money(totals.basePayable)}</strong>
                  <span className="ml-1  text-primary">HKD</span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">增值服務小計</dt>
                <dd>${money(totals.addonsTotal)} HKD</dd>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <dt className="text-muted-foreground">原價合計</dt>
                <dd className="line-through">${money(totals.originalTotal)} HKD</dd>
              </div>
              {totals.savings > 0 && (
                <div className="flex justify-between text-primary">
                  <dt>套餐優惠（時長優惠）</dt>
                  <dd>−${money(totals.savings)} HKD</dd>
                </div>
              )}
              <div className="pt-4 border-t-2 border-primary/30  flex items-center justify-between" aria-live="polite">
                <dt className="text-lg font-bold">應付總額</dt>
                <dd className="flex items-baseline gap-2">
                  {totals.savings > 0 && (
                    <div className="text-sm text-muted-foreground line-through">${money(totals.originalTotal)}</div>
                  )}
                  <div className="text-3xl font-bold text-primary">${money(totals.total)}</div>
                  <div className="text-sm text-primary">HKD</div>
                </dd>
              </div>
            </dl>
          </div>
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/service-plan?product=${plan.bizCode}`)}
              className="h-12 min-w-45 border-primary text-primary"
            >
              <DynamicText text="上一步" />
            </Button>
            <Button onClick={handleNext} className="h-12 min-w-45">
              <DynamicText text="下一步" />
            </Button>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default SelectPlan;

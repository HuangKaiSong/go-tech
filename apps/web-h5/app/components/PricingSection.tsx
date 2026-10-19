'use client';

import {
  formatPackagePrice,
  getAddonBillingLabel,
  getBillingLabel,
  getPackageFeatures
} from '@go-tech/package-ui/model';
import type { PackageCardPlan } from '@go-tech/package-ui/model';
import type { PackageBizCode, Packages } from '@go-tech/types';
import { cn } from '@go-tech/web-ui';
import { ArrowRight, Check, Gift, MousePointerClick, Settings } from 'lucide-react';
import Link from '@/app/components/Link';
import {
  getFeaturedPlan,
  getHrFeatureGroups,
  getPmsFeatureGroups,
  toAddonCardPlan,
  toPackageCardPlan
} from '@/app/lib/package-card-plan';
import type { PackageCatalog } from '@/app/lib/package-catalog';
import { useProductSelection } from '@/contexts/ProductSelectionContext';
import { DynamicText } from './DynamicI18nText.client';
import SwipeRow from './SwipeRow';
import { TrialAction } from './trial-action';

function FeatureList({ features, singleColumn = false }: { features: readonly string[]; singleColumn?: boolean }) {
  return (
    <ul
      className={`grid gap-x-3 gap-y-2 text-xs text-muted-foreground ${singleColumn ? 'grid-cols-1' : 'grid-cols-2'}`}
    >
      {features.map((feature, index) => (
        <li key={`${feature}-${index}`} className="flex items-start gap-2">
          <Check className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
          <DynamicText text={feature} />
        </li>
      ))}
    </ul>
  );
}

function BasePackage({ plan, product }: { plan: Packages; product: PackageBizCode }) {
  const card = toPackageCardPlan(plan);
  const features = card.features?.length ? card.features : (card.menu?.map(item => item.menuTitle) ?? []);
  const getFeatureGroups = product === 'hr' ? getHrFeatureGroups : getPmsFeatureGroups;
  const featureGroups =
    !card.features?.length && plan.detail?.menu?.length
      ? getFeatureGroups(plan.detail.menu)
      : [{ id: 'core', title: '核心模組', features }];
  const href = plan.price ? `/select-plan/${encodeURIComponent(plan.packageCode!)}?product=${product}` : '';
  const summary = card.summary || (product === 'hr' ? '包含人事管理核心功能' : '包含租務管理核心功能');

  return (
    <article className="min-w-0 rounded-xl border-2 border-primary bg-background p-5 shadow-lg shadow-primary/10">
      <span className="inline-flex rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">
        <DynamicText text="必選 · 基礎套餐" />
      </span>
      <h3 className="mt-4 flex items-center gap-2 text-xl font-bold text-foreground">
        <Settings className="h-5 w-5 text-primary" aria-hidden="true" />
        <DynamicText text={card.packageName} />
      </h3>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        <DynamicText text={summary} />
      </p>
      <div className="mt-3 flex flex-wrap items-baseline gap-1 text-primary">
        <strong className="text-3xl">${formatPackagePrice(card.price) ?? '—'}</strong>
        <span className="text-sm">
          HKD / <DynamicText text={card.billingLabel || (card.billingMode ? getBillingLabel(card) : '月起')} />
        </span>
      </div>
      {card.capacityLabel && (
        <p className="mt-2 text-xs text-muted-foreground">
          <DynamicText text={card.capacityLabel} />
        </p>
      )}
      <Link
        href={href}
        className="mt-4 flex min-h-11 items-center justify-center gap-3 rounded-md bg-linear-to-r from-orange-600 to-orange-400 px-3 py-3 text-sm font-bold text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <MousePointerClick className="h-4 w-4 shrink-0" aria-hidden="true" />
        <DynamicText text="選擇基礎版並加購模組" />
        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
      </Link>
      <p className="mt-2 text-center text-[11px] leading-5 text-primary">
        <DynamicText text="第一步：點此開始 · 下一頁可自由加購模組" />
      </p>
      <div className="mt-3 space-y-3">
        {featureGroups.map(group => (
          <div key={group.id}>
            <h4 className="mb-2 border-b border-primary/20 pb-1 text-xs font-semibold text-primary">
              <DynamicText text={group.title} />
            </h4>
            {group.features.length > 0 && <FeatureList features={group.features} />}
          </div>
        ))}
      </div>
      {card.note && (
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          <DynamicText text={card.note} />
        </p>
      )}
    </article>
  );
}

function AddonModule({ plan }: { plan: PackageCardPlan }) {
  return (
    <article className="min-h-[220px] min-w-0 rounded-xl border border-border bg-background p-5">
      <h4 className="text-base font-bold text-foreground">
        <DynamicText text={plan.packageName} />
      </h4>
      {plan.summary && (
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          <DynamicText text={plan.summary} />
        </p>
      )}
      <div className="mt-6 flex flex-wrap items-baseline gap-1">
        <strong className="text-2xl text-primary">+${formatPackagePrice(plan.price) ?? '—'}</strong>
        <span className="text-xs text-muted-foreground">
          HKD / <DynamicText text={getAddonBillingLabel(plan)} />
        </span>
      </div>
      <div className="mt-3 border-t border-border pt-4">
        <FeatureList singleColumn features={getPackageFeatures(plan)} />
      </div>
    </article>
  );
}

export default function PricingSection({ catalog }: { catalog: PackageCatalog }) {
  const { product } = useProductSelection();
  const featuredPlan = getFeaturedPlan(catalog[product]);
  const title = product === 'hr' ? '基礎套餐 + 附加模塊' : '基礎套餐 + 附加模組';
  const description =
    product === 'hr'
      ? '以基礎版為核心，按需加購模塊，靈活組合你的 HR 系統'
      : '以基礎版為核心，按需加購模塊，靈活組合你的 PMS 租務系統';

  return (
    <section className="bg-background pb-10" aria-labelledby="pricing-title" data-package-product={product}>
      <div className="container mx-auto max-w-6xl px-4">
        <header className="mx-auto mb-8 max-w-3xl text-center">
          <h2 id="pricing-title" className="text-lg font-bold text-foreground md:text-3xl">
            <DynamicText text={title} />
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            <DynamicText text={description} />
          </p>
        </header>
        {featuredPlan ? (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
            <BasePackage plan={featuredPlan} product={product} />
            <div className="min-w-0">
              <span className="inline-flex rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-semibold tracking-widest text-primary">
                ADD-ON MODULES
              </span>
              <h3 className="mt-2 text-xl font-bold text-foreground">
                <DynamicText text="可加購的附加模組" />
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                <DynamicText text="在基礎版之上按需加購，模組費用 = 月費 × 購買數量 × 開通月份，下一步可即時試算。" />
              </p>
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">
                <Gift className="h-4 w-4 shrink-0" aria-hidden="true" />
                <DynamicText text="立即開始 14 天免費試用，按業務需要靈活組合模組" />
              </div>
              <div className="mt-4">
                <SwipeRow
                  key={product}
                  className={cn(
                    'flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:w-[85%] [&>*]:shrink-0 [&>*]:snap-start md:grid md:overflow-visible md:pb-0 md:[&>*]:w-auto',
                    product === 'hr' ? 'md:grid-cols-3' : 'md:grid-cols-2'
                  )}
                >
                  {(featuredPlan.additionalItems ?? []).map((addon, index) => (
                    <AddonModule
                      key={addon.id ?? `${addon.itemName}-${index}`}
                      plan={toAddonCardPlan(addon, product)}
                    />
                  ))}
                </SwipeRow>
              </div>
              {!featuredPlan.additionalItems?.length && (
                <p className="mt-4 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  <DynamicText text="此套餐暫無附加模組" />
                </p>
              )}
              <aside className="mt-5 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
                <h4 className="text-sm font-bold text-foreground">
                  <DynamicText text="計費方式" />
                </h4>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  <DynamicText
                    text={`總費用 = 基礎版月費 $${formatPackagePrice(featuredPlan.price) ?? '—'} × 開通月份 + 已選模組月費 × 購買數量 × 開通月份。實際優惠及應付金額以下一步試算為準。`}
                  />
                </p>
              </aside>
            </div>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border px-8 py-16 text-center text-muted-foreground">
            <DynamicText text="套餐資料準備中，啟用後將自動顯示。" />
          </p>
        )}
        <div className="mt-8 text-center space-x-4">
          <Link
            href={`/pricing-plan?product=${product}`}
            prefetch={false}
            className="text-sm font-bold text-foreground underline underline-offset-4 hover:text-primary"
          >
            <DynamicText text="查看完整的定價方案" />
          </Link>
          <TrialAction appearance="button">
            <DynamicText text="立即開始14天免費試用" />
          </TrialAction>
        </div>
      </div>
    </section>
  );
}

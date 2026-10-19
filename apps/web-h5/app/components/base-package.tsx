import { formatPackagePrice, getBillingLabel } from '@go-tech/package-ui/model';
import type { PackageBizCode, Packages } from '@go-tech/types';
import { ArrowRight, Check, MousePointerClick, Settings } from 'lucide-react';
import { getHrFeatureGroups, getPmsFeatureGroups, toPackageCardPlan } from '@/app/lib/package-card-plan';
import { DynamicText } from './DynamicI18nText.client';
import Link from './Link';

export function PackageFeatureList({
  features,
  singleColumn = false
}: {
  features: readonly string[];
  singleColumn?: boolean;
}) {
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

export function BasePackage({
  onSelect,
  plan,
  product
}: {
  onSelect?: (plan: Packages) => void;
  plan: Packages;
  product: PackageBizCode;
}) {
  const card = toPackageCardPlan(plan);
  const features = card.features?.length ? card.features : (card.menu?.map(item => item.menuTitle) ?? []);
  const getFeatureGroups = product === 'hr' ? getHrFeatureGroups : getPmsFeatureGroups;
  const featureGroups =
    !card.features?.length && plan.detail?.menu?.length
      ? getFeatureGroups(plan.detail.menu)
      : [{ id: 'core', title: '核心模組', features }];
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
      <BasePackageAction plan={plan} product={product} onSelect={onSelect} />
      <p className="mt-2 text-center text-[11px] leading-5 text-primary">
        <DynamicText text="第一步：點此開始 · 下一頁可自由加購模組" />
      </p>
      <div className="mt-3 space-y-3">
        {featureGroups.map(group => (
          <div key={group.id}>
            <h4 className="mb-2 border-b border-primary/20 pb-1 text-xs font-semibold text-primary">
              <DynamicText text={group.title} />
            </h4>
            {group.features.length > 0 && <PackageFeatureList features={group.features} />}
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

function BasePackageAction({
  onSelect,
  plan,
  product
}: {
  onSelect?: (plan: Packages) => void;
  plan: Packages;
  product: PackageBizCode;
}) {
  const href = plan.price ? `/select-plan/${encodeURIComponent(plan.packageCode ?? '')}?product=${product}` : '';
  const disabled = formatPackagePrice(plan.price) === null;
  const className =
    'mt-4 flex min-h-11 w-full items-center justify-center gap-3 rounded-md bg-linear-to-r from-orange-600 to-orange-400 px-3 py-3 text-sm font-bold text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50';
  const children = (
    <>
      <MousePointerClick className="h-4 w-4 shrink-0" aria-hidden="true" />
      <DynamicText text="選擇基礎版並加購模組" />
      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
    </>
  );

  return onSelect ? (
    <button type="button" className={className} onClick={() => onSelect(plan)} disabled={disabled}>
      {children}
    </button>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

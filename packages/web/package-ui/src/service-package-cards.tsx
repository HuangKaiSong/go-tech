import { Card, CardContent, CardHeader } from '@go-tech-frontend/ui';
import type { PackageBizCode } from '@go-tech/types';
import { ArrowRight, Check, MousePointerClick, Settings, SquareCheckBig } from 'lucide-react';
import type { ComponentType } from 'react';
import {
  formatPackagePrice,
  getAddonBillingLabel,
  getBillingLabel,
  getHrFeatureGroups,
  getPackageFeatures,
  getPmsFeatureGroups
} from './model';
import type { PackageCardPlan } from './model';
import type { PackageLinkProps, PackageTextProps } from './package-card';

const PlainText = ({ text }: PackageTextProps) => <>{text}</>;

type ServiceCardProps = {
  plan: PackageCardPlan;
  TextComponent?: ComponentType<PackageTextProps>;
};

export function PackageFeatureList({
  features,
  singleColumn = false,
  TextComponent: Text = PlainText
}: {
  features: readonly string[];
  singleColumn?: boolean;
  TextComponent?: ComponentType<PackageTextProps>;
}) {
  return (
    <ul
      className={`grid gap-x-3 gap-y-2 text-xs text-muted-foreground ${singleColumn ? 'grid-cols-1' : 'grid-cols-2'}`}
    >
      {features.map((feature, index) => (
        <li key={`${feature}-${index}`} className="flex items-start gap-2">
          <Check className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
          <Text text={feature} />
        </li>
      ))}
    </ul>
  );
}

export function BasePackageCard({
  href,
  LinkComponent: Link,
  onSelect,
  plan,
  product,
  TextComponent: Text = PlainText
}: ServiceCardProps & {
  href?: string;
  LinkComponent?: ComponentType<PackageLinkProps>;
  onSelect?: () => void;
  product: PackageBizCode;
}) {
  const getFeatureGroups = product === 'hr' ? getHrFeatureGroups : getPmsFeatureGroups;
  const featureGroups =
    !plan.features?.length && plan.menu?.length
      ? getFeatureGroups(plan.menu)
      : [{ id: 'core', title: '核心模組', features: plan.features ?? [] }];
  const summary = plan.summary || (product === 'hr' ? '包含人事管理核心功能' : '包含租務管理核心功能');
  const price = formatPackagePrice(plan.price);
  const actionClass =
    'mt-4 flex min-h-11 w-full items-center justify-center gap-3 rounded-md bg-linear-to-r from-orange-600 to-orange-400 px-3 py-3 text-sm font-bold text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50';
  const actionContent = (
    <>
      <MousePointerClick className="h-4 w-4 shrink-0" aria-hidden="true" />
      <Text text="選擇基礎版並加購模組" />
      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
    </>
  );

  return (
    <article className="min-w-0 rounded-xl border-2 border-primary bg-background p-5 shadow-lg shadow-primary/10">
      <span className="inline-flex rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">
        <Text text="必選 · 基礎套餐" />
      </span>
      <h3 className="mt-4 flex items-center gap-2 text-xl font-bold text-foreground">
        <Settings className="h-5 w-5 text-primary" aria-hidden="true" />
        <Text text={plan.packageName} />
      </h3>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        <Text text={summary} />
      </p>
      <div className="mt-3 flex flex-wrap items-baseline gap-1 text-primary">
        <strong className="text-3xl">${price ?? '—'}</strong>
        <span className="text-sm">
          HKD / <Text text={plan.billingLabel || (plan.billingMode ? getBillingLabel(plan) : '月起')} />
        </span>
      </div>
      {plan.capacityLabel && (
        <p className="mt-2 text-xs text-muted-foreground">
          <Text text={plan.capacityLabel} />
        </p>
      )}
      {!onSelect && Link && href !== undefined ? (
        <Link href={href} className={actionClass}>
          {actionContent}
        </Link>
      ) : (
        <button type="button" className={actionClass} onClick={onSelect} disabled={!onSelect || price === null}>
          {actionContent}
        </button>
      )}
      <p className="mt-2 text-center text-[11px] leading-5 text-primary">
        <Text text="第一步：點此開始 · 下一頁可自由加購模組" />
      </p>
      <div className="mt-3 space-y-3">
        {featureGroups.map(group => (
          <div key={group.id}>
            <h4 className="mb-2 border-b border-primary/20 pb-1 text-xs font-semibold text-primary">
              <Text text={group.title} />
            </h4>
            {group.features.length > 0 && <PackageFeatureList features={group.features} TextComponent={Text} />}
          </div>
        ))}
      </div>
      {plan.note && (
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          <Text text={plan.note} />
        </p>
      )}
    </article>
  );
}

function CheckFeatureIcon() {
  return <SquareCheckBig className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />;
}

export function ServiceAddonCard({
  FeatureIcon = CheckFeatureIcon,
  plan,
  TextComponent: Text = PlainText
}: ServiceCardProps & { FeatureIcon?: ComponentType<{ icon?: string }> }) {
  const price = formatPackagePrice(plan.price);
  const features = getPackageFeatures(plan);

  return (
    <Card className="flex min-w-0 flex-col border-border bg-card transition-shadow hover:shadow-md">
      <CardHeader className="p-5 pb-6">
        <h4 className="break-words text-base font-bold text-foreground">
          <Text text={plan.packageName} />
        </h4>
        <p className="min-h-10 text-xs leading-5 text-muted-foreground">
          <Text text={plan.summary ?? ''} />
        </p>
      </CardHeader>
      <CardContent className="flex-1 px-5 pb-6">
        <div className="mb-4 flex flex-wrap items-baseline gap-1">
          <strong className="text-2xl font-bold text-primary">
            {price !== null ? `+$${price}` : <Text text="敬請期待" />}
          </strong>
          <span className="min-w-0 break-words text-xs text-muted-foreground">
            HKD / <Text text={getAddonBillingLabel(plan)} />
          </span>
        </div>
        {features.length > 0 && (
          <ul className="space-y-2.5 border-t border-border pt-4">
            {features.map((feature, index) => (
              <li key={`${feature}-${index}`} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <FeatureIcon icon={plan.menu?.find(item => item.menuTitle === feature)?.menuIcon} />
                <Text text={feature} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

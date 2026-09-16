'use client';

import { Button, Card, CardContent, CardFooter, CardHeader, buttonVariants } from '@go-tech-frontend/ui';
import type { PackageBizCode } from '@go-tech/types';
import { cn } from '@go-tech/utils';
import { Check, ChevronRight, SquareCheckBig, Users } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import {
  formatPackagePrice,
  getAddonBillingLabel,
  getBillingLabel,
  getCapacityLabel,
  getPackageFeatures
} from './model';
import type { PackageCardPlan } from './model';

export interface PackageTextProps {
  text: string;
}

export interface PackageLinkProps {
  children: ReactNode;
  className?: string;
  href: string;
}

export interface PackageCardProps {
  addonActions?: ReactNode;
  LinkComponent?: ComponentType<PackageLinkProps>;
  plan: PackageCardPlan;
  preview?: boolean;
  product: PackageBizCode;
  TextComponent?: ComponentType<PackageTextProps>;
}

const PlainText = ({ text }: PackageTextProps) => <>{text}</>;
const NativeLink = (props: PackageLinkProps) => <a {...props} />;

function PackageFeatures({ plan, TextComponent: Text = PlainText }: PackageCardProps) {
  const features = getPackageFeatures(plan);
  if (!features.length) return null;
  return (
    <ul className="space-y-1.5 text-sm text-muted-foreground">
      {features.map((feature, index) => (
        <li key={`${feature}-${index}`} className="flex items-start gap-3">
          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          </span>
          <Text text={feature} />
        </li>
      ))}
    </ul>
  );
}

function PlanPrice({ plan, product, TextComponent: Text = PlainText }: PackageCardProps) {
  const price = formatPackagePrice(plan.price);
  const originalPrice = formatPackagePrice(plan.originalPrice);
  const capacityLabel = getCapacityLabel(plan, product);
  return (
    <div>
      {price !== null ? (
        <div className="flex flex-wrap items-end gap-2">
          <strong className="text-4xl leading-none text-primary">HK${price}</strong>
          <div className="min-h-6 text-sm text-muted-foreground line-through">
            {originalPrice !== null ? `HK$ ${originalPrice}` : null}
          </div>
        </div>
      ) : (
        <div className="text-2xl font-bold text-primary">
          <Text text="敬請期待" />
        </div>
      )}
      <div className="mt-2 text-sm text-muted-foreground">
        <Text text={getBillingLabel(plan)} />
      </div>
      {capacityLabel && (
        <div className="mt-3 inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
          <Text text={capacityLabel} />
        </div>
      )}
    </div>
  );
}

function PlanAction({
  LinkComponent: Link = NativeLink,
  plan,
  preview,
  product,
  TextComponent: Text = PlainText
}: PackageCardProps) {
  const content = (
    <>
      <Text text={product === 'hr' ? '了解 HR 基礎套餐' : '了解此方案'} />
      <ChevronRight className="ml-1 h-4 w-4 group-hover:ml-1.5" aria-hidden="true" />
    </>
  );
  const variant = product === 'hr' || plan.isRecommended ? 'default' : 'outline';
  const baseLinkClass = buttonVariants({ variant, className: 'w-full' });

  if (preview) {
    return (
      <Button type="button" variant={variant} className="pointer-events-none w-full" aria-disabled="true" tabIndex={-1}>
        {content}
      </Button>
    );
  }
  return (
    <Link
      href={`/service-plan?product=${product}`}
      className={cn(baseLinkClass, 'hover:bg-primary/90 active:bg-primary/70 hover:text-primary-foreground group')}
    >
      {content}
    </Link>
  );
}

function PmsPlanCard(props: PackageCardProps) {
  const { plan, TextComponent: Text = PlainText } = props;

  return (
    <Card
      className={`relative flex h-full flex-col overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        plan.isRecommended ? 'border-primary shadow-lg shadow-primary/10' : 'border-border hover:border-primary/60'
      }`}
    >
      {plan.badge && (
        <div
          className={`absolute right-5 top-5 max-w-24 break-words rounded-full px-3 py-1 text-xs font-semibold ${
            plan.isRecommended ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
          }`}
        >
          <Text text={plan.badge} />
        </div>
      )}
      <CardHeader className={plan.badge ? 'pr-28' : undefined}>
        <h3 className="text-xl font-bold text-foreground">
          <Text text={plan.packageName} />
        </h3>
        {plan.subtitle && (
          <p className="text-xs text-muted-foreground">
            <Text text={plan.subtitle} />
          </p>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <PlanPrice {...props} />
        {plan.summary && (
          <p className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-xs font-semibold text-foreground">
            <Text text={plan.summary} />
          </p>
        )}
        <PackageFeatures {...props} />
        {plan.note && (
          <p className="text-[11px] text-muted-foreground/80 italic">
            <Text text={plan.note} />
          </p>
        )}
      </CardContent>
      <CardFooter>
        <PlanAction {...props} />
      </CardFooter>
    </Card>
  );
}

function HrBasePlan(props: PackageCardProps) {
  const { plan, TextComponent: Text = PlainText } = props;
  const price = formatPackagePrice(plan.price);
  const features = getPackageFeatures(plan);
  return (
    <Card className="flex h-full min-w-0 flex-col overflow-hidden border-primary/40 bg-linear-to-br from-primary/5 via-background to-background shadow-lg">
      <CardContent className="flex flex-1 flex-col gap-4 p-6">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            <Text text={plan.badge || '必選基礎套餐'} />
          </div>
          <h3 className="text-2xl font-bold text-foreground">
            <Text text={plan.packageName} />
          </h3>
          {plan.subtitle && (
            <p className="mt-2 text-xs text-muted-foreground">
              <Text text={plan.subtitle} />
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-baseline gap-1">
            <strong className="text-4xl leading-none text-primary">
              {price !== null ? `$${price}` : <Text text="敬請期待" />}
            </strong>
            <span className="text-xs text-muted-foreground">
              HKD / <Text text={plan.billingLabel || (plan.billingMode ? getBillingLabel(plan) : '月起')} />
            </span>
          </div>
          {plan.originalPrice !== undefined && (
            <p className="mt-2 text-xs text-muted-foreground line-through">
              HK$ {formatPackagePrice(plan.originalPrice)}
            </p>
          )}
          {/* <div className="mt-2 text-xs text-muted-foreground">
            <Text text={getCapacityLabel(plan, 'hr')} />
            {Boolean(plan.addUnitPrice) && (
              <span>
                ，+ HK$ {formatPackagePrice(plan.addUnitPrice)} / <Text text="超額員工 / 月" />
              </span>
            )}
          </div> */}
        </div>
        {plan.summary && (
          <p className="text-xs leading-5 text-muted-foreground">
            <Text text={plan.summary} />
          </p>
        )}
        {features.length > 0 && (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-foreground">
            {features.map((feature, index) => (
              <li key={`${feature}-${index}`} className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                <Text text={feature} />
              </li>
            ))}
          </ul>
        )}
        {plan.note && (
          <p className="text-xs leading-5 text-muted-foreground">
            <Text text={plan.note} />
          </p>
        )}
        <div className="mt-auto w-full pt-2">
          <PlanAction {...props} />
        </div>
      </CardContent>
    </Card>
  );
}

function AddonCard(props: PackageCardProps) {
  const { addonActions, plan, product, TextComponent: Text = PlainText } = props;
  const compact = product === 'hr';
  const price = formatPackagePrice(plan.price);
  const features = getPackageFeatures(plan);
  return (
    <Card
      className={cn(
        'relative flex h-full min-w-0 flex-col overflow-hidden bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg',
        compact ? 'border-border hover:border-primary/60' : 'border-primary'
      )}
    >
      {addonActions && <div className="absolute right-3 top-3 z-10 flex gap-1">{addonActions}</div>}
      <CardHeader className={cn(compact && 'p-4 pb-3', addonActions && 'pr-24')}>
        <h4 className={cn('break-words font-bold text-foreground', compact ? 'text-base' : 'text-lg')}>
          <Text text={plan.packageName} />
        </h4>
        {plan.summary && (
          <p className="text-xs leading-5 text-muted-foreground">
            <Text text={plan.summary} />
          </p>
        )}
      </CardHeader>
      <CardContent className={cn('flex-1 space-y-4', compact && 'p-4 pt-0')}>
        <div className="flex flex-wrap items-baseline gap-1">
          {price !== null ? (
            <>
              <strong className={cn('leading-none text-primary', compact ? 'text-2xl' : 'text-3xl')}>+${price}</strong>
              <span className="text-xs text-muted-foreground">
                HKD / <Text text={getAddonBillingLabel(plan)} />
              </span>
            </>
          ) : (
            <strong className="text-xl text-primary">
              <Text text="敬請期待" />
            </strong>
          )}
        </div>
        {features.length > 0 && (
          <ul
            className={cn(
              'space-y-2 text-muted-foreground',
              compact ? 'text-xs' : 'border-t border-border pt-4 text-sm'
            )}
          >
            {features.map((feature, index) => (
              <li key={`${feature}-${index}`} className="flex items-start gap-2.5">
                <SquareCheckBig className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <Text text={feature} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** Both applications render these cards; only text translation and navigation are supplied by the host. */
export function PackageCard(props: PackageCardProps) {
  if (props.plan.packageKind === 'addon') return <AddonCard {...props} />;
  if (props.product === 'hr') {
    return <HrBasePlan {...props} />;
  }
  return <PmsPlanCard {...props} />;
}

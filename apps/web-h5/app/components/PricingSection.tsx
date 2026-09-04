'use client';

import { Button, Card, CardContent, CardFooter, CardHeader } from '@go-tech-frontend/ui';
import type { PackageBizCode, Packages } from '@go-tech/types';
import { Building2, Check, ChevronRight, Puzzle, Users } from 'lucide-react';
import Link from '@/app/components/Link';
import type { PackageCatalog } from '@/app/lib/package-catalog';
import { useProductSelection } from '@/contexts/ProductSelectionContext';
import { DynamicText } from './DynamicI18nText.client';
import { TrialAction } from './trial-action';

const productContent = {
  hr: {
    // eyebrow: 'HR 人力資源系統',
    // title: '基礎套餐加模組，按團隊需要靈活組合',
    // description: '先啟用必需的人事管理，再依薪資、考勤與績效需求擴充。'
    eyebrow: '',
    title: '',
    description: ''
  },
  pms: {
    eyebrow: 'PMS 租務系統',
    title: '簡單透明的方案，隨物業規模靈活升級',
    description: '由基礎租務管理到全模組營運，選擇適合當前規模的套餐。'
  }
} satisfies Record<PackageBizCode, { description: string; eyebrow: string; title: string }>;

const toPrice = (value: number | undefined) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return new Intl.NumberFormat('en-HK', { maximumFractionDigits: 2 }).format(value);
};

const getOriginalPrice = (plan: Packages) => plan.originalPrice ?? plan.displayConfig?.originalPrice;
const getSubtitle = (plan: Packages) => plan.subtitle || plan.displayConfig?.subtitle;
const getSummary = (plan: Packages) => plan.summary || plan.displayConfig?.summary;
const getNote = (plan: Packages) => plan.note || plan.displayConfig?.note;
const getBadge = (plan: Packages) => plan.badge || plan.displayConfig?.badge;

const getFeatures = (plan: Packages) => {
  const configuredFeatures = plan.displayFeatures || plan.displayConfig?.features;
  if (configuredFeatures?.length) return configuredFeatures;

  const items = (plan.packageItemList || []).toSorted(
    (left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0) || left.menuId - right.menuId
  );
  const highlightedItems = items.filter(item => item.isHighlight);
  return Array.from(new Set((highlightedItems.length ? highlightedItems : items).map(item => item.menuTitle))).slice(
    0,
    6
  );
};

const getBillingLabel = (plan: Packages) => {
  if (plan.displayConfig?.billingLabel) return plan.displayConfig.billingLabel;
  if (plan.billingMode === 'employee_month') return '每名員工 / 月';
  if (plan.billingMode === 'unit_month') return '每個單位 / 月';
  if (plan.billingMode === 'month') return '每月收費';
  return '每年收費';
};

const getCapacityLabel = (plan: Packages, product: PackageBizCode) => {
  if (plan.displayConfig?.capacityLabel) return plan.displayConfig.capacityLabel;
  if (!plan.unitCount) return '';
  return product === 'hr' ? `包含 ${plan.unitCount} 名員工` : `最多 ${plan.unitCount} 個物業單位`;
};

const PackageFeatures = ({ plan }: { plan: Packages }) => {
  const features = getFeatures(plan);
  if (features.length === 0) return null;

  return (
    <ul className="space-y-1.5 text-sm text-muted-foreground">
      {features.map(feature => (
        <li key={feature} className="flex items-start gap-3">
          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          </span>
          <DynamicText text={feature} />
        </li>
      ))}
    </ul>
  );
};

const PlanPrice = ({ plan, product }: { plan: Packages; product: PackageBizCode }) => {
  const price = toPrice(plan.price);
  const originalPrice = toPrice(getOriginalPrice(plan));
  const capacityLabel = getCapacityLabel(plan, product);

  return (
    <div>
      <div className="min-h-6 text-sm text-muted-foreground line-through">
        {originalPrice !== null ? `HK$ ${originalPrice}` : null}
      </div>
      {price !== null ? (
        <div className="flex items-end gap-2">
          <span className="text-sm text-muted-foreground">HK$</span>
          <strong className="text-4xl leading-none text-primary">{price}</strong>
        </div>
      ) : (
        <div className="text-2xl font-bold text-primary">
          <DynamicText text="敬請期待" />
        </div>
      )}
      <div className="mt-2 text-sm text-muted-foreground">
        <DynamicText text={getBillingLabel(plan)} />
      </div>
      {capacityLabel ? (
        <div className="mt-3 inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
          <DynamicText text={capacityLabel} />
        </div>
      ) : null}
    </div>
  );
};

const PmsPlanCard = ({ plan }: { plan: Packages }) => {
  const badge = getBadge(plan);
  const note = getNote(plan);
  const summary = getSummary(plan);
  const isRecommended = Boolean(plan.isRecommended ?? plan.displayConfig?.isRecommended);

  return (
    <Card
      className={`relative flex h-full flex-col overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        isRecommended ? 'border-primary shadow-lg shadow-primary/10' : 'border-border hover:border-primary/60'
      }`}
    >
      {badge ? (
        <div
          className={`absolute right-5 top-5 rounded-full px-3 py-1 text-xs font-semibold ${
            isRecommended ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
          }`}
        >
          <DynamicText text={badge} />
        </div>
      ) : null}

      <CardHeader className="pr-28">
        <h3 className="text-xl font-bold text-foreground">
          <DynamicText text={plan.packageName} />
        </h3>
        {getSubtitle(plan) ? (
          <p className="text-xs text-muted-foreground">
            <DynamicText text={getSubtitle(plan) || ''} />
          </p>
        ) : null}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-6">
        <PlanPrice plan={plan} product="pms" />
        {summary ? (
          <p className="min-h-12 border-y border-border py-4 text-sm font-medium leading-6 text-foreground">
            <DynamicText text={summary} />
          </p>
        ) : null}
        <PackageFeatures plan={plan} />
        {note ? (
          <p className="mt-auto rounded-lg bg-muted/70 px-3 py-2 text-xs leading-5 text-muted-foreground">
            <DynamicText text={note} />
          </p>
        ) : null}
      </CardContent>

      <CardFooter>
        <Link href="/service-plan?product=pms" className="w-full">
          <Button variant={isRecommended ? 'default' : 'outline'} className="w-full">
            <DynamicText text="了解此方案" />
            <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

const HrBasePlan = ({ plan }: { plan: Packages }) => {
  const summary = getSummary(plan);
  const note = getNote(plan);

  return (
    <Card className="overflow-hidden border-primary/40 bg-linear-to-br from-primary/5 via-background to-background shadow-lg">
      <CardContent className="grid grid-cols-[1fr_360px] gap-12 p-10">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            <DynamicText text={getBadge(plan) || '必選基礎套餐'} />
          </div>
          <h3 className="text-3xl font-bold text-foreground">
            <DynamicText text={plan.packageName} />
          </h3>
          {getSubtitle(plan) ? (
            <p className="mt-3 text-muted-foreground">
              <DynamicText text={getSubtitle(plan) || ''} />
            </p>
          ) : null}
          {summary ? (
            <p className="mt-5 max-w-2xl text-base leading-7 text-foreground">
              <DynamicText text={summary} />
            </p>
          ) : null}
          <div className="mt-7 max-w-2xl">
            <PackageFeatures plan={plan} />
          </div>
        </div>

        <div className="flex flex-col justify-center rounded-2xl border border-border bg-background/90 p-7 shadow-sm">
          <PlanPrice plan={plan} product="hr" />
          {plan.addUnitPrice ? (
            <div className="mt-5 border-t border-border pt-5 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">+ HK$ {toPrice(plan.addUnitPrice)}</span>
              <span> / </span>
              <DynamicText text="超額員工 / 月" />
            </div>
          ) : null}
          {note ? (
            <p className="mt-5 text-xs leading-5 text-muted-foreground">
              <DynamicText text={note} />
            </p>
          ) : null}
          <Link href="/service-plan?product=hr" className="mt-7 w-full">
            <Button className="w-full">
              <DynamicText text="了解 HR 基礎套餐" />
              <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

const HrAddonCard = ({ addon }: { addon: Packages }) => {
  const summary = getSummary(addon);
  const price = toPrice(addon.price);

  return (
    <Card className="h-full border-border transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg">
      <CardHeader>
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Puzzle className="h-5 w-5" aria-hidden="true" />
        </div>
        <h4 className="text-xl font-bold text-foreground">
          <DynamicText text={addon.packageName} />
        </h4>
        {summary ? (
          <p className="min-h-10 text-sm leading-5 text-muted-foreground">
            <DynamicText text={summary} />
          </p>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex items-baseline gap-1">
          {price !== null ? (
            <>
              <span className="text-sm text-muted-foreground">HK$</span>
              <strong className="text-3xl text-primary">{price}</strong>
              <span className="text-xs text-muted-foreground">
                / <DynamicText text={getBillingLabel(addon)} />
              </span>
            </>
          ) : (
            <strong className="text-xl text-primary">
              <DynamicText text="敬請期待" />
            </strong>
          )}
        </div>
        <PackageFeatures plan={addon} />
      </CardContent>
    </Card>
  );
};

const EmptyCatalog = ({ product }: { product: PackageBizCode }) => (
  <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-8 py-16 text-center">
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
      {product === 'hr' ? <Users aria-hidden="true" /> : <Building2 aria-hidden="true" />}
    </div>
    <h3 className="text-xl font-bold text-foreground">
      <DynamicText text={product === 'hr' ? 'HR 套餐資料準備中' : 'PMS 套餐資料準備中'} />
    </h3>
    <p className="mt-2 text-sm text-muted-foreground">
      <DynamicText text="已預留展示位，啟用套餐資料後將自動顯示。" />
    </p>
  </div>
);

const PricingSection = ({ catalog }: { catalog: PackageCatalog }) => {
  const { product } = useProductSelection();
  const content = productContent[product];
  const packages = catalog[product];
  const plans = packages.filter(plan => (plan.packageKind || 'plan') === 'plan');
  const addons = packages.filter(plan => plan.packageKind === 'addon');
  const featuredHrPlan = plans.find(plan => plan.isFeatured ?? plan.displayConfig?.isFeatured) || plans[0];

  const renderHeader = () => {
    if (!content) return null;

    if (content.eyebrow || content.title || content.description) {
      return (
        <header className="mx-auto mb-12 max-w-3xl text-center">
          <div className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            <DynamicText text={content.eyebrow} />
          </div>
          <h2 className="text-2xl font-bold leading-tight text-foreground">
            <DynamicText text={content.title} />
          </h2>
          <p className="text-xs text-muted-foreground">
            <DynamicText text={content.description} />
          </p>
        </header>
      );
    }
  };

  return (
    <section className="bg-background pb-10" data-package-product={product}>
      <div className="mx-auto w-[1280px] min-w-[1280px] max-w-[1280px] px-0">
        {renderHeader()}

        {plans.length === 0 ? <EmptyCatalog product={product} /> : null}

        {product === 'pms' && plans.length > 0 ? (
          <div className="grid grid-cols-3 items-stretch max-w-5xl gap-5 mx-auto">
            {plans.map(plan => (
              <PmsPlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        ) : null}

        {product === 'hr' && featuredHrPlan ? (
          <div className="space-y-10">
            <HrBasePlan plan={featuredHrPlan} />
            <div>
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <div className="text-sm font-semibold text-primary">
                    <DynamicText text="可選附加模組" />
                  </div>
                  <h3 className="mt-1 text-2xl font-bold text-foreground">
                    <DynamicText text="按需擴充您的 HR 能力" />
                  </h3>
                </div>
                {addons.length > 0 ? (
                  <span className="text-sm text-muted-foreground">
                    <DynamicText text="模組可獨立加購" />
                  </span>
                ) : null}
              </div>

              {addons.length > 0 ? (
                <div className="grid grid-cols-3 gap-6">
                  {addons.map(addon => (
                    <HrAddonCard key={addon.id} addon={addon} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-8 py-10 text-center text-sm text-muted-foreground">
                  <DynamicText text="附加模組資料準備中，啟用後將在此顯示。" />
                </div>
              )}
            </div>
          </div>
        ) : null}

        <div className="mt-12 space-y-4 text-center">
          <Link
            href={`/pricing-plan?product=${product}`}
            className="inline-flex items-center text-base font-bold text-foreground underline underline-offset-4 transition-colors hover:text-primary"
          >
            <DynamicText text="查看完整的定價方案" />
            <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
          </Link>
          <div>
            {product === 'pms' ? (
              <TrialAction appearance="button">
                <DynamicText text="立即開始14天免費試用" />
              </TrialAction>
            ) : (
              <Link href="/service-plan?product=hr">
                <Button>
                  <DynamicText text="查看 HR 套餐詳情" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;

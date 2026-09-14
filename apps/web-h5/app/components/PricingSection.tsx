'use client';

import { Button } from '@go-tech-frontend/ui';
import { PackageCard } from '@go-tech/package-ui';
import type { PackageBizCode } from '@go-tech/types';
import { Building2, ChevronRight, Users } from 'lucide-react';
import Link from '@/app/components/Link';
import { getFeaturedHrPlan, toAddonCardPlan, toPackageCardPlan } from '@/app/lib/package-card-plan';
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

  const plans = packages.filter(plan => (plan.detail?.packageKind || 'plan') === 'plan');
  const featuredHrPlan = getFeaturedHrPlan(packages);
  const addons = featuredHrPlan?.additionalItems ?? [];

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
            {plans.map((plan, i) => (
              <PackageCard
                key={plan.packageCode ?? i}
                plan={toPackageCardPlan(plan)}
                product="pms"
                TextComponent={DynamicText}
                LinkComponent={Link}
              />
            ))}
          </div>
        ) : null}

        {product === 'hr' && featuredHrPlan ? (
          <div className="max-w-6xl mx-auto animate-fade-in grid lg:grid-cols-[1.05fr_1.35fr] gap-6 items-stretch">
            <PackageCard
              plan={toPackageCardPlan(featuredHrPlan)}
              product="hr"
              TextComponent={DynamicText}
              LinkComponent={Link}
            />
            <div className="flex min-w-0 flex-col">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    <DynamicText text="附加模塊" />
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <DynamicText text="按需要選擇適合團隊的附加功能" />
                  </p>
                </div>
                {addons.length > 0 ? (
                  <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    <DynamicText text="按需加購" />
                  </span>
                ) : null}
              </div>

              {addons.length > 0 ? (
                <div className="grid flex-1 auto-rows-fr grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
                  {addons.map((addon, index) => (
                    <PackageCard
                      key={addon.id ?? `${addon.itemName}-${index}`}
                      plan={toAddonCardPlan(addon, 'hr')}
                      product="hr"
                      TextComponent={DynamicText}
                      LinkComponent={Link}
                    />
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
            prefetch={false}
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

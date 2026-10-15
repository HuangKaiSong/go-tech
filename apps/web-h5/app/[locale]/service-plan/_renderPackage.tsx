'use client';

import { Button } from '@go-tech-frontend/ui';
import type { PackageBizCode, Packages } from '@go-tech/types';
import { ArrowLeft, Building2, Users } from 'lucide-react';
import { useProgressRouter } from '@/app/hooks/use-progress-router';
import { getFeaturedPlan } from '@/app/lib/package-card-plan';
import { DynamicText } from '../../components/DynamicI18nText.client';
import { ServicePackages } from './service-packages';

import { cn } from '@go-tech/web-ui';
import type { ExtendedPackages } from './service-plan-data';

export default function Page({ packages, product }: { packages: ExtendedPackages[]; product: PackageBizCode }) {
  const router = useProgressRouter();
  // const hrPlan = product === 'hr' ? getFeaturedPlan(packages) : undefined;
  const Plan = getFeaturedPlan(packages);
  const hrAddonNames = Plan?.additionalItems?.map(addon => addon.itemName).join('、');

  const handleSelectPlan = (plan: Packages) => {
    const price = plan.price;
    if (typeof price === 'number') {
      router.push(`/select-plan/${plan.packageCode}?product=${product}`);
    }
  };

  const handleReselect = () => {
    router.replace('/service-plan', { preserveProduct: false });
  };

  return (
    <section className="pt-10 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-6xl mx-auto">
          <Button
            className={cn('self-start', product === 'pms' ? 'mb-6' : '')}
            variant="ghost"
            onClick={handleReselect}
          >
            <ArrowLeft />
            <DynamicText text="重新選擇系統" />
          </Button>
          <div
            role="tablist"
            aria-label="選擇系統"
            className="w-fit self-center flex rounded-full border border-border bg-muted/50 p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={product === 'pms'}
              onClick={() => router.replace('/service-plan?product=pms')}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                product === 'pms' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Building2 className="h-4 w-4" aria-hidden="true" />
              <DynamicText text="PMS 租務系統" />
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={product === 'hr'}
              onClick={() => router.replace('/service-plan?product=hr')}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                product === 'hr' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              <DynamicText text="HR 人力資源系統" />
            </button>
          </div>
        </div>
        <div className={`text-center mt-8 mx-auto ${product === 'hr' ? 'max-w-4xl' : 'max-w-2xl'}`}>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            <DynamicText text={product === 'hr' ? 'GO-HR 人力資源管理系統' : 'GO-PMS 物業租務管理系統'} />
          </h2>
          <p className="text-muted-foreground text-sm">
            <DynamicText
              text={
                product === 'hr'
                  ? `以「${Plan?.packageName || '基礎版'}」為兜底套餐（包含人事管理功能），再按需加購${hrAddonNames || '適合團隊的附加模塊'}。`
                  : '按物業單位數量開通，涵蓋租約、單位、水電、會計等完整租務流程。'
              }
            />
          </p>
        </div>
        {packages.length === 0 ? (
          <div className="mx-auto max-w-4xl rounded-2xl border border-dashed border-border bg-muted/30 px-8 py-16 my-16 text-center">
            <h2 className="text-2xl font-bold text-foreground">
              <DynamicText text={product === 'hr' ? 'HR 套餐資料準備中' : 'PMS 套餐資料準備中'} />
            </h2>
          </div>
        ) : null}
        {Plan ? <ServicePackages plan={Plan} product={product} onSelect={handleSelectPlan} /> : null}
      </div>
    </section>
  );
}

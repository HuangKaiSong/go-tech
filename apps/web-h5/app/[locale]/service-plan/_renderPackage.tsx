'use client';

import { Button, Card, CardContent, CardHeader } from '@go-tech-frontend/ui';
import type { PackageBizCode, Packages } from '@go-tech/types';
import { ArrowLeft, Building2, Settings, Users } from 'lucide-react';
import { useProgressRouter } from '@/app/hooks/use-progress-router';
import { getFeaturedHrPlan } from '@/app/lib/package-card-plan';
import { DynamicText } from '../../components/DynamicI18nText.client';
import { HrServicePackages } from './hr-service-packages';

import type { ExtendedPackages } from './service-plan-data';

const getIconHref = (value: string) => {
  const normalized = value
    .trim()
    .replace(/^#/, '')
    .replace(/^icon-/, '');
  return `#icon-${normalized}`;
};

export default function Page({ packages, product }: { packages: ExtendedPackages[]; product: PackageBizCode }) {
  const router = useProgressRouter();
  const hrPlan = product === 'hr' ? getFeaturedHrPlan(packages) : undefined;
  const hrAddonNames = hrPlan?.additionalItems?.map(addon => addon.itemName).join('、');

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
          <Button className={product === 'pms' ? 'mb-6' : undefined} variant="ghost" onClick={handleReselect}>
            <ArrowLeft />
            <DynamicText text="重新選擇系統" />
          </Button>
          <div
            role="tablist"
            aria-label="選擇系統"
            className="inline-flex rounded-full border border-border bg-muted/50 p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={product === 'pms'}
              onClick={() => router.replace('/service-plan?product=pms')}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
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
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
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
                  ? `以「${hrPlan?.packageName || '基礎版'}」為兜底套餐（包含人事管理功能），再按需加購${hrAddonNames || '適合團隊的附加模塊'}。`
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
        {hrPlan ? <HrServicePackages plan={hrPlan} onSelect={handleSelectPlan} /> : null}
        {product === 'pms' && packages.length > 0 ? (
          <div className="py-16 bg-background">
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {packages.map((plan, index) => {
                // Button colors for each plan
                const buttonColors = [
                  'bg-[#F9881E] hover:bg-[#F9881E]/90', // 套餐A
                  '', // 套餐B - use default
                  'bg-[#35304A] hover:bg-[#35304A]/90' // 套餐C
                ];

                // 包含功能 row background colors
                const featureRowColors = [
                  'bg-[#FEE7D2]', // 套餐A
                  'bg-[#FDDCD2]', // 套餐B
                  'bg-[#D7D6DB]' // 套餐C
                ];

                return (
                  <Card
                    key={plan.packageCode}
                    className="border border-border hover:shadow-xl transition-shadow duration-300"
                  >
                    <CardHeader className="text-center pb-4 pt-8">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Settings className="w-6 h-6 text-primary" />
                        <h3 className="text-2xl font-bold text-foreground">
                          <DynamicText text={plan.packageName} />
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <DynamicText text={`最多可創建${plan.detail?.dataCount}個單位`} />
                      </p>
                    </CardHeader>

                    <CardContent className="text-center">
                      <div className="mb-6">
                        {typeof plan.price === 'number' ? (
                          <>
                            <span className="text-3xl font-bold text-primary">${plan.price}</span>
                            <span className="text-lg text-primary ml-1">HKD</span>
                          </>
                        ) : (
                          <span className="text-3xl font-bold text-primary">
                            <DynamicText text="敬請期待" />
                          </span>
                        )}
                      </div>

                      <Button className={`w-full mb-6 ${buttonColors[index]}`} onClick={() => handleSelectPlan(plan)}>
                        <DynamicText text={`選擇${plan.packageName}`} />
                      </Button>

                      <div
                        className={`text-center mb-4 py-2 px-3 rounded-md min-h-13 flex flex-col justify-center ${featureRowColors[index]}`}
                      >
                        <span className="text-sm font-medium text-foreground">
                          <DynamicText text="包含功能" />
                        </span>
                        {plan.upgradeNote && (
                          <p className="text-xs text-primary/80 mt-1">
                            <DynamicText text={plan.upgradeNote} />
                          </p>
                        )}
                      </div>

                      <div className="text-left">
                        {plan.newPackageItemList.map((feature, fIndex) => (
                          <div
                            key={fIndex}
                            className={`flex items-center gap-3 py-2 px-2 ${fIndex % 2 === 1 ? 'bg-secondary' : ''}`}
                          >
                            {feature.menuIcon && (
                              <svg className="svg-icon w-4 h-4 text-primary mr-1" aria-hidden="true">
                                <use href={getIconHref(feature.menuIcon)} xlinkHref={getIconHref(feature.menuIcon)} />
                              </svg>
                            )}
                            {/* <feature.icon className="w-4 h-4 text-primary" /> */}
                            <span className="text-sm text-muted-foreground">
                              <DynamicText text={feature.menuTitle} />
                            </span>
                          </div>
                        ))}

                        {plan.newFeatures?.length > 0 && (
                          <>
                            <div className="pt-2 pb-1 px-2 text-xs text-primary font-medium text-center">
                              <DynamicText text="以下為新增功能：" />
                            </div>
                            {plan.newFeatures?.map((feature, fIndex) => (
                              <div
                                key={fIndex}
                                className={`flex items-center gap-3 py-2 px-2 ${fIndex % 2 === 1 ? 'bg-secondary' : ''}`}
                              >
                                {feature.icon && (
                                  <svg className="svg-icon w-4 h-4 text-primary mr-1" aria-hidden="true">
                                    <use href={getIconHref(feature.icon)} xlinkHref={getIconHref(feature.icon)} />
                                  </svg>
                                )}
                                <span className="text-sm text-muted-foreground">
                                  <DynamicText text={feature.label} />
                                </span>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

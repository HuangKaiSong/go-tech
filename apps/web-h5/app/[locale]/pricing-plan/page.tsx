'use client';

import { Button } from '@go-tech-frontend/ui';
import type { PackageBizCode } from '@go-tech/types';
import { cn } from '@go-tech/utils';
import { Building2, Check, Minus, Users } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import Footer from '@/app/components/Footer';
import Header from '@/app/components/Header';
import { DynamicText } from '../../components/DynamicI18nText.client';
import type { PricingPlanData } from './types';

const getIconHref = (value: string) => {
  const normalized = value
    .trim()
    .replace(/^#/, '')
    .replace(/^icon-/, '');
  return `#icon-${normalized}`;
};

const MIN_GRID_COLS = 2;

const PricingPlan = ({ pricingCatalog }: { pricingCatalog: Record<PackageBizCode, PricingPlanData> }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const product: PackageBizCode = searchParams.get('product') === 'hr' ? 'hr' : 'pms';
  const pricingData = pricingCatalog[product];

  const gridLength = pricingData.plans.length;
  const gridColCalss = `grid-cols-${MIN_GRID_COLS + gridLength}`;

  const selectProduct = (nextProduct: PackageBizCode) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('product', nextProduct);
    window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background" data-pricing-product={product}>
      <Header />

      {/* Hero Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center">
          <div
            role="tablist"
            aria-label="選擇系統"
            className="mb-8 inline-flex rounded-full border border-border bg-muted/50 p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={product === 'pms'}
              onClick={() => selectProduct('pms')}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                product === 'pms' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Building2 className="h-4 w-4" aria-hidden="true" />
              PMS 租務系統
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={product === 'hr'}
              onClick={() => selectProduct('hr')}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                product === 'hr' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              HR 人力資源系統
            </button>
          </div>
          <h1 className="text-6xl font-bold text-primary mb-4">
            <DynamicText text="計劃適合你的商業" />
          </h1>
          <p className="text-muted-foreground text-3xl mt-6">
            <DynamicText
              text={
                product === 'hr'
                  ? '比較 HR 基礎套餐、員工容量與可選附加模組'
                  : '所有定價計劃均涵蓋租務系統基本功能，並且還有增長空間'
              }
            />
          </p>
        </div>
      </section>

      {/* Pricing Table Section */}
      <section className="py-12 bg-background">
        {gridLength === 0 ? (
          <div className="container mx-auto rounded-2xl border border-dashed border-border bg-muted/30 px-8 py-16 text-center">
            <h2 className="text-2xl font-bold text-foreground">
              <DynamicText text={product === 'hr' ? 'HR 套餐資料準備中' : 'PMS 套餐資料準備中'} />
            </h2>
          </div>
        ) : null}
        {gridLength > 0 ? (
          <div className="container mx-auto px-15 py-10 bg-primary/20 rounded-lg">
            <div className="overflow-x-auto">
              <div className="border border-primary/40 bg-primary-foreground rounded-lg overflow-hidden min-w-200">
                {/* Header Row */}
                <div className={cn(gridColCalss, 'grid bg-muted/30')}>
                  <div className="border-r border-primary/40 grid grid-rows-7 text-center items-center">
                    <div className="row-span-4 py-4 text-3xl font-bold text-foreground self-end">
                      <DynamicText text="月費" />
                    </div>
                    <div className="h-full flex items-center justify-center text-muted-foreground mt-1 border-y border-primary/40">
                      <DynamicText text={product === 'hr' ? '支援員工數目' : '支援單位數目'} />
                    </div>
                    <div className="h-full flex items-center justify-center text-muted-foreground border-b border-primary/40">
                      <DynamicText text={product === 'hr' ? '超額員工' : '另購外新增單位'} />
                    </div>
                  </div>
                  <div className="p-4 border-r border-primary/40 grid grid-rows-7 text-center items-center">
                    <div className="row-span-3 text-3xl font-bold text-foreground">
                      <DynamicText text="功能" />
                    </div>
                  </div>
                  {pricingData.plans.map(plan => (
                    <div
                      key={plan.id}
                      className="p-4 border-r border-primary/40 last:border-r-0 grid grid-rows-7 text-center items-center"
                    >
                      <div className="row-span-3 text-3xl font-bold mb-1">
                        <DynamicText text={plan.name} />
                      </div>
                      <div className="text-3xl font-bold text-primary">{plan.price}</div>
                      <div className="h-full flex items-center justify-center text-muted-foreground mt-2">
                        {plan.units}
                      </div>
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        {/* <DynamicText text={plan.extra} /> */}-
                      </div>
                      <Button size="sm" className="mt-3 ">
                        <DynamicText text={`購買${plan.name}`} />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Feature Categories */}
                {pricingData.categories.map((category, catIndex) => {
                  const featuresLangth = category.features.length;

                  return (
                    <div
                      key={catIndex}
                      className={`border-t last:border-b-0 border-primary/40 box-border grid grid-rows-${featuresLangth} relative`}
                    >
                      {category.features.map((feature, fIndex) => {
                        return (
                          <div
                            key={`${catIndex}-${fIndex}`}
                            className={cn(
                              gridColCalss,
                              'grid hover:bg-muted/40 transition-colors border-b border-primary/40 last:border-none'
                            )}
                          >
                            <div className="border-r border-primary/40 flex items-center">
                              <div className="w-14 font-medium text-primary" />
                              {fIndex === 0 && (
                                <div className="absolute w-14 top-0 left-0 bg-primary-foreground bottom-0 font-medium text-primary border-r border-primary/40">
                                  <div className="w-full h-full flex items-center justify-center">
                                    <span style={{ writingMode: 'vertical-rl' }} className="tracking-widest">
                                      <DynamicText text={category.name} />
                                    </span>
                                  </div>
                                </div>
                              )}
                              <div className="flex-1 h-full flex flex-row items-center justify-center text-block/70 border-primary/40">
                                {feature.icon && (
                                  <svg className="svg-icon text-primary mr-1" aria-hidden="true">
                                    <use href={getIconHref(feature.icon)} xlinkHref={getIconHref(feature.icon)} />
                                  </svg>
                                )}
                                <div>
                                  <DynamicText text={feature.name} />
                                </div>
                              </div>
                            </div>
                            <div className="p-3 border-r border-primary/40 text-center">
                              <span className="text-muted-foreground">
                                <DynamicText text={feature.type} />
                              </span>
                            </div>
                            {feature.plans.map((available, pIndex) => (
                              <div
                                key={pIndex}
                                className="p-3 flex items-center justify-center border-r border-primary/40 last:border-r-0"
                              >
                                {available ? (
                                  <Check className="w-5 h-5 text-primary" />
                                ) : (
                                  <Minus className="w-5 h-5 text-muted-foreground" />
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

                {/* Add-ons Section */}
                {pricingData.addons.map((addon, aIndex) => {
                  return (
                    <div key={aIndex} className={cn(gridColCalss, 'grid border-t border-primary/40 bg-muted/10')}>
                      <div className="col-span-2 flex items-stretch border-r border-primary/40">
                        <div
                          className="flex w-14 items-center justify-center font-medium tracking-widest text-primary border-r border-primary/40"
                          style={{ writingMode: 'vertical-rl' }}
                        >
                          <div className="p-3">
                            <DynamicText text={addon.name} />
                          </div>
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                          <div className="grid h-full flex-1 auto-rows-[minmax(2.75rem,auto)] divide-y divide-primary/40">
                            {addon.features.map((f, i) => (
                              <div
                                key={i}
                                className="flex min-h-11 w-full items-center justify-center text-muted-foreground"
                              >
                                <DynamicText text={f} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      {addon.prices.map((price, pIndex) => (
                        <div
                          key={pIndex}
                          className="p-3 flex items-center justify-center border-r border-primary/40 last:border-r-0 text-primary"
                        >
                          +{price} each
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <Footer />
    </div>
  );
};

export default PricingPlan;

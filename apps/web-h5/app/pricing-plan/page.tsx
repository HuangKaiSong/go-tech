'use client'

import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import { Button } from "@go-tech-frontend/ui";
import { Check, Minus } from "lucide-react";
import { PricingPlanData } from "./layout";

const PricingPlan = ({pricingData}: { pricingData: PricingPlanData }) => {
  const getIconHref = (value: string) => {
    const normalized = value.trim().replace(/^#/, '').replace(/^icon-/, '');
    return `#icon-${normalized}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-6xl font-bold text-primary mb-4">
            計劃適合你的商業
          </h1>
          <p className="text-muted-foreground text-3xl mt-6">
            所有定價計劃均涵蓋租務系統基本功能，並且還有增長空間
          </p>
        </div>
      </section>

      {/* Pricing Table Section */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-15 py-10 bg-primary/20 rounded-lg">
          <div className="overflow-x-auto">
            <div className="border border-primary/40 bg-primary-foreground rounded-lg overflow-hidden min-w-200">
              {/* Header Row */}
              <div className="grid grid-cols-5 bg-muted/30">
                <div className="border-r border-primary/40 grid grid-rows-7 text-center items-center">
                  <div className="row-span-4 py-4 text-3xl font-bold text-foreground self-end">
                    月費
                  </div>
                  <div className="h-full flex items-center justify-center text-muted-foreground mt-1 border-y border-primary/40">
                    支援單位數目
                  </div>
                  <div className="h-full flex items-center justify-center text-muted-foreground border-b border-primary/40">
                    另購外新增單位
                  </div>
                </div>
                <div className="p-4 border-r border-primary/40 grid grid-rows-7 text-center items-center">
                  <div className="row-span-3 text-3xl font-bold text-foreground">
                    功能
                  </div>
                </div>
                {pricingData.plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="p-4 border-r border-primary/40 last:border-r-0 grid grid-rows-7 text-center items-center"
                  >
                    <div className="row-span-3 text-3xl font-bold mb-1">
                      {plan.name}
                    </div>
                    <div className="text-3xl font-bold text-primary">
                      {plan.price}
                    </div>
                    <div className="h-full flex items-center justify-center text-muted-foreground mt-2">
                      {plan.units}
                    </div>
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      {plan.extra}
                    </div>
                    <Button size="sm" className="mt-3 ">
                      購買{plan.name}
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
                          className={`grid grid-cols-5 hover:bg-muted/40 transition-colors border-b border-primary/40 last:border-none`}
                        >
                          <div className="border-r border-primary/40 flex items-center">
                            <div className="w-14 font-medium text-primary"></div>
                            {fIndex === 0 && (
                              <div className="absolute w-14 top-0 left-0 bg-primary-foreground bottom-0 font-medium text-primary border-r border-primary/40">
                                <div className="w-full h-full flex items-center justify-center">
                                  <span
                                    style={{ writingMode: "vertical-rl" }}
                                    className="tracking-widest"
                                  >
                                    {category.name}
                                  </span>
                                </div>
                              </div>
                            )}
                            <div className="flex-1 h-full flex flex-row items-center justify-center text-foreground border-primary/40">
                              {feature.icon && (
                                <svg className="svg-icon text-primary mr-1" aria-hidden="true">
                                  <use href={getIconHref(feature.icon)} xlinkHref={getIconHref(feature.icon)}></use>
                                </svg>
                              )}
                              <div>{feature.name}</div>
                            </div>
                          </div>
                          <div className="p-3 border-r border-primary/40 text-center">
                            <span className="text-muted-foreground">
                              {feature.type}
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
                const addonLength = addon.features.length;
                return (
                  <div
                    key={aIndex}
                    className="grid grid-cols-5 border-t border-primary/40 bg-muted/10"
                  >
                    <div
                      className={`col-span-1 border-r border-primary/40 flex items-center justify-center`}
                    >
                      <div
                        className="w-14 font-medium text-primary tracking-widest border-r border-primary/40"
                        style={{ writingMode: "vertical-rl" }}
                      >
                        <div className="p-3">{addon.name}</div>
                      </div>
                      <div
                        className={`flex-1 h-full grid grid-rows-${addonLength} divide-y divide-primary/40`}
                      >
                        {addon.features.map((f, i) => (
                          <div
                            key={i}
                            className="w-full h-full text-muted-foreground flex justify-center items-center"
                          >
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border-r border-primary/40"></div>
                    {addon.prices.map((price, pIndex) => (
                      <div
                        key={pIndex}
                        className="p-3 flex items-center justify-center border-r border-primary/40 last:border-r-0  text-primary"
                      >
                        {price}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PricingPlan;

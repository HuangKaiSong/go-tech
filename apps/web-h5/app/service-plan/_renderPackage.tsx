'use client';

import { Button, Card, CardContent, CardHeader } from '@go-tech-frontend/ui';
import { Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

type ExtendedPackages = Packages & {
  newFeatures: { icon?: any; label: string }[];
  newPackageItemList: { menuIcon: string; menuId: number; menuTitle: string }[];
  upgradeNote: string | null;
};

const getIconHref = (value: string) => {
  const normalized = value
    .trim()
    .replace(/^#/, '')
    .replace(/^icon-/, '');
  return `#icon-${normalized}`;
};

export default function Page({ packages }: { packages: ExtendedPackages[] }) {
  const router = useRouter();

  const handleSelectPlan = (plan: ExtendedPackages) => {
    const price = plan.price;
    if (price) {
      router.push(`/select-plan/${plan.id}`);
    }
  };

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
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
              <Card key={index} className="border border-border hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="text-center pb-4 pt-8">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Settings className="w-6 h-6 text-primary" />
                    <h3 className="text-2xl font-bold text-foreground">{plan.packageName}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">最多可創建{plan.unitCount}個單位</p>
                </CardHeader>

                <CardContent className="text-center">
                  <div className="mb-6">
                    {plan.price ? (
                      <>
                        <span className="text-3xl font-bold text-primary">${plan.price}</span>
                        <span className="text-lg text-primary ml-1">HKD</span>
                      </>
                    ) : (
                      <span className="text-3xl font-bold text-primary">敬請期待</span>
                    )}
                  </div>

                  <Button className={`w-full mb-6 ${buttonColors[index]}`} onClick={() => handleSelectPlan(plan)}>
                    選擇{plan.packageName}
                  </Button>

                  <div
                    className={`text-center mb-4 py-2 px-3 rounded-md min-h-13 flex flex-col justify-center ${featureRowColors[index]}`}
                  >
                    <span className="text-sm font-medium text-foreground">包含功能</span>
                    {plan.upgradeNote && <p className="text-xs text-primary/80 mt-1">{plan.upgradeNote}</p>}
                  </div>

                  <div className="text-left">
                    {plan.newPackageItemList?.map((feature, fIndex) => (
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
                        <span className="text-sm text-muted-foreground">{feature.menuTitle}</span>
                      </div>
                    ))}

                    {plan.newFeatures?.length > 0 && (
                      <>
                        <div className="pt-2 pb-1 px-2 text-xs text-primary font-medium text-center">
                          以下為新增功能：
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
                            <span className="text-sm text-muted-foreground">{feature.label}</span>
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
    </section>
  );
}

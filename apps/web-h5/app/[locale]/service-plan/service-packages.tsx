import { Card, CardContent, CardHeader } from '@go-tech-frontend/ui';
import { formatPackagePrice, getAddonBillingLabel, getPackageFeatures } from '@go-tech/package-ui/model';
import type { PackageBizCode, Packages } from '@go-tech/types';
import { SquareCheckBig } from 'lucide-react';
import { BasePackage } from '@/app/components/base-package';
import { DynamicText } from '@/app/components/DynamicI18nText.client';
import SwipeRow from '@/app/components/SwipeRow';
import { toAddonCardPlan } from '@/app/lib/package-card-plan';

function FeatureIcon({ icon }: { icon?: string }) {
  if (!icon) return <SquareCheckBig className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />;
  const href = `#icon-${icon
    .trim()
    .replace(/^#/, '')
    .replace(/^icon-/, '')}`;
  return (
    <svg className="svg-icon h-4 w-4 shrink-0 text-primary" aria-hidden="true">
      <use href={href} />
    </svg>
  );
}

export function ServicePackages({
  onSelect,
  plan,
  product
}: {
  onSelect: (plan: Packages) => void;
  plan: Packages;
  product: PackageBizCode;
}) {
  const addons = plan.additionalItems ?? [];
  const isHr = product === 'hr';
  const capacityUnit = isHr ? '名員工' : '個單位';

  return (
    <div className="mx-auto grid max-w-6xl items-start gap-6 py-10 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:py-16">
      <BasePackage plan={plan} product={product} onSelect={onSelect} />

      <div className="min-w-0">
        <div className="mb-5">
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-widest text-primary">
            ADD-ON MODULES
          </span>
          <h3 className="mt-2 text-xl font-bold text-foreground">
            <DynamicText text={`可加購的附加模塊（按每${capacityUnit}計費）`} />
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            <DynamicText
              text={`在基礎版之上按需加購，模塊費用 = 單價 × ${isHr ? '員工人數' : '單位數量'} × 開通月份，下一步可即時計算。`}
            />
          </p>
        </div>
        {addons.length > 0 ? (
          <SwipeRow className="flex md:grid md:grid-cols-3 md:gap-5 overflow-x-auto md:overflow-visible snap-x snap-mandatory -mx-4 px-4 md:mx-auto md:px-0 gap-4 pb-3 md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:shrink-0 [&>*]:basis-[85%] [&>*]:snap-center md:[&>*]:basis-auto">
            {addons.map((addon, index) => {
              const card = toAddonCardPlan(addon, product);
              const addonPrice = formatPackagePrice(card.price);
              const addonFeatures = getPackageFeatures(card);
              return (
                <Card
                  key={addon.id ?? `${addon.itemName}-${index}`}
                  className="flex min-w-0 flex-col border-border bg-card transition-shadow hover:shadow-md"
                >
                  <CardHeader className="p-5 pb-6">
                    <h4 className="break-words text-base font-bold text-foreground">
                      <DynamicText text={card.packageName} />
                    </h4>
                    <p className="min-h-10 text-xs leading-5 text-muted-foreground">
                      <DynamicText text={card.summary || ''} />
                    </p>
                  </CardHeader>
                  <CardContent className="flex-1 px-5 pb-6">
                    <div className="mb-4 flex flex-wrap items-baseline gap-1">
                      <strong className="text-2xl font-bold text-primary">
                        {addonPrice !== null ? `+$${addonPrice}` : <DynamicText text="敬請期待" />}
                      </strong>
                      <span className="text-xs text-muted-foreground">
                        HKD / <DynamicText text={getAddonBillingLabel(card)} />
                      </span>
                    </div>
                    {addonFeatures.length > 0 && (
                      <ul className="space-y-2.5 border-t border-border pt-4">
                        {addonFeatures.map((feature, featureIndex) => (
                          <li
                            key={`${feature}-${featureIndex}`}
                            className="flex items-start gap-2.5 text-sm text-muted-foreground"
                          >
                            <FeatureIcon
                              icon={addon.detail?.menu?.find(item => item.menuTitle === feature)?.menuIcon}
                            />
                            <DynamicText text={feature} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </SwipeRow>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
            <DynamicText text="附加模塊資料準備中" />
          </div>
        )}
      </div>
    </div>
  );
}

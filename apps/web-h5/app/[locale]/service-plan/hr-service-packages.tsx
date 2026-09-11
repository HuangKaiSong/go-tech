import { Button, Card, CardContent, CardHeader } from '@go-tech-frontend/ui';
import { formatPackagePrice, getAddonBillingLabel, getPackageFeatures } from '@go-tech/package-ui/model';
import type { Packages } from '@go-tech/types';
import { ArrowRight, MousePointerClick, Settings, SquareCheckBig } from 'lucide-react';
import { DynamicText } from '@/app/components/DynamicI18nText.client';
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

export function HrServicePackages({ onSelect, plan }: { onSelect: (plan: Packages) => void; plan: Packages }) {
  const detail = plan.detail ?? {};
  const addons = plan.additionalItems ?? [];
  const price = formatPackagePrice(plan.price);
  const features = detail.features?.length ? detail.features : (detail.menu ?? []).map(item => item.menuTitle);

  return (
    <div className="mx-auto grid max-w-7xl items-start gap-6 py-10 lg:grid-cols-[290px_minmax(0,1fr)] lg:py-16">
      <Card className="min-w-0 overflow-hidden border-2 border-primary bg-card shadow-sm">
        <CardHeader className="space-y-3 p-6 pb-4">
          <span className="w-fit rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            <DynamicText text="必選 · 兜底套餐" />
          </span>
          <h3 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Settings className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <DynamicText text={plan.packageName} />
          </h3>
          <p className="text-xs leading-5 text-muted-foreground">
            <DynamicText
              text={
                detail.capacityLabel ||
                (detail.dataCount !== undefined ? `包含 ${detail.dataCount} 名員工` : '按套餐配置開通人事管理功能')
              }
            />
          </p>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6">
          <div className="flex flex-wrap items-baseline gap-1 text-primary">
            <strong className="text-3xl font-bold">
              {price !== null ? `$${price}` : <DynamicText text="敬請期待" />}
            </strong>
            <span className="text-xs">
              HKD / <DynamicText text={detail.billingLabel || '月起'} />
            </span>
          </div>
          <div>
            <Button
              className="h-auto min-h-11 w-full gap-2 whitespace-normal bg-linear-to-r from-primary to-orange-400 px-3 py-3 text-sm font-bold shadow-sm hover:opacity-90"
              onClick={() => onSelect(plan)}
              disabled={price === null}
            >
              <MousePointerClick className="h-4 w-4 shrink-0" aria-hidden="true" />
              <DynamicText text={`選擇${plan.packageName}並加購模塊`} />
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Button>
            <p className="mt-2 text-center text-xs font-medium leading-5 text-primary">
              <DynamicText text="第一步：點此開始 · 下一頁可自由加購模塊" />
            </p>
          </div>
          <div className="rounded-md bg-primary/15 px-3 py-3 text-center text-sm font-medium text-foreground">
            <DynamicText text={detail.summary || '包含人事管理功能'} />
          </div>
          <ul className="space-y-1">
            {features.map((feature, index) => (
              <li
                key={`${feature}-${index}`}
                className="flex items-start gap-3 rounded-sm px-2 py-2 text-sm text-muted-foreground even:bg-muted/50"
              >
                <FeatureIcon icon={detail.menu?.find(item => item.menuTitle === feature)?.menuIcon} />
                <DynamicText text={feature} />
              </li>
            ))}
          </ul>
          {detail.remind && (
            <p className="text-xs leading-5 text-muted-foreground">
              <DynamicText text={detail.remind} />
            </p>
          )}
        </CardContent>
      </Card>

      <div className="min-w-0">
        <div className="mb-5">
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-widest text-primary">
            ADD-ON MODULES
          </span>
          <h3 className="mt-2 text-xl font-bold text-foreground">
            <DynamicText text="可加購的附加模塊（按每名員工計費）" />
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            <DynamicText text="在基礎版之上按需加購，模塊費用 = 單價 × 員工人數 × 開通月份，下一步可即時計算。" />
          </p>
        </div>
        {addons.length > 0 ? (
          <div className="grid auto-rows-fr gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {addons.map((addon, index) => {
              const card = toAddonCardPlan(addon, 'hr');
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
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
            <DynamicText text="附加模塊資料準備中" />
          </div>
        )}
      </div>
    </div>
  );
}

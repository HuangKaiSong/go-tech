import { Button, Card, CardContent, CardFooter, CardHeader } from '@go-tech-frontend/ui';
import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from '@/app/components/Link';
import { DynamicText } from './DynamicI18nText.client';

const PricingSection = ({ packages }: { packages: Packages[] }) => {
  const t = useTranslations('Common');

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-row flex-wrap flex-auto gap-6 max-w-5xl mx-auto items-center justify-center">
          {packages?.map((plan, index) => (
            <Card
              key={index}
              className="basis-3/10 relative overflow-hidden transition-all duration-300 group/card cursor-pointer border border-border hover:border-primary hover:shadow-xl"
            >
              <CardHeader className="text-center pb-2">
                <h3 className="text-xl font-bold text-foreground">
                  <DynamicText text={plan.packageName} />
                </h3>
                {/* <p className="text-sm text-muted-foreground">{plan.subtitle}</p> */}
                <p className="text-sm text-muted-foreground" />
              </CardHeader>

              <CardContent className="text-center pt-4">
                <div className="mb-2">
                  <span className="text-sm text-muted-foreground line-through" />
                </div>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  {plan.price ? (
                    <>
                      <span className="text-sm text-muted-foreground">
                        <DynamicText text="低至：" />
                      </span>
                      <span className="text-3xl font-bold text-primary">${plan.price}</span>
                      <span className="text-sm text-muted-foreground">HKD</span>
                    </>
                  ) : (
                    <div className="text-3xl font-bold text-primary">{t('stayTuned')}</div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground flex flex-row flex-nowrap justify-center">
                  <div className="truncate">
                    <DynamicText text="每年收費,年費收費" />
                  </div>
                  {plan.addUnitPrice && (
                    <div className="ml-1 flex flex-row flex-nowrap">
                      <div>+</div>
                      <div className="">${plan.addUnitPrice}</div>
                      <div className="scale-75 origin-bottom-left">HKD</div>
                      <div> / </div>
                      <DynamicText text="個" />
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="pt-4">
                <Link href="/service-plan" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full group transition-all duration-300 group-hover/card:bg-primary group-hover/card:text-primary-foreground group-hover/card:border-primary"
                  >
                    <DynamicText text="了解更多" />
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-10 space-y-1">
          <Link href="/pricing-plan" className="text-base font-bold text-foreground hover:text-primary underline block">
            <DynamicText text="查看完整的定價方案" />
          </Link>
          <Link href="/free-trial">
            <Button>
              <DynamicText text="立即開始14天免費試用" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;

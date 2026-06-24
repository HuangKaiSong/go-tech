import { Button, Card, CardContent, CardFooter, CardHeader } from '@go-tech-frontend/ui';
import { ChevronRight } from 'lucide-react';
import Link from '@/app/components/Link';

const PricingSection = ({ packages }: { packages: Packages[] }) => {
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
                <h3 className="text-xl font-bold text-foreground">{plan.packageName}</h3>
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
                      <span className="text-sm text-muted-foreground">低至：</span>
                      <span className="text-3xl font-bold text-primary">${plan.price}</span>
                      <span className="text-sm text-muted-foreground">HKD</span>
                    </>
                  ) : (
                    <div className="text-3xl font-bold text-primary">敬請期待</div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span>每年收費,年費收費</span>
                  {plan.addUnitPrice && <span className="ml-1">+{plan.addUnitPrice} /unit</span>}
                </p>
              </CardContent>

              <CardFooter className="pt-4">
                <Link href="/service-plan" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full group transition-all duration-300 group-hover/card:bg-primary group-hover/card:text-primary-foreground group-hover/card:border-primary"
                  >
                    了解更多
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-10 space-y-1">
          <Link href="/pricing-plan" className="text-base font-bold text-foreground hover:text-primary underline block">
            查看完整的定價方案
          </Link>
          <Link href="/free-trial">
            <Button>立即開始14天免費試用</Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;

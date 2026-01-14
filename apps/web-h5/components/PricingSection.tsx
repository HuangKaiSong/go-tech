import { Button, Card, CardContent, CardFooter, CardHeader } from "./ui";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

const pricingPlans = [
  {
    name: "普通版",
    subtitle: "適合1至3個物業的個人業主",
    originalPrice: "$1,500",
    price: "$1,000",
    priceSuffix: "HKD",
    period: "每年收費,年費收費",
    features: ["基礎功能"],
    cta: "了解更多 >",
    variant: "outline" as const,
  },
  {
    name: "升級版",
    subtitle: "適合4至10個物業的投資業主",
    originalPrice: "$4,000",
    price: "$3,200",
    priceSuffix: "HKD",
    period: "每年收費,年費 +500 /unit",
    features: ["進階功能"],
    cta: "了解更多 >",
    variant: "outline" as const,
  },
  {
    name: "豪華版",
    subtitle: "適合超過10個物業的企業業主",
    originalPrice: "$15,000",
    price: "$12,000",
    priceSuffix: "HKD",
    period: "每年收費,年費 +700 /unit",
    features: ["完整功能"],
    cta: "了解更多 >",
    variant: "outline" as const,
  },
];

const PricingSection = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <Card 
              key={index} 
              className="relative overflow-hidden transition-all duration-300 group/card cursor-pointer border border-border hover:border-primary hover:shadow-xl"
            >
              <CardHeader className="text-center pb-2">
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
              </CardHeader>
              
              <CardContent className="text-center pt-4">
                <div className="mb-2">
                  <span className="text-sm text-muted-foreground line-through">
                    {plan.originalPrice}
                  </span>
                </div>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-sm text-muted-foreground">低至：</span>
                  <span className="text-3xl font-bold text-primary">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.priceSuffix}</span>
                </div>
                <p className="text-xs text-muted-foreground">{plan.period}</p>
              </CardContent>
              
              <CardFooter className="pt-4">
                <Link href="/service-plan" className="w-full">
                  <Button 
                    variant="outline"
                    className="w-full group transition-all duration-300 group-hover/card:bg-primary group-hover/card:text-primary-foreground group-hover/card:border-primary"
                  >
                    {plan.cta}
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
            <Button>
              立即開始14天免費試用
            </Button>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;

import { Button } from "./ui";
import Link from "@/components/Link";
import homeOffice from "@/assets/home-office.jpg";

const StatsSection = () => {
  return (
    <section className="py-16 relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${homeOffice})` }}
      />
      <div className="absolute inset-0 bg-secondary/90" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-sm font-semibold text-primary mb-2">
              揮別租務公司的煩惱
            </h3>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
              GOTECH租務系統
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Gotech是一個專為租務管理打造的雲端系統，協助您輕鬆管理物業、追蹤租金收入並簡化溝通流程。
            </p>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              簡省90%~95%的管理費用
            </p>
            
            <div className="space-y-3">
              <p className="text-lg text-muted-foreground">
                租務行業,最低收費
              </p>
              <p className="text-3xl font-bold text-primary">
                完成簽約只需 5 個步驟
              </p>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Link href="/contact">
              <Button size="lg" className="px-8 py-6 text-lg">
                立即聯絡
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;

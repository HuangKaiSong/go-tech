import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import SystemFeaturesHero from '@/assets/system-features.webp'
import { 
  Users, 
  Building2, 
  FileText, 
  DollarSign, 
  UserCog, 
  LayoutGrid,
  Store,
  Wallet,
  Calculator,
  Receipt,
  RefreshCw,
  PenTool
} from "lucide-react";

const features = [
  { icon: Users, label: "人事管理" },
  { icon: Building2, label: "場地管理" },
  { icon: FileText, label: "租約管理" },
  { icon: DollarSign, label: "價格管理" },
  { icon: UserCog, label: "代理管理" },
  { icon: LayoutGrid, label: "單位管理" },
  { icon: Store, label: "營鋪模組" },
  { icon: Wallet, label: "租金管理" },
  { icon: Calculator, label: "會計功能" },
  { icon: Receipt, label: "收租發票" },
  { icon: RefreshCw, label: "快速續約功能" },
  { icon: PenTool, label: "線上簽約功能" },
];

const SystemFeatures = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header heroBg={SystemFeaturesHero} />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pb-32">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.4), rgba(0,0,0,0.1)), url(${SystemFeaturesHero.src})`,
          }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              GO-PMS功能
            </h1>
            <p className="text-lg text-white/90 mb-8">
              探索GO-PMS 的一系列功能，旨在簡化您的租務需求。
            </p>
            <Link href="/account/register">
              <Button 
                size="lg" 
                className="text-white font-medium"
                style={{ backgroundColor: '#F9881E' }}
              >
                立即開始14天免費試用
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* All Features Section */}
      <section className="py-16 md:py-24 flex-1">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-4">所有功能</h2>
            <p className="text-muted-foreground mb-12">
              更全面更完善的功能，能夠更快捷方便管理你的物業。
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-10">
              {features.map((feature, index) => (
                <div key={index} className="flex flex-col items-start">
                  <div 
                    className="w-full aspect-4/3 rounded-2xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: '#F9F9F9' }}
                  >
                    <feature.icon 
                      className="w-24 h-24" 
                      style={{ color: '#F5734A' }}
                      strokeWidth={1.5}
                    />
                  </div>
                  <span className="text-lg font-bold text-foreground">
                    {feature.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SystemFeatures;

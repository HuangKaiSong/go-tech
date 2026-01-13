import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check, Minus, Plus, Users, FileText, Building, Droplets, Clock, Calendar, LayoutDashboard, Receipt, Monitor, CreditCard } from "lucide-react";
import servicePlanBg from "@/assets/service-plan-bg.jpg";
import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";

type Plan = {
  plan: string;
}

export const getStaticProps = (async (context) => {
  return { props: { plan: context.params?.plan as string } }
}) satisfies GetStaticProps<Plan>

export const getStaticPaths = (async () => {
  return {
    paths: [
      {
        params: {
          plan: 'A',
        },
      }, // See the "paths" section below
    ],
    fallback: true,
  }
}) satisfies GetStaticPaths

// Plan data with features
const plansData = [
  {
    id: "A",
    name: "服务计划套餐A",
    subtitle: "最多可創建25個單位",
    price: 1000,
    currency: "HKD",
    features: [
      { icon: Users, label: "管理層" },
      { icon: FileText, label: "代理列表" },
      { icon: Users, label: "客戶列表" },
      { icon: FileText, label: "合同列表(線上&線下合同)" },
      { icon: Building, label: "單位列表" },
      { icon: Droplets, label: "水電列表" },
      { icon: Clock, label: "水電列表" },
      { icon: Calendar, label: "日程" },
      { icon: LayoutDashboard, label: "dashboard" },
      { icon: Receipt, label: "費用單列表" },
      { icon: Monitor, label: "租單列表" },
      { icon: CreditCard, label: "支票列印列表" },
    ],
  },
  {
    id: "B",
    name: "服务计划套餐B",
    subtitle: "最多可創建100個單位",
    price: 3200,
    currency: "HKD",
    features: [
      { icon: Users, label: "管理層" },
      { icon: FileText, label: "代理列表" },
      { icon: Users, label: "客戶列表" },
      { icon: FileText, label: "合同列表(線上&線下合同)" },
      { icon: Building, label: "單位列表" },
      { icon: Droplets, label: "水電列表" },
      { icon: Clock, label: "跟進列表" },
      { icon: Calendar, label: "日程" },
      { icon: LayoutDashboard, label: "dashboard" },
      { icon: Receipt, label: "費用單列表" },
      { icon: Monitor, label: "租單列表" },
      { icon: CreditCard, label: "支票列印列表" },
    ],
  },
  {
    id: "C",
    name: "服务计划套餐C",
    subtitle: "最多可創建400個單位",
    price: 12000,
    currency: "HKD",
    features: [
      { icon: Users, label: "管理層" },
      { icon: FileText, label: "代理列表" },
      { icon: Users, label: "客戶列表" },
      { icon: FileText, label: "合同列表(線上&線下合同)" },
      { icon: Building, label: "單位列表" },
      { icon: Droplets, label: "水電列表" },
      { icon: Clock, label: "跟進列表" },
      { icon: Calendar, label: "日程" },
      { icon: LayoutDashboard, label: "dashboard" },
      { icon: Receipt, label: "費用審列表" },
      { icon: Monitor, label: "租單列表" },
      { icon: CreditCard, label: "支票列印列表" },
    ],
  },
];

// Value-added services
const valueAddedServices = [
  { id: "sales", name: "Sales Module（租務）", price: 20 },
  { id: "followup", name: "跟進 Module（維務）", price: 20 },
  { id: "xero", name: "Xero Module（會計）", price: 50 },
  { id: "customer", name: "客服 Module（維務）", price: 20 },
  { id: "units", name: "增加單位數量", price: 80 },
];

const SelectPlan = () => {
  const router = useRouter();
  const { plan } = router.query;
  const planId = typeof plan === 'string' ? plan : "A";

  const selectedPlan = plansData.find(p => p.id === planId) || plansData[0];
  
  const [needAddons, setNeedAddons] = useState(true);
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => {
      if (prev[serviceId] !== undefined) {
        const newState = { ...prev };
        delete newState[serviceId];
        return newState;
      }
      return { ...prev, [serviceId]: 1 };
    });
  };

  const updateQuantity = (serviceId: string, delta: number) => {
    setSelectedServices(prev => {
      const current = prev[serviceId] || 1;
      const newValue = Math.max(1, current + delta);
      return { ...prev, [serviceId]: newValue };
    });
  };

  const handleGoBack = () => {
    router.push("/service-plan");
  };

  const handleNext = () => {
    router.push("/confirm-order", { 
     
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section 
        className="relative pt-32 pb-16 bg-cover bg-center"
        style={{ backgroundImage: `url(${servicePlanBg})` }}
      >
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">
            选择套餐
          </h1>
        </div>
      </section>
      
      {/* Main Content */}
      <section className="py-12 flex-1 bg-linear-to-b from-[#FFF8F5] via-[#FFF5F0] to-[#FFEEE5]">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Plan Details Card */}
          <div className="bg-white rounded-lg border border-border p-6 mb-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-start gap-3">
                <div className="w-1 h-8 bg-primary rounded-full mt-1"></div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{selectedPlan.name}</h2>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-primary">${selectedPlan.price.toLocaleString()}</span>
                <span className="text-lg text-primary ml-1">{selectedPlan.currency}</span>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex gap-4 mb-4">
                <span className="text-sm font-medium text-muted-foreground min-w-15">套餐内容</span>
                <span className="text-sm text-foreground">{selectedPlan.subtitle}</span>
              </div>
              
              <div className="flex gap-4">
                <span className="text-sm font-medium text-muted-foreground min-w-15">包含功能</span>
                <div className="flex flex-wrap gap-2">
                  {selectedPlan.features.map((feature, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground"
                      style={{ backgroundColor: '#FAEEEB' }}
                    >
                      <feature.icon className="w-4 h-4" style={{ color: '#F9881E' }} />
                      <span>{feature.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Value-Added Services Card */}
          <div className="bg-white rounded-lg border border-border p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-primary rounded-full"></div>
                <h3 className="text-lg font-bold text-foreground">增值服务</h3>
              </div>
              
              <div className="flex border border-border rounded-full overflow-hidden">
                <button
                  onClick={() => setNeedAddons(true)}
                  className={`px-6 py-2 text-sm font-medium transition-colors ${
                    needAddons 
                      ? 'bg-primary text-white' 
                      : 'bg-white text-muted-foreground hover:bg-muted'
                  }`}
                >
                  需要
                </button>
                <button
                  onClick={() => setNeedAddons(false)}
                  className={`px-6 py-2 text-sm font-medium transition-colors ${
                    !needAddons 
                      ? 'bg-primary text-white' 
                      : 'bg-white text-muted-foreground hover:bg-muted'
                  }`}
                >
                  不需要
                </button>
              </div>
            </div>
            
            {/* Expanded addon selection */}
            {needAddons && (
              <div className="mt-6">
                <p className="text-sm text-primary mb-4">
                  請選擇增值服務 <span className="text-primary">（可多選）</span>
                </p>
                
                <div className="space-y-3">
                  {valueAddedServices.map((service) => {
                    const isSelected = selectedServices[service.id] !== undefined;
                    const quantity = selectedServices[service.id] || 0;
                    
                    return (
                      <div 
                        key={service.id}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                          isSelected ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleService(service.id)}
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              isSelected 
                                ? 'bg-primary border-primary' 
                                : 'border-muted-foreground'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </button>
                          <span className="text-sm text-foreground">{service.name}</span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium text-primary">
                            +${service.price} HKD Each
                          </span>
                          
                          {isSelected && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(service.id, -1)}
                                className="w-8 h-8 rounded border border-border flex items-center justify-center hover:bg-muted transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                              <button
                                onClick={() => updateQuantity(service.id, 1)}
                                className="w-8 h-8 rounded border border-border flex items-center justify-center hover:bg-muted transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4">
            <Button 
              variant="outline" 
              onClick={handleGoBack}
              className="min-w-45 h-12 text-primary border-primary hover:bg-primary/5"
            >
              上一步
            </Button>
            <Button 
              onClick={handleNext}
              className="min-w-45 h-12"
            >
              下一步
            </Button>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default SelectPlan;

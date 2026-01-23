"use client";

import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import servicePlanBg from "@/assets/service-plan-bg.jpg";
import { Button, Card, CardContent, CardHeader } from "@go-tech-frontend/ui";
import {
  Building,
  Calendar,
  Clock,
  CreditCard,
  Droplets,
  FileText,
  LayoutDashboard,
  Monitor,
  Receipt,
  Settings,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

const plans = [
  {
    name: "套餐A",
    icon: Settings,
    subtitle: "最多可創建25個單位",
    price: "$1,000",
    currency: "HKD",
    cta: "選擇套餐A",
    features: [
      { icon: Users, label: "管理層" },
      { icon: FileText, label: "代理列表" },
      { icon: Users, label: "客戶列表" },
      { icon: FileText, label: "合同列表(線上&線下合同)" },
      { icon: Building, label: "單位列表" },
      { icon: Droplets, label: "水電列表" },
    ],
    upgradeNote: null,
    additionalFeatures: [],
    newFeatures: [],
  },
  {
    name: "套餐B",
    icon: Settings,
    subtitle: "最多可創建100個單位",
    price: "$3,200",
    currency: "HKD",
    cta: "選擇套餐B",
    features: [
      { icon: Users, label: "管理層" },
      { icon: FileText, label: "代理列表" },
      { icon: Users, label: "客戶列表" },
      { icon: FileText, label: "合同列表(線上&線下合同)" },
      { icon: Building, label: "單位列表" },
      { icon: Droplets, label: "水電列表" },
    ],
    upgradeNote: "(加$2,200 HKD升級為套餐B，增加75個單位)",
    additionalFeatures: [
      { icon: Clock, label: "跟進列表" },
      { icon: Calendar, label: "日程" },
      { icon: LayoutDashboard, label: "dashboard" },
    ],
    newFeatures: [],
  },
  {
    name: "套餐C",
    icon: Settings,
    subtitle: "最多可創建400個單位",
    price: "$12,000",
    currency: "HKD",
    cta: "選擇套餐C",
    features: [
      { icon: Users, label: "管理層" },
      { icon: FileText, label: "代理列表" },
      { icon: Users, label: "客戶列表" },
      { icon: FileText, label: "合同列表(線上&線下合同)" },
      { icon: Building, label: "單位列表" },
      { icon: Droplets, label: "水電列表" },
    ],
    upgradeNote: "(加$8,800 HKD升級為套餐C，增加300個單位)",
    additionalFeatures: [
      { icon: Clock, label: "跟進列表" },
      { icon: Calendar, label: "日程" },
      { icon: LayoutDashboard, label: "dashboard" },
    ],
    newFeatures: [
      { icon: Receipt, label: "費用審列表" },
      { icon: Monitor, label: "租單列表" },
      { icon: CreditCard, label: "支票列印列表" },
    ],
  },
];

const ServicePlan = () => {
  const router = useRouter();

  const handleSelectPlan = (planId: string) => {
    router.push(`/select-plan/${planId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section
        className="relative pt-32 pb-16 bg-cover bg-center"
        style={{ backgroundImage: `url(${servicePlanBg})` }}
      >
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">
            服務計劃
          </h1>
          <p className="text-lg text-primary/80">Service plan</p>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => {
              // Button colors for each plan
              const buttonColors = [
                "bg-[#F9881E] hover:bg-[#F9881E]/90", // 套餐A
                "", // 套餐B - use default
                "bg-[#35304A] hover:bg-[#35304A]/90", // 套餐C
              ];

              // 包含功能 row background colors
              const featureRowColors = [
                "bg-[#FEE7D2]", // 套餐A
                "bg-[#FDDCD2]", // 套餐B
                "bg-[#D7D6DB]", // 套餐C
              ];

              return (
                <Card
                  key={index}
                  className="border border-border hover:shadow-xl transition-shadow duration-300"
                >
                  <CardHeader className="text-center pb-4 pt-8">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <plan.icon className="w-6 h-6 text-primary" />
                      <h3 className="text-2xl font-bold text-foreground">
                        {plan.name}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {plan.subtitle}
                    </p>
                  </CardHeader>

                  <CardContent className="text-center">
                    <div className="mb-6">
                      <span className="text-3xl font-bold text-primary">
                        {plan.price}
                      </span>
                      <span className="text-lg text-primary ml-1">
                        {plan.currency}
                      </span>
                    </div>

                    <Button
                      className={`w-full mb-6 ${buttonColors[index]}`}
                      onClick={() =>
                        handleSelectPlan(plan.name.replace("套餐", ""))
                      }
                    >
                      {plan.cta}
                    </Button>

                    <div
                      className={`text-center mb-4 py-2 px-3 rounded-md min-h-13 flex flex-col justify-center ${featureRowColors[index]}`}
                    >
                      <span className="text-sm font-medium text-foreground">
                        包含功能
                      </span>
                      {plan.upgradeNote && (
                        <p className="text-xs text-primary mt-1">
                          {plan.upgradeNote}
                        </p>
                      )}
                    </div>

                    <div className="text-left">
                      {plan.features.map((feature, fIndex) => (
                        <div
                          key={fIndex}
                          className={`flex items-center gap-3 py-2 px-2 ${fIndex % 2 === 1 ? "bg-[#F5F5F5]" : ""}`}
                        >
                          <feature.icon className="w-4 h-4 text-primary" />
                          <span className="text-sm text-muted-foreground">
                            {feature.label}
                          </span>
                        </div>
                      ))}

                      {plan.additionalFeatures.length > 0 && (
                        <>
                          {index !== 2 && (
                            <div className="pt-2 pb-1 px-2 text-xs text-primary font-medium text-center">
                              以下為新增功能：
                            </div>
                          )}
                          {plan.additionalFeatures.map((feature, fIndex) => (
                            <div
                              key={fIndex}
                              className={`flex items-center gap-3 py-2 px-2 ${fIndex % 2 === 1 ? "bg-[#F5F5F5]" : ""}`}
                            >
                              <feature.icon className="w-4 h-4 text-primary" />
                              <span className="text-sm text-muted-foreground">
                                {feature.label}
                              </span>
                            </div>
                          ))}
                        </>
                      )}

                      {plan.newFeatures.length > 0 && (
                        <>
                          <div className="pt-2 pb-1 px-2 text-xs text-primary font-medium text-center">
                            以下為新增功能：
                          </div>
                          {plan.newFeatures.map((feature, fIndex) => (
                            <div
                              key={fIndex}
                              className={`flex items-center gap-3 py-2 px-2 ${fIndex % 2 === 1 ? "bg-[#F5F5F5]" : ""}`}
                            >
                              <feature.icon className="w-4 h-4 text-primary" />
                              <span className="text-sm text-muted-foreground">
                                {feature.label}
                              </span>
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

      <Footer />
    </div>
  );
};

export default ServicePlan;

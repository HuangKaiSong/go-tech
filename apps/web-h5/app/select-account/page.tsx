'use client'

import { useRouter } from 'next/navigation';
import { Badge, Button } from "@go-tech-frontend/ui";
import {
  Building,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Package,
  ShieldCheck,
} from "lucide-react";
import servicePlanBg from "@/assets/service-plan-bg.jpg";
import { useAuth } from '@/contexts/AuthContext';

// 已購買的多個套餐（模擬資料）
const purchasedAccounts = [
  {
    id: "ORD-2024-001",
    company: "金輝物業管理有限公司",
    planName: "升級版",
    planTier: "B",
    units: "最多 100 個單位",
    members: 12,
    status: "active",
    statusLabel: "使用中",
    expiryDate: "2027-01-15",
    role: "管理員",
    addons: ["升級營鋪Module", "升級會計 MODULE"],
  },
  {
    id: "ORD-2024-002",
    company: "海灣商鋪租務中心",
    planName: "豪華版",
    planTier: "C",
    units: "最多 400 個單位",
    members: 28,
    status: "active",
    statusLabel: "使用中",
    expiryDate: "2027-03-22",
    role: "管理員",
    addons: ["升級營鋪Module", "升級場地Module", "升級客服 Module"],
  },
  {
    id: "ORD-2023-042",
    company: "天朗物業（個人）",
    planName: "普通版",
    planTier: "A",
    units: "最多 25 個單位",
    members: 3,
    status: "expired",
    statusLabel: "已過期",
    expiryDate: "2024-06-20",
    role: "擁有者",
    addons: [],
  },
];

const tierBadgeClass: Record<string, string> = {
  A: "bg-[#FFF1E8] text-primary border-primary/30",
  B: "bg-[#FFE4D3] text-primary border-primary/40",
  C: "bg-primary text-primary-foreground border-primary",
};

const SelectAccount = () => {
  const { tenants } = useAuth();
  const router = useRouter();

  console.log(tenants);

  const handleEnter = (acc: typeof purchasedAccounts[number]) => {
    if (acc.status === "active") {
      router.push("/pms-dashboard");
    } else {
      router.push(`/renew-order/${acc.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <section
        className="relative pt-12 pb-12 bg-cover bg-center"
        style={{ backgroundImage: `url(${servicePlanBg.src})` }}
      >
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-3 bg-white/80 text-primary border border-primary/30 hover:bg-white">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            登入成功
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
            選擇要進入的套餐帳戶
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            您名下有多個已購買的套餐，請選擇要管理的帳戶。
          </p>
        </div>
      </section>

      {/* Account grid */}
      <section className="flex-1 py-12 bg-gradient-to-b from-[#FFF8F5] via-[#FFF5F0] to-[#FFEEE5]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchasedAccounts.map((acc) => {
              const isActive = acc.status === "active";
              return (
                <button
                  key={acc.id}
                  onClick={() => handleEnter(acc)}
                  className={`group text-left bg-white rounded-2xl border-2 p-6 flex flex-col transition-all border-border hover:border-primary hover:shadow-[0_12px_30px_-12px_hsl(var(--primary)/0.35)] hover:-translate-y-0.5 ${
                    isActive ? "" : "bg-white/90"
                  }`}
                >
                  {/* Top: tier + status */}
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 font-bold text-lg ${tierBadgeClass[acc.planTier]}`}
                    >
                      {acc.planTier}
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        isActive
                          ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                          : "border-border text-muted-foreground bg-muted"
                      }
                    >
                      {isActive ? (
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                      ) : (
                        <Clock className="w-3 h-3 mr-1" />
                      )}
                      {acc.statusLabel}
                    </Badge>
                  </div>

                  {/* Company */}
                  <h3 className="text-lg font-bold text-foreground leading-snug mb-1">
                    {acc.company}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Package className="w-4 h-4 text-primary" />
                    <span className="text-foreground font-medium">{acc.planName}</span>
                    <span>·</span>
                    <span>{acc.units}</span>
                  </div>

                  {/* Meta rows */}
                  <div className="space-y-2 py-3 border-y border-border/60 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4" /> 成員人數
                      </span>
                      <span className="text-foreground font-medium">{acc.members} 人</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" /> 有效期至
                      </span>
                      <span className="text-foreground font-medium">{acc.expiryDate}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Building className="w-4 h-4" /> 我的角色
                      </span>
                      <span className="text-foreground font-medium">{acc.role}</span>
                    </div>
                  </div>

                  {/* Addons */}
                  {acc.addons.length > 0 && (
                    <div className="mb-5">
                      <div className="text-xs text-muted-foreground mb-2">已啟用增值服務</div>
                      <div className="flex flex-wrap gap-1.5">
                        {acc.addons.map((a) => (
                          <span
                            key={a}
                            className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="mt-auto">
                    <div
                      className={`flex items-center justify-between rounded-lg px-4 py-3 transition-colors ${
                        isActive
                          ? "bg-primary/5 group-hover:bg-primary group-hover:text-primary-foreground text-primary"
                          : "bg-[#FFF1E8] text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                      }`}
                    >
                      <span className="text-sm font-semibold">
                        {isActive ? "進入此帳戶" : "立即續費"}
                      </span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Add new package card */}
            <button
              onClick={() => router.push("/service-plan")}
              className="text-left bg-white/60 rounded-2xl border-2 border-dashed border-primary/40 p-6 flex flex-col items-center justify-center min-h-[280px] hover:bg-white hover:border-primary transition-all group"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <Package className="w-7 h-7 text-primary" />
              </div>
              <div className="text-base font-bold text-foreground mb-1">購買新套餐</div>
              <div className="text-xs text-muted-foreground text-center">
                為新的公司或業務開通一個全新的管理帳戶
              </div>
            </button>
          </div>

          {/* Footer actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-10 pt-6 border-t border-border/60">
            <p className="text-sm text-muted-foreground">
              想要查看所有訂單詳情或續期？前往「我的訂單」頁面。
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-primary text-primary hover:bg-primary/5"
                onClick={() => router.push("/my-orders")}
              >
                查看我的訂單
              </Button>
              <Button onClick={() => router.push("/")}>返回首頁</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SelectAccount;

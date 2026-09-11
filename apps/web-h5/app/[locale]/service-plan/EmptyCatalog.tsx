'use client';

import {
  Bell,
  Building,
  Building2,
  CalendarCheck,
  Clock,
  Droplets,
  Network,
  Receipt,
  UserCog,
  Users,
  Wallet
} from 'lucide-react';
import { DynamicText } from '@/app/components/DynamicI18nText.client';
import Link from '@/app/components/Link';

const systemPlan = [
  {
    mark: 'pms',
    icon: Building2,
    badge: '物業 / 租務',
    title: 'GO-PMS 物業租務管理系統',
    description: '按物業單位數量開通，涵蓋租約、單位、水電、會計等完整租務流程。',
    features: [
      {
        icon: Building,
        title: '單位與租約',
        description: '單位、租客、合同一站管理'
      },
      {
        icon: Droplets,
        title: '水電抄錶',
        description: '自動計算費用與帳單'
      },
      {
        icon: Receipt,
        title: '收租對帳',
        description: '租單、支票列印與費用審批'
      }
    ],
    tags: ['管理層', '代理列表', '客戶列表', '合同列表', '單位列表', '水電列表', '跟進列表', '+2 更多功能'],
    limits: [
      {
        title: '25-400',
        description: '可管理單位數'
      },
      {
        title: '3',
        description: '服務版本'
      },
      {
        title: '14天',
        description: '免費試用'
      }
    ],
    price: 1000,
    priceDescription: 'HKD 起 / 年',
    target: '業主 / 地產代理 / 物業管理公司'
  },
  {
    mark: 'hr',
    icon: Users,
    badge: '人事 / 薪酬',
    title: 'GO-HR 人力資源管理系統',
    description: '以「基礎版」為兜底套餐（包含人事管理所有功能），再按需加購發薪管理、日常管理、發展與績效模塊。',
    features: [
      {
        icon: UserCog,
        title: '基礎版兜底',
        description: '人事管理全部功能一次到位'
      },
      {
        icon: CalendarCheck,
        title: '模塊化加購',
        description: '只為用得上的功能付費'
      },
      {
        icon: Wallet,
        title: '彈性人數',
        description: '員工人數超出可按人加購'
      }
    ],
    tags: ['員工管理', '員工資料', '入職管理', '離職管理', '組織架構', '部門管理', '職位管理', '+2 更多功能'],
    limits: [
      {
        title: '20-300+',
        description: '可管理員工數'
      },
      {
        title: '3',
        description: '可加購模塊'
      },
      {
        title: '14天',
        description: '免費試用'
      }
    ],
    price: 2000,
    priceDescription: 'HKD 起 / 月',
    target: '中小企 / 連鎖店 / 多部門企業'
  }
];

export default function Page() {
  return (
    <section className="relative py-20 bg-gradient-to-b from-secondary/60 via-background to-background overflow-hidden">
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-16 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-widest mb-4">
            CHOOSE YOUR SYSTEM
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            <DynamicText text="請選擇您要查看的系統" />
          </h2>
          <p className="text-muted-foreground">
            <DynamicText text="兩套系統各自獨立訂閱，選擇後即可查看完整服務計劃與功能明細，並可隨時切換比較。" />
          </p>
        </div>
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {systemPlan.map(plan => (
            <Link
              href={`/service-plan?product=${plan.mark}`}
              prefetch
              key={plan.mark}
              className="rounded-lg text-card-foreground shadow-sm cursor-pointer relative overflow-hidden border border-border bg-card hover:border-primary hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-[image:var(--hero-gradient)] opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <plan.icon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-secondary text-[11px] font-medium text-muted-foreground mb-1">
                      {plan.badge}
                    </span>
                    <h3 className="text-xl font-bold text-foreground leading-snug">{plan.title}</h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">{plan.description}</p>
                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg p-3 bg-secondary/60">
                      <feature.icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{feature.title}</p>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {plan.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-full border border-border text-[11px] text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                  <span className="px-2.5 py-1 rounded-full border border-primary/30 text-[11px] text-primary">
                    +2 更多功能
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-6 border-y border-border py-4">
                  {systemPlan[0].limits.map(limit => (
                    <div key={limit.description} className="text-center">
                      <p className="text-lg font-bold text-primary">{limit.title}</p>
                      <p className="text-[11px] text-muted-foreground">{limit.description}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-end justify-between mb-5">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">適合：{plan.target}</p>
                    <p className="text-2xl font-bold text-foreground">
                      {plan.price.toLocaleString('zh-HK', { style: 'decimal', currency: 'HKD' })}
                      <span className="text-xs font-normal text-muted-foreground ml-1">{plan.priceDescription}</span>
                    </p>
                  </div>
                </div>
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full group-hover:shadow-lg transition-shadow">
                  查看服務計劃
                </button>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-14 max-w-6xl mx-auto grid sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-5 rounded-xl bg-card border border-border">
            <Clock className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">14 天免費試用</p>
              <p className="text-xs text-muted-foreground">無需信用卡，隨時開通</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-5 rounded-xl bg-card border border-border">
            <Network className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">彈性升級</p>
              <p className="text-xs text-muted-foreground">版本之間可隨時升級，按剩餘期折算</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-5 rounded-xl bg-card border border-border">
            <Bell className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">專人支援</p>
              <p className="text-xs text-muted-foreground">開通後提供教學與客服跟進</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

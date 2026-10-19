import { Clock, Cloud, Headphones, Layers, MapPin, ShieldCheck, Zap } from 'lucide-react';
import { DynamicText } from './DynamicI18nText';
import SwipeRow from './SwipeRow';

const stats = [
  { value: '70%', label: '行政工時節省' },
  { value: '99.9%', label: '雲端服務穩定性' },
  { value: '14 天', label: '免費試用' },
  { value: '24/7', label: '手機電腦隨時查閱' }
];

const reasons = [
  {
    icon: MapPin,
    title: '專為香港而設',
    desc: '支援差餉、按金、釘契、強積金等本地流程，繁體中文介面，貼合香港營運習慣。'
  },
  {
    icon: Cloud,
    title: '雲端集中，隨時隨地',
    desc: '所有資料存放於雲端，電腦與手機同步，出差或身處海外亦能即時掌握狀況。'
  },
  { icon: Zap, title: '自動化取代人手', desc: '收租提醒、到期通知、薪資計算自動完成，減少重複工作與人為錯誤。' },
  {
    icon: ShieldCheck,
    title: '數據安全有保障',
    desc: '權限分級管理、操作全程留痕，資料加密備份，保障企業與客戶私隱。'
  },
  {
    icon: Layers,
    title: '按需開通，彈性擴展',
    desc: '由普通版到豪華版、按單位或員工人數加購模塊，業務成長時無需更換系統。'
  },
  { icon: Headphones, title: '本地團隊貼身支援', desc: '由開通、資料匯入到日常使用，本地客服團隊提供教學與即時協助。' }
];

const compare = [
  { task: '每月收租與對帳', before: 100, after: 25 },
  { task: '租約到期跟進', before: 100, after: 20 },
  { task: '維修工單處理', before: 100, after: 40 },
  { task: '出糧及考勤統計', before: 100, after: 30 }
];

const WhyChooseUs = () => (
  <section className="py-20 bg-muted/30">
    <div className="container mx-auto px-4">
      <h2 className="text-3xl md:text-4xl font-bold text-center text-primary mb-4">
        <DynamicText text="為何選擇我們" />
      </h2>
      <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
        <DynamicText text="Go Techs 以科技簡化租務與人事管理，讓您把時間留給真正重要的業務增長。" />
      </p>

      {/* 數據 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
        {stats.map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-6 text-center shadow-sm">
            <p className="text-3xl md:text-4xl font-bold text-primary">{s.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              <DynamicText text={s.label} />
            </p>
          </div>
        ))}
      </div>

      {/* 原因卡片 */}
      <SwipeRow className="flex md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 gap-4 pb-3 md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:shrink-0 [&>*]:basis-[85%] [&>*]:snap-center md:[&>*]:basis-auto">
        {reasons.map(r => (
          <div
            key={r.title}
            className="group bg-card rounded-xl border border-border p-6 shadow-sm hover:border-primary hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <r.icon className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              <DynamicText text={r.title} />
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <DynamicText text={r.desc} />
            </p>
          </div>
        ))}
      </SwipeRow>

      {/* 圖表 */}
      <div className="mt-14 bg-card rounded-xl border border-border p-6 md:p-10 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> <DynamicText text="使用前後工時對比" />
          </h3>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-muted-foreground/30" />
              <DynamicText text="傳統人手" />
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-primary" />
              <DynamicText text="使用 Go Techs" />
            </span>
          </div>
        </div>
        <div className="space-y-5">
          {compare.map(c => (
            <div key={c.task}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium text-foreground">{c.task}</span>
                <span className="text-primary font-semibold">
                  <DynamicText text={`節省 ${c.before - c.after}%`} />
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-muted-foreground/20 mb-1" style={{ width: `${c.before}%` }} />
              <div className="h-2.5 rounded-full bg-primary" style={{ width: `${c.after}%` }} />
            </div>
          ))}
        </div>
        <p className="mt-5 text-xs text-muted-foreground">
          * <DynamicText text="以傳統人手處理時間為 100%，數據為一般客戶使用估算。" />
        </p>
      </div>
    </div>
  </section>
);

export default WhyChooseUs;

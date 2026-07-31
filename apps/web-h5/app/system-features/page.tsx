import { Building2, CheckCircle2, Cloud, FileText, ShieldCheck, Smartphone, Users, Wallet } from 'lucide-react';
import { defaultSystemFeaturesBlocks } from '@/app/components/blockDefaults';
import { loadPageBlocks } from '@/app/lib/pageBlocks';
import { DynamicText } from '../components/DynamicI18nText';
import FeatureGridSection from '../components/FeatureGridSection';
import Footer from '../components/Footer';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';

const moduleIntros = [
  {
    icon: Building2,
    tag: 'Property',
    title: '物業與單位管理',
    desc: '住宅、商廈、工廈、車位、倉庫、廣告位等各類資產統一建檔，樓層、面積、間隔、出租狀態一目瞭然。',
    points: ['多類型物業建檔', '單位空置狀態追蹤', '圖則與文件附件']
  },
  {
    icon: FileText,
    tag: 'Leasing',
    title: '租約與續約管理',
    desc: '由議價、簽約、加租到退租全流程記錄，到期自動提醒，並支援快速續約與線上電子簽署。',
    points: ['租約全生命週期', '到期自動提醒', '線上簽約與續約']
  },
  {
    icon: Wallet,
    tag: 'Finance',
    title: '租金與會計財務',
    desc: '自動產生每月賬單與收據，追蹤欠租與按金，支援管理費、水電雜費分攤，並可對接會計系統。',
    points: ['自動出單收據', '欠租催繳追蹤', 'Xero 會計對接']
  },
  {
    icon: Users,
    tag: 'CRM',
    title: '客戶與客服跟進',
    desc: '業主、租客、代理資料集中管理，問盤、維修、投訴等跟進紀錄清晰可查，租客可透過 Portal 自助提交。',
    points: ['客戶檔案集中', '問盤與維修跟進', '租客自助 Portal']
  }
];

const platformBenefits = [
  {
    icon: Cloud,
    title: '雲端多租戶架構',
    desc: '支援多公司切換管理，數據獨立安全隔離。'
  },
  {
    icon: ShieldCheck,
    title: '銀行級數據安全',
    desc: '全程加密傳輸，權限分層管控敏感資料。'
  },
  {
    icon: Smartphone,
    title: '跨裝置無縫協作',
    desc: '電腦、平板、手機隨時登入，資訊同步不間斷。'
  }
];

const SystemFeatures = async () => {
  const blocks = await loadPageBlocks('system-features', defaultSystemFeaturesBlocks);

  const heroBackground = blocks?.find(block => block.type === 'hero')?.backgroundImage || '';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header heroBg={heroBackground} initialBlocks={blocks} />
      <HeroSection initialBlocks={blocks} page="system-features" renderOnly="hero" />

      <section className="py-16 md:py-24 bg-[#FFF9F3]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <span className="inline-block text-sm font-medium tracking-widest text-[#F5734A] uppercase mb-3">
                System Overview
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                <DynamicText text="系統功能簡介" />
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                <DynamicText
                  text="從物業建檔、租約簽署、租金收支到客戶跟進，GO-PMS
                以四大核心模組串連日常租務流程，一套系統管理所有物業資產。"
                />
              </p>
            </div>

            {/* Module Intros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {moduleIntros.map((m, i) => (
                <div
                  key={i}
                  className="group relative bg-white rounded-3xl p-8 border border-transparent hover:border-[#F5734A]/30 hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  <div className="absolute top-6 right-6 text-xs font-semibold tracking-wider text-[#F5734A]/50 uppercase">
                    0{i + 1}
                  </div>
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: '#FFEEDF' }}
                  >
                    <m.icon className="w-7 h-7" style={{ color: '#F5734A' }} strokeWidth={1.8} />
                  </div>
                  <div className="text-xs font-semibold tracking-widest text-[#F5734A] uppercase mb-2">{m.tag}</div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">
                    <DynamicText text={m.title} />
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                    <DynamicText text={m.desc} />
                  </p>
                  <ul className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pt-5 border-t border-border/60">
                    {m.points.map(p => (
                      <li key={p} className="flex items-center gap-2 text-sm text-foreground/80">
                        <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#F5734A' }} strokeWidth={2} />
                        <DynamicText text={p} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Key Metrics Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { value: '12+', label: '核心功能模組全覆蓋' },
                { value: '10+', label: '營運指標一頁看盡' },
                { value: '24/7', label: '雲端數據即時同步' },
                { value: '14 天', label: '免費試用，無需信用卡' }
              ].map(m => (
                <div key={m.label} className="bg-white/70 rounded-2xl px-5 py-6 text-center border border-[#F5734A]/10">
                  <div className="text-2xl md:text-3xl font-bold mb-1" style={{ color: '#F5734A' }}>
                    <DynamicText text={m.value} />
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    <DynamicText text={m.label} />
                  </div>
                </div>
              ))}
            </div>

            {/* Platform Benefits */}
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {platformBenefits.map((b, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: '#FFEEDF' }}
                    >
                      <b.icon className="w-6 h-6" style={{ color: '#F5734A' }} strokeWidth={1.8} />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-foreground mb-1">
                        <DynamicText text={b.title} />
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        <DynamicText text={b.desc} />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <FeatureGridSection initialBlocks={blocks} page="system-features" />

      <Footer />
    </div>
  );
};

export default SystemFeatures;

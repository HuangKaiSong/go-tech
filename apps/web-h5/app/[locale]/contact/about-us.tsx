import { BarChart3, Boxes, Eye, Globe, GraduationCap, HeartHandshake, Mail, Phone } from 'lucide-react';
import { DynamicText } from '@/app/components/DynamicI18nText.client';

const services = [
  {
    icon: Boxes,
    title: '一體化物業管理軟件',
    desc: '我們提供整合式物業管理系統，協助客戶集中管理預約、租戶與客戶資料、收費、帳務及營運報告等工作。透過統一平台，管理團隊可減少重複行政程序，提升資訊透明度及工作效率。'
  },
  {
    icon: HeartHandshake,
    title: '租戶關係管理',
    desc: 'Go-Techs 的系統協助物業管理者更有效掌握租戶需求、服務紀錄及互動情況，從而提供更及時、個人化及高質素的服務，建立長遠而穩固的租戶關係。'
  },
  {
    icon: BarChart3,
    title: '數據分析與業務洞察',
    desc: '我們利用數據分析工具，協助客戶了解租戶行為、營運表現及物業使用趨勢。透過清晰的數據洞察，管理團隊可作出更精準的業務決策、優化資源配置，並提升物業收益潛力。'
  },
  {
    icon: GraduationCap,
    title: '技術支援與專業培訓',
    desc: '我們提供持續的技術支援及系統使用培訓，確保客戶團隊能充分掌握平台功能，順利將科技融入日常物業管理工作，發揮系統的最大價值。'
  }
];

const contacts = [
  { icon: Phone, label: '電話', value: '+852 5971 1918', href: 'tel:+85259711918' },
  { icon: Mail, label: '電郵', value: 'info@go-techs.com', href: 'mailto:info@go-techs.com' },
  { icon: Globe, label: '網站', value: 'www.go-techs.com', href: 'https://www.go-techs.com' }
];

const AboutUs = () => (
  <div className="max-w-5xl mx-auto space-y-12">
    <section className="bg-card rounded-xl shadow-lg border-l-4 border-primary p-6 md:p-10">
      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
        <DynamicText text="Go-Techs 公司簡介" />
      </h2>
      <p className="text-base md:text-lg text-foreground/80 leading-relaxed">
        <span className="font-semibold text-primary">Go-Techs</span>{' '}
        <DynamicText text=" 成立於 2026 年，專注為商業及住宅物業提供全面而智能化的物業管理解決方案。透過先進科技、數據分析及以客戶為本的服務模式，我們協助物業管理公司、業主及營運團隊簡化日常流程、提升管理效率，並持續優化租戶體驗與物業營運表現。" />
      </p>
    </section>

    <section>
      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
        <DynamicText text="我們的服務" />
      </h2>
      <div className="grid md:grid-cols-2 gap-5">
        {services.map((s, i) => (
          <div
            key={s.title}
            className="group bg-card rounded-xl border border-border p-6 shadow-sm hover:border-primary hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <s.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                <span className="text-primary mr-1">{i + 1}.</span>
                <DynamicText text={s.title} />
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <DynamicText text={s.desc} />
            </p>
          </div>
        ))}
      </div>
    </section>

    <section className="rounded-xl bg-primary/10 border border-primary/30 p-6 md:p-10">
      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Eye className="w-7 h-7 text-primary" /> <DynamicText text="我們的願景" />
      </h2>
      <p className="text-base md:text-lg text-foreground/80 leading-relaxed">
        <DynamicText text="Go-Techs 致力成為物業管理科技領域的領導者。透過持續創新、可靠的技術方案及卓越的客戶服務，我們期望協助客戶實現更高效、更透明及更具競爭力的物業營運，推動行業邁向智能化發展。" />
      </p>
    </section>

    <section>
      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
        <DynamicText text="聯絡我們 Contact Us" />
      </h2>
      <div className="grid md:grid-cols-3 gap-4">
        {contacts.map(c => (
          <a
            key={c.label}
            href={c.href}
            target={c.label === '網站' ? '_blank' : undefined}
            rel="noopener noreferrer"
            className="bg-card rounded-xl border border-border p-5 flex items-center gap-3 shadow-sm hover:border-primary transition-colors"
          >
            <div className="w-11 h-11 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <c.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                <DynamicText text={c.label} />
              </p>
              <p className="font-semibold text-foreground">{c.value}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  </div>
);

export default AboutUs;

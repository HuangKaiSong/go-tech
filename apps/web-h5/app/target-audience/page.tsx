
import { audiences } from '@/app/components/blockDefaults';
import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { defaultTargetAudience } from "../components/blockDefaults";
import HeroSection from "../components/HeroSection";
import { loadPageBlocks } from "../lib/pageBlocks";

const features = [
  {
    number: 1,
    title: "節省時間和精力，徹底解放業主",
    description:
      "一站式處理日常事務：賬單通知、收租跟進、維修安排、投訴與紀錄集中管理，減少重複溝通與分散操作。",
    subDescription:
      "簡單易用：報表與資料隨時查看，手機／電腦皆可操作，讓忙碌業主亦能輕鬆管理出租事務。",
  },
  {
    number: 2,
    title: "優化租務管理，提升出租效率",
    description:
      "狀況一目了然：快速掌握各物業入住、空置與租約狀態，便於統一部署與跟進。",
    subDescription:
      "提升決策質素：以清晰數據支持租金、續約與招租安排，縮短空置期、提升出租表現",
  },
  {
    number: 3,
    title: "保障財務清晰，避免收益損失",
    description:
      "收支有據可查：租金、按金、管理費等明細統一記錄，對賬更快捷。",
    subDescription:
      "分類清晰：財務資料結構化呈現，帳目更透明，減少遺漏與爭議。",
  },
  {
    number: 4,
    title: "簡化維修溝通，保持物業價值",
    description:
      "維修流程更順暢：維修事項、相片與跟進紀錄集中整理，方便業主、租戶與師傅溝通。",
    subDescription:
      "進度可追蹤：每宗個案的處理狀態清晰可見，提升服務效率與住戶體驗。",
  },
  {
    number: 5,
    title: "降低風險，管理更合規",
    description:
      "文件集中管理：合約、身份文件、收據等統一保存，查找方便、降低遺失風險。",
    subDescription:
      "重要事項有系統記錄：到期／續約／檢查等關鍵節點可統一管理，提升合規與管治水平。",
  },
];

const comparisonData = [
  {
    category: "招租",
    traditional: "單独作事門門台溝及推想，提供有數路服申請。",
    system: "一鍵多門台發布，佔程財的操業，再交對溝。",
  },
  {
    category: "收租",
    traditional: "每月手動發送銀行發端去預組，機不安請好管情。",
    system: "自動發送提醒，佔線支付，自動精理核計。",
  },
  {
    category: "維修",
    traditional: "設芸開直/超緒條端，查士回時線超系然出增。",
    system: "維護在效溝交，照片詢論過購，資段格化報。",
  },
  {
    category: "財務",
    traditional: "手門紀紀或Excel表格，無結選則，時科機區。",
    system: "自己發育分收，手建機器，佔定一單了然。",
  },
  {
    category: "文件",
    traditional: "紙質合同和發整核發，查找相機，變交失。",
    system: "所有文件線子化保障紙辦，分全法訊解保留。",
  },
  {
    category: "風險",
    traditional: "到期事項靠人手記錄，容易漏跟進。",
    system: "關鍵日期與事項可統一管理並設提醒，降低遺漏風險。",
  },
];

const TargetAudience = async () => {
  const blocks = await loadPageBlocks("target-audience", defaultTargetAudience);
  const heroBackground = blocks?.find((block) => block.type === 'hero')?.backgroundImage || '';

  const hasIframe = false;

  return (
    <div className="min-h-screen bg-background">
      <Header heroBg={heroBackground} />
      {/* Hero Section */}
      <HeroSection initialBlocks={blocks} page="target-audience" />
      {/* <section
        className={`relative py-24 md:py-32 ${hasIframe ? "cursor-editor" : ""}`}
      >
        <Image
          src={audienceBanner}
          alt="Target audience background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-foreground/60" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-background mb-4">
            適合人群
          </h1>
          <p className="text-xl text-background/80">Target audience</p>
        </div>
      </section> */}

      {/* Audience Cards */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4">
          <div
            className={`grid md:grid-cols-3 gap-8 ${hasIframe ? "cursor-editor" : ""}`}
          >
            {audiences.map((audience, index) => (
              <div
                key={index}
                className="bg-background rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="bg-primary py-3 px-4">
                  <h3 className="text-primary-foreground font-semibold text-center">
                    {audience.title}
                  </h3>
                </div>
                <div className="h-48 overflow-hidden">
                  <Image
                    src={audience.image}
                    alt={audience.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    ✓ {audience.description}
                  </p>
                  <div className="flex justify-center mt-6">
                    <ChevronDown className="w-6 h-6 text-primary animate-bounce" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className={`space-y-8 ${hasIframe ? "cursor-editor" : ""}`}>
            {features.map((feature, index) => (
              <div key={index} className="bg-secondary rounded-xl p-6 md:p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold">
                      {feature.number}
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-primary">
                    {feature.title}
                  </h3>
                </div>
                <div className="pl-14 space-y-3">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.subDescription}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="overflow-x-auto">
            <table
              className={`w-full bg-background rounded-xl overflow-hidden shadow-lg ${hasIframe ? "cursor-editor" : ""}`}
            >
              <thead>
                <tr>
                  <th className="p-4 text-left font-semibold text-foreground bg-muted">
                    管理環節
                  </th>
                  <th className="p-4 text-left font-semibold text-primary-foreground bg-primary">
                    沒有系統的傳統方式
                  </th>
                  <th className="p-4 text-left font-semibold text-primary-foreground bg-primary/80">
                    使用物業管理系統
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr key={index} className="border-t border-border">
                    <td className="p-4 font-medium text-foreground bg-muted">
                      {row.category}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {row.traditional}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground bg-primary/5">
                      {row.system}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TargetAudience;

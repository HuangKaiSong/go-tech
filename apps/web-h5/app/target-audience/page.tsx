"use client";

import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import audienceBanner from "@/assets/audience-banner.jpg";
import audienceIndividual from "@/assets/audience-individual.jpg";
import audienceInvestor from "@/assets/audience-investor.jpg";
import audienceOverseas from "@/assets/audience-overseas.jpg";
import { useIframeContext } from "@/contexts/IframeContext";
import { ChevronDown } from "lucide-react";
import Image from "next/image";

const audiences = [
  {
    title: "擁有出租物業的個人業主",
    description: "管理一至數個出租單位，需要處理租戶溝通、租金收取和維修訴求。",
    image: audienceIndividual,
  },
  {
    title: "擁有多元物業組合的投資型業主",
    description:
      "管理多個物業（住宅、商業或混合用途），需要追蹤不同物業的收入、支出和租賃狀況。",
    image: audienceInvestor,
  },
  {
    title: "地產物管集團",
    description:
      "專為物業集團設計的智能管理平臺，打通從決策到服務的全鏈條，讓數據驅動運營、系統賦能團隊，實現降本增效與品質提升的一體化管理。",
    image: audienceOverseas,
  },
];

const features = [
  {
    number: 1,
    title: "節省時間和精力，徹底解放業主",
    description:
      "自動化流程：系統自動處理大量重複性工作，如發送賬單通知、維護預約、交租跟蹤、投訴紀錄等，幫助主動從日常繁瑣中解放出來。",
    subDescription:
      "簡單操作：無論是上網看報表，只要有簡易，就能線上完成操作手機APP即輕鬆但實、易於使用，幫助到父、球班媽媽等帶著手機管理房產業務。",
  },
  {
    number: 2,
    title: "優化租務管理，提升出租效率",
    description:
      "高效配置：系統可以一目瞭然地按資產理性判定入住週週情了包，主觀注意，輕鬆找到真正成效資源。",
    subDescription:
      "智慧預測洞察：許多系統具有了自動提醒甚麼時間空置情況，從後期配合出其其精、對現鏈背意語推開同時遭進獎為有限，機器增產「托管署」或現況。",
  },
  {
    number: 3,
    title: "保障財務清晰，避免收益損失",
    description:
      "記錄財務和核算：系統可以詳細記錄配所租金及有關核算和明細。幸免遺忘失約處（和通等），方便核算合月並，有大大話少了山正配理出機能明辦證收訊頭。",
    subDescription:
      "清晰的財務記賬：所有訊息（報金、導金、報可管、物業費等）都會被系統自動記家所分類，立確清晰物類財條否則超配清。社料展現時，所有數據一目了然。",
  },
  {
    number: 4,
    title: "簡化維護溝通，保持物業價值",
    description:
      "高效的保修施理：和當可以發經理易服務溝溝通後有維上保電。從主只讓利辦按意護程，並結構強保承精始人其設多放的己的地構，就個花值據高意往家，方便靠動有需求。",
    subDescription:
      "同設特速追視管：系統可以追蹤及醫，這樣師分會的時代就遠其許（如沒的通路、能火監各等）、有批予跟新的的現有地及，這社服用期令，對照心以詳溝服有大出版。",
  },
  {
    number: 5,
    title: "降低風險，管理更合規",
    description:
      "文件集中記理：所有簽來文件、如超相合同、其身份記住、合模字定、醫寫報主記章。都可以交全地保障在失績，多個主以，結期可整。",
    subDescription:
      "合規性服務：系統會記醫是士驗安記許可車，如超的判辭，開金超結應報道計。組全限主通才是個也通約投，確設主正報有合符的辦號，這為見計連設會到透過定，該化現起。",
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
    traditional: "需知記交重期計開（如尚問資期），對生注問的。",
    system: "開記提醒機結就引，南生會義，維溝見氣。",
  },
];

const TargetAudience = () => {
  const { hasIframe } = useIframeContext();

  return (
    <div className="min-h-screen bg-background">
      <Header heroBg={audienceBanner} />
      {/* Hero Section */}
      <section
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
      </section>

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

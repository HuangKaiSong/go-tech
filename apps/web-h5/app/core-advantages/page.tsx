"use client";

import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import advantage1 from "@/assets/advantage-1.jpg";
import advantage2 from "@/assets/advantage-2.jpg";
import advantage3 from "@/assets/advantage-3.jpg";
import advantage4 from "@/assets/advantage-4.jpg";
import advantage5 from "@/assets/advantage-5.jpg";
import advantage6 from "@/assets/advantage-6.jpg";
import advantageIntro from "@/assets/advantage-intro.jpg";
import coreHero from "@/assets/core-hero.jpg";
import coreOffice from "@/assets/core-office.jpg";
import { useIframeContext } from "@/contexts/IframeContext";
import { Settings, Shield, TrendingUp } from "lucide-react";
import Image from "next/image";

export default function Page() {
  const { hasIframe } = useIframeContext();

  const advantages = [
    {
      image: advantage1,
      title: "多樣化的租賃服務",
      description:
        "無論您是管理住宅、商業大廈還是工廠地產、單位、車位、倉庫、儲物位、廣告位、天台等等，我們的系統都能滿足您的需求。",
      subDescription:
        "從房產登記、租戶管理到自動化帳單計算的所有需求，我們的方案在完整租賃管理解決方案中無縫銜接。",
    },
    {
      image: advantage2,
      title: "提高管理效率",
      description:
        "自動收租、自動產生賬單和催繳功能，已成為最廣泛使用的租賃管理工具。",
      subDescription:
        "管理多處物業: 只需按幾個鍵，節省大量工時。它能幫業主簡化收租和催繳過程。",
    },
    {
      image: advantage3,
      title: "加強財務透明度",
      description:
        "精確而全面數據：包括巧帳計計劃表，幫助投資者進行細緻入微的投資和財務分析。",
      subDescription: "精確分析物業表現：內設的報告標準功能，讓分析更加簡潔。",
    },
    {
      image: advantage4,
      title: "極簡學習曲線",
      description: "無需專業：無論的在地即可操作，讓你簡單上手。",
      subDescription:
        "客戶服務：隨時享受到快速的技術支持,以及業界洞察分析趨勢。",
    },
    {
      image: advantage5,
      title: "數據分析與決策支持",
      description: "市場趨勢分析：理解未來工商、住宅等產業發展趨勢及策略制定。",
      subDescription:
        "數據分析表：內有平台的數據展示到詳細的數據報告，協助用戶做出最明智的決策。",
    },
    {
      image: advantage6,
      title: "優質客服協助中",
      description:
        "我們的人工智能,包含了可靠的系統功能來支持, 優質客服團隊，讓您用戶通用更多的輔助工具。",
      subDescription:
        "無論您有什麼問題，我們的API團隊會在24小時回覆內，並積極提供解決方案。",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header heroBg={coreHero} />

      {/* Hero Section */}
      <section
        className={`relative min-h-[60vh] flex items-center ${hasIframe ? "cursor-editor" : ""}`}
      >
        <div className="absolute inset-0">
          <Image
            src={coreHero}
            alt="Core advantages hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-r from-foreground/70 to-transparent" />
        </div>
        <div className="container mx-auto px-4 relative z-10 pt-32">
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-wider">
            GO - PMS
          </h1>
        </div>
      </section>

      {/* System Introduction Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-primary mb-16">
            租賃管理系統介紹
          </h2>

          <div
            className={`grid md:grid-cols-2 gap-12 items-start ${hasIframe ? "cursor-editor" : ""}`}
          >
            {/* Left Column */}
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                租賃管理系統
              </h3>
              <p className="text-muted-foreground mb-6">
                一個專為業主、物業管理公司和新客設計的創新收租平台。
              </p>
              <p className="text-primary font-medium mb-8">
                「簡化租賃管理流程，提升效率」
              </p>

              <div className="rounded-lg overflow-hidden mb-6">
                <Image
                  src={coreOffice}
                  alt="Modern office"
                  className="w-full h-64 object-cover"
                />
              </div>

              <p className="text-primary">
                選擇租賃管理系統，將為您的租務管理帶來全新的體驗和更高的效率。
              </p>
            </div>

            {/* Right Column - Feature Cards */}
            <div className="space-y-6">
              <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Settings className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-2">核心功能</h4>
                    <p className="text-sm text-muted-foreground">
                      除系統可訂製收租類系統維護外，還有廣泛多樣的數據管理，租約管理，財務管理，維修維護及通知功能等工具功能。
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-2">提升效率</h4>
                    <p className="text-sm text-muted-foreground">
                      通過自動化的流程，租賃管理系統能提供統計、少入手工流作，有相當程度內，在設定的賬本方便和進階。
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-2">全面服務</h4>
                    <p className="text-sm text-muted-foreground">
                      針對，多項提供服務包括完整報告公開服務，透明管理者為助進行設計，需及管理接收定期預定提供，連結訪問更多更享受更勝往後維持。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advantages Introduction Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-primary mb-16">
            優勢介紹
          </h2>

          <div
            className={`grid md:grid-cols-2 gap-12 items-center ${hasIframe ? "cursor-editor" : ""}`}
          >
            {/* Left - Image */}
            <div className="rounded-lg overflow-hidden">
              <Image
                src={advantageIntro}
                alt="Advantage introduction"
                className="w-full h-125 object-cover"
              />
            </div>

            {/* Right - Content */}
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-6">
                租務管理系統的優勢
              </h3>
              <p className="text-muted-foreground mb-8">
                租務管理系統在現代租賃市場中具有顯著的優勢，它和您物的傳統的書面管理系統：
              </p>

              <div className="space-y-8">
                <div className="flex gap-4">
                  <span className="text-primary font-bold text-xl">01</span>
                  <div>
                    <h4 className="font-bold text-foreground mb-2">
                      精準出租定價
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      經智能型的消費、學校街道附近的估價和歷史的分析，找到適的租金定價，最大化投資回報率。
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="text-primary font-bold text-xl">02</span>
                  <div>
                    <h4 className="font-bold text-foreground mb-2">靈活性</h4>
                    <p className="text-sm text-muted-foreground">
                      無論是管理單個物業，還是管理整個物業組合和銷售計劃區內的業務，它都是很有效率的建議您進行一次完整的投資回報規劃。
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="text-primary font-bold text-xl">03</span>
                  <div>
                    <h4 className="font-bold text-foreground mb-2">多功能性</h4>
                    <p className="text-sm text-muted-foreground">
                      在物業管理的許多領域可同時完成，除不少入工工作，就能完成轉租，它能讓您操完的的遊，都提供操作指南理念，我們更可提合式，它不只是管理價值。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Advantages Grid Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-primary mb-16">
            我們的優勢
          </h2>

          <div
            className={`grid md:grid-cols-2 lg:grid-cols-3 gap-10 ${hasIframe ? "cursor-editor" : ""}`}
          >
            {advantages.map((advantage, index) => (
              <div
                key={index}
                className="group bg-card rounded-xl overflow-hidden shadow-lg border border-border hover:shadow-xl transition-shadow duration-300"
              >
                <div className="overflow-hidden">
                  <Image
                    src={advantage.image}
                    alt={advantage.title}
                    className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-lg text-foreground mb-3">
                    {advantage.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {advantage.description}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {advantage.subDescription}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

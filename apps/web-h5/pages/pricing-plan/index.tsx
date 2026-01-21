import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@go-tech-frontend/ui";
import { Check, Minus } from "lucide-react";

const pricingData = {
  plans: [
    { name: "普通版", price: "$1,000", units: "25", extra: "$150/5個" },
    { name: "升級版", price: "$3,200", units: "100", extra: "$130/5個" },
    { name: "豪華版", price: "$12,000", units: "400", extra: "$100/5個" },
  ],
  categories: [
    {
      name: "管理層",
      features: [
        { name: "菜單列表", type: "基本功能", plans: [true, true, true] },
        { name: "角色列表", type: "人事管理", plans: [true, true, true] },
        { name: "選項設定", type: "基本功能", plans: [true, true, true] },
        { name: "使用者列表", type: "人事管理", plans: [true, true, true] },
        { name: "部門列表", type: "人事管理", plans: [true, true, true] },
        { name: "場地列表", type: "場地管理", plans: [true, true, true] },
        { name: "合同簽批", type: "租約管理", plans: [true, true, true] },
        { name: "標準價格列表", type: "價格管理", plans: [true, true, true] },
        { name: "系統文件設定", type: "基本功能", plans: [true, true, true] },
        { name: "報表及分析", type: "基本功能", plans: [true, true, true] },
      ],
    },
    {
      name: "租務部",
      features: [
        { name: "代理列表", type: "代理管理", plans: [false, true, true] },
        { name: "客戶列表", type: "租約管理", plans: [true, true, true] },
        { name: "商舖列表", type: "升級營舖模組", plans: [false, false, true] },
        { name: "合同列表", type: "租約管理", plans: [true, true, true] },
        { name: "營銷列表", type: "升級營舖模組", plans: [false, false, true] },
        { name: "單位列表", type: "單位以及租金管理", plans: [true, true, true] },
        { name: "水電列表", type: "場地管理", plans: [true, true, true] },
        { name: "跟進列表", type: "場地管理", plans: [true, true, true] },
      ],
    },
    {
      name: "場務部",
      features: [
        { name: "日程", type: "場地管理", plans: [true, true, true] },
        { name: "客服列表", type: "升級客戶管理", plans: [false, true, true] },
        { name: "客戶端", type: "升級客戶管理", plans: [false, true, true] },
        { name: "客戶端圖片管理", type: "升級客戶管理", plans: [false, false, true] },
        { name: "客戶端消息管理", type: "升級客戶管理", plans: [false, false, true] },
        { name: "場務手機版", type: "升級場地管理", plans: [false, false, false] },
        { name: "列印跟進單", type: "升級場地管理", plans: [false, false, false] },
      ],
    },
    {
      name: "會計部",
      features: [
        { name: "費用單列表", type: "會計功能", plans: [true, true, true] },
        { name: "租單工具", type: "收租發票", plans: [true, true, true] },
        { name: "支票列表", type: "會計功能", plans: [true, true, true] },
        { name: "發票列表", type: "收租發票", plans: [true, true, true] },
      ],
    },
  ],
  addons: [
    {
      name: "升級營舖模組",
      features: ["商舖列表", "營銷列表"],
      prices: ["+$20 each", "+$15 each", "0"],
    },
    {
      name: "升級場地管理",
      features: ["手機版", "列印跟進單"],
      prices: ["+$20 each", "+$15 each", "0"],
    },
    {
      name: "升級會計",
      features: [],
      prices: ["+$50 each", "+$25 each", "+$15 each"],
    },
    {
      name: "客服",
      features: ["客服列表", "租客portal"],
      prices: ["+$20 each", "+$20 each", "0"],
    },
  ],
};

const PricingPlan = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-6xl font-bold text-primary mb-4">
            計劃適合你的商業
          </h1>
          <p className="text-muted-foreground text-3xl mt-6">
            所有定價計劃均涵蓋租務系統基本功能，並且還有增長空間
          </p>
        </div>
      </section>

      {/* Pricing Table Section */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-15 py-10 bg-primary/20 rounded-lg">
          <div className="overflow-x-auto">
            <div className="border border-primary/40 bg-primary-foreground rounded-lg overflow-hidden min-w-200">
              {/* Header Row */}
              <div className="grid grid-cols-5 bg-muted/30">
                <div className="border-r border-primary/40 grid grid-rows-7 text-center items-center">
                  <div className="row-span-4 py-4 text-3xl font-bold text-foreground self-end">月費</div>
                  <div className="h-full flex items-center justify-center text-muted-foreground mt-1 border-y border-primary/40">支援單位數目</div>
                  <div className="h-full flex items-center justify-center text-muted-foreground border-b border-primary/40">另購外新增單位</div>
                </div>
                <div className="p-4 border-r border-primary/40 grid grid-rows-7 text-center items-center">
                  <div className="row-span-3 text-3xl font-bold text-foreground">功能</div>
                </div>
                {pricingData.plans.map((plan, index) => (
                  <div key={index} className="p-4 border-r border-primary/40 last:border-r-0 grid grid-rows-7 text-center items-center">
                    <div className="row-span-3 text-3xl font-bold mb-1">{plan.name}</div>
                    <div className="text-3xl font-bold text-primary">{plan.price}</div>
                    <div className="h-full flex items-center justify-center text-muted-foreground mt-2">{plan.units}</div>
                    <div className="h-full flex items-center justify-center text-muted-foreground">{plan.extra}</div>
                    <Button size="sm" className="mt-3 ">
                      購買{plan.name}
                    </Button>
                  </div>
                ))}
              </div>

              {/* Feature Categories */}
              {pricingData.categories.map((category, catIndex) => {
                const featuresLangth = category.features.length
                
                return (
                  <div key={catIndex} className={`border-t last:border-b-0 border-primary/40 box-border grid grid-rows-${featuresLangth} relative`}>
                    {category.features.map((feature, fIndex) => {
                      return (
                        <div
                          key={`${catIndex}-${fIndex}`}
                          className={`grid grid-cols-5 hover:bg-muted/40 transition-colors border-b border-primary/40 last:border-none`}
                        >
                          <div className="border-r border-primary/40 flex items-center">
                            <div className="w-14 font-medium text-primary">
                            </div>
                            {fIndex === 0 && (
                              <div className="absolute w-14 top-0 left-0 bg-primary-foreground bottom-0 font-medium text-primary border-r border-primary/40">
                                <div className="w-full h-full flex items-center justify-center">
                                  <span style={{'writingMode': 'vertical-rl'}} className="tracking-widest">{category.name}</span>
                                </div>
                              </div>
                            )}
                            <div className="flex-1 h-full flex items-center justify-center text-foreground border-primary/40">{feature.name}</div>
                          </div>
                          <div className="p-3 border-r border-primary/40 text-center">
                            <span className="text-muted-foreground">{feature.type}</span>
                          </div>
                          {feature.plans.map((available, pIndex) => (
                            <div
                              key={pIndex}
                              className="p-3 flex items-center justify-center border-r border-primary/40 last:border-r-0"
                            >
                              {available ? (
                                <Check className="w-5 h-5 text-primary" />
                              ) : (
                                <Minus className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    })}
                </div>
                )
              })}

              {/* Add-ons Section */}
              {pricingData.addons.map((addon, aIndex) => {
                const addonLength = addon.features.length
                return (
                  <div key={aIndex} className="grid grid-cols-5 border-t border-primary/40 bg-muted/10">
                    <div className={`col-span-1 border-r border-primary/40 flex items-center justify-center`}>
                      <div className="w-14 font-medium text-primary tracking-widest border-r border-primary/40" style={{'writingMode': 'vertical-rl'}}>
                        <div className="p-3">{addon.name}</div>
                      </div>
                      <div className={`flex-1 h-full grid grid-rows-${addonLength} divide-y divide-primary/40`}>
                        {addon.features.map((f, i) => (
                          <div key={i} className="w-full h-full text-muted-foreground flex justify-center items-center">{f}</div>
                        ))}
                      </div>
                    </div>
                    <div className="border-r border-primary/40"></div>
                    {addon.prices.map((price, pIndex) => (
                      <div
                        key={pIndex}
                        className="p-3 flex items-center justify-center border-r border-primary/40 last:border-r-0  text-primary"
                      >
                        {price}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PricingPlan;

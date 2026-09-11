import type { PackageBizCode } from '@go-tech/types';
import {
  BarChart3,
  Bell,
  Coins,
  Fingerprint,
  GraduationCap,
  IdCard,
  Settings,
  Shield,
  Smartphone,
  Target,
  TrendingUp,
  Users
} from 'lucide-react';
import Image from 'next/image';
import Footer from '@/app/components/Footer';
import Header from '@/app/components/Header';
import advantage1 from '@/assets/advantage-1.jpg';
import advantage2 from '@/assets/advantage-2.jpg';
import advantage3 from '@/assets/advantage-3.jpg';
import advantage4 from '@/assets/advantage-4.jpg';
import advantage5 from '@/assets/advantage-5.jpg';
import advantage6 from '@/assets/advantage-6.jpg';
import advantageIntro from '@/assets/advantage-intro.jpg';
import coreOffice from '@/assets/core-office.jpg';
import heroHr from '@/assets/hero-hr.jpg';
import homeOffice from '@/assets/home-office.jpg';
import { defaultCoreAdvantages } from '../../components/blockDefaults';
import { DynamicText } from '../../components/DynamicI18nText';
import HeroSection from '../../components/HeroSection';
import { loadPageBlocks } from '../../lib/pageBlocks';

const content = {
  pms: {
    introHeading: '租賃管理系統介紹',
    introTitle: '租賃管理系統',
    introLead: '一個專為業主、物業管理公司和新客設計的創新收租平台。',
    introQuote: '「簡化租賃管理流程，提升效率」',
    introImage: coreOffice,
    introFooter: '選擇租賃管理系統，將為您的租務管理帶來全新的體驗和更高的效率。',
    introCards: [
      {
        icon: Settings,
        title: '核心功能',
        desc: '物業與單位建檔、租約管理、租金財務、維修跟進與到期通知等完整工具鏈。'
      },
      {
        icon: TrendingUp,
        title: '提升效率',
        desc: '自動出單、自動催繳與批量通知，大幅減少人手重複操作與出錯機會。'
      },
      {
        icon: Shield,
        title: '全面服務',
        desc: '由開戶、資料導入到日常支援，專人跟進，讓系統真正落地使用。'
      }
    ],
    advIntroHeading: '優勢介紹',
    advIntroImage: advantageIntro,
    advIntroTitle: '租務管理系統的優勢',
    advIntroLead: '租務管理系統在現代租賃市場中具有顯著的優勢，相比傳統的人手書面管理：',
    advIntroPoints: [
      {
        title: '精準出租定價',
        desc: '結合區域行情與歷史成交分析，找出合適的租金定價，最大化投資回報率。'
      },
      {
        title: '靈活性',
        desc: '無論是管理單個物業，還是整個物業組合，都能彈性配置，隨業務規模成長。'
      },
      {
        title: '多功能性',
        desc: '租務、財務、維修與客服在同一平台完成，減少跨系統切換與資料重複輸入。'
      }
    ],
    gridHeading: '我們的優勢',
    advantages: [
      {
        image: advantage1,
        title: '多樣化的租賃服務',
        description:
          '無論您是管理住宅、商業大廈還是工廈、單位、車位、倉庫、儲物位、廣告位、天台等等，我們的系統都能滿足您的需求。',
        subDescription: '從房產登記、租戶管理到自動化帳單計算，一站式完整銜接。'
      },
      {
        image: advantage2,
        title: '提高管理效率',
        description: '自動收租、自動產生賬單和催繳功能，已成為最廣泛使用的租賃管理工具。',
        subDescription: '管理多處物業只需按幾個鍵，節省大量工時。'
      },
      {
        image: advantage3,
        title: '加強財務透明度',
        description: '精確而全面的數據報表，幫助投資者進行細緻入微的投資和財務分析。',
        subDescription: '內設報告功能，讓物業表現分析更加簡潔清晰。'
      },
      {
        image: advantage4,
        title: '極簡學習曲線',
        description: '介面直觀，無需專業訓練即可上手操作。',
        subDescription: '客戶服務隨時提供快速技術支援，以及業界趨勢洞察。'
      },
      {
        image: advantage5,
        title: '數據分析與決策支持',
        description: '市場趨勢分析，理解工商、住宅等產業發展趨勢，協助策略制定。',
        subDescription: '由平台數據展示到詳細報告，協助用戶做出最明智的決策。'
      },
      {
        image: advantage6,
        title: '優質客服協助',
        description: '可靠的系統功能配合優質客服團隊，為用戶提供更多輔助工具。',
        subDescription: '無論您有什麼問題，團隊會在 24 小時內回覆並積極提供解決方案。'
      }
    ]
  },
  hr: {
    introHeading: '人力資源管理系統介紹',
    introTitle: '人力資源管理系統',
    introLead: '一站式 SaaS 人事平台，覆蓋人事、考勤、薪資、審批、績效、培訓與報表分析。',
    introQuote: '「建立標準化、數碼化的人力資源管理流程」',
    introImage: homeOffice,
    introFooter: '由入職到離職、由打卡到出糧，GO-HR 讓人事行政真正一站完成，準確又高效。',
    introCards: [
      {
        icon: IdCard,
        title: '核心功能',
        desc: '員工資料、入職離職、組織架構、部門職位、打卡假期、薪資發放、績效培訓全模組覆蓋。'
      },
      {
        icon: Fingerprint,
        title: '考勤自動化',
        desc: '排班輪更、手機定位打卡、補卡與請假審批，考勤數據直接帶入薪資計算。'
      },
      {
        icon: Shield,
        title: '薪酬保密可控',
        desc: '分層權限管控，薪資與個人敏感資料只有授權人員可查看，操作全程留痕。'
      }
    ],
    advIntroHeading: '優勢介紹',
    advIntroImage: heroHr,
    advIntroTitle: 'GO-HR 人力資源系統的優勢',
    advIntroLead: '相比 Excel 與人手處理，GO-HR 讓中小企、連鎖店、服務業及多部門企業的人事管理更準確、更省時：',
    advIntroPoints: [
      {
        title: '按員工人數彈性開通',
        desc: '依實際員工人數訂閱，人數增減隨時調整，中小企也能低成本用上完整人事系統。'
      },
      {
        title: '全流程數碼留痕',
        desc: '入職、調崗、加薪、離職與審批全部有紀錄可追溯，勞資爭議時有據可依。'
      },
      {
        title: '考勤薪資自動貫通',
        desc: '打卡、假期、獎金罰款自動帶入薪資計算，出糧不再人手對數，減少出錯。'
      }
    ],
    gridHeading: '我們的優勢',
    advantages: [
      {
        icon: IdCard,
        title: '人事檔案集中管理',
        description: '員工資料、合約文件、證件到期、家庭聯絡人統一建檔，入職離職流程標準化。',
        subDescription: '人員異動與檔案變更全程留痕，隨時查閱歷史紀錄。'
      },
      {
        icon: Users,
        title: '組織架構清晰可視',
        description: '部門管理、職位管理與職位架構圖形化呈現，匯報關係一目瞭然。',
        subDescription: '多部門企業亦可依架構設定審批層級與資料權限。'
      },
      {
        icon: Fingerprint,
        title: '考勤假期一站處理',
        description: '支援排班輪更、外勤定位打卡、補卡申請，假期規則與結餘自訂。',
        subDescription: '打卡記錄與異常出勤即時統計，主管手機即可審批。'
      },
      {
        icon: Coins,
        title: '薪資計算自動準確',
        description: '薪資方案彈性設定，考勤、獎金與罰款自動帶入，一鍵生成薪資單。',
        subDescription: '發薪記錄完整存檔，支援強積金與稅務相關報表匯出。'
      },
      {
        icon: Target,
        title: '績效與培訓並重',
        description: '自訂考核方案與週期，員工自評、主管覆核，評估結果與晉升掛鈎。',
        subDescription: '培訓計劃與培訓記錄完整存檔，助人才持續成長。'
      },
      {
        icon: BarChart3,
        title: '報表分析支援決策',
        description: '人力結構、離職率、出勤異常與薪酬成本多維報表，一頁看盡。',
        subDescription: '支援匯出分享，為管理層人力規劃提供數據依據。'
      }
    ],
    extraHighlights: [
      { icon: Bell, title: '消息通知', desc: '入職提醒、合約到期、生日祝賀與待辦審批即時推送。' },
      { icon: Smartphone, title: '員工自助', desc: '手機自助打卡、請假、查看薪資單與假期結餘。' },
      { icon: GraduationCap, title: '培訓管理', desc: '培訓計劃安排、出席記錄與成效回顧完整閉環。' }
    ]
  }
} as const;

export default async function Page({ searchParams }: { searchParams: Promise<{ product?: string | string[] }> }) {
  const blocks = await loadPageBlocks('core-advantages', defaultCoreAdvantages);

  const productParam = (await searchParams).product;
  const requestedProduct = Array.isArray(productParam) ? productParam[0] : productParam;
  const product: PackageBizCode = requestedProduct === 'hr' ? 'hr' : 'pms';

  const c = content[product];

  const hasIframe = false;

  return (
    <div className="min-h-screen bg-background">
      <Header initialBlocks={blocks} />

      {/* Hero Section */}
      <HeroSection initialBlocks={blocks} page="core-advantages" />

      {/* System Introduction Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div key={product} className="animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-primary mb-16">
              <DynamicText text={c.introHeading} />
            </h2>

            <div className={`grid md:grid-cols-2 gap-12 items-start ${hasIframe ? 'cursor-editor' : ''}`}>
              {/* Left Column */}
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  <DynamicText text={c.introTitle} />
                </h3>
                <p className="text-muted-foreground mb-6">
                  <DynamicText text={c.introLead} />
                </p>
                <p className="text-primary font-medium mb-8">
                  <DynamicText text={c.introQuote} />
                </p>

                <div className="rounded-lg overflow-hidden mb-6">
                  <Image src={c.introImage} alt={c.introTitle} className="w-full h-64 object-cover" />
                </div>

                <p className="text-primary">
                  <DynamicText text={c.introFooter} />
                </p>
              </div>

              {/* Right Column - Feature Cards */}
              <div className="space-y-6">
                {c.introCards.map(card => (
                  <div className="bg-card p-6 rounded-lg border border-border shadow-sm" key={card.title}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <card.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground mb-2">
                          <DynamicText text={card.title} />
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          <DynamicText text={card.desc} />
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advantages Introduction Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-primary mb-16">
            <DynamicText text={c.advIntroHeading} />
          </h2>

          <div className={`grid md:grid-cols-2 gap-12 items-center ${hasIframe ? 'cursor-editor' : ''}`}>
            {/* Left - Image */}
            <div className="rounded-lg overflow-hidden">
              <Image src={c.advIntroImage} alt={c.advIntroTitle} className="w-full h-125 object-cover" />
            </div>

            {/* Right - Content */}
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-6">
                <DynamicText text={c.advIntroTitle} />
              </h3>
              <p className="text-muted-foreground mb-8">
                <DynamicText text={c.advIntroLead} />
              </p>

              <div className="space-y-8">
                {c.advIntroPoints.map((point, i) => (
                  <div key={point.title} className="flex gap-4">
                    <span className="text-primary font-bold text-xl">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <h4 className="font-bold text-foreground mb-2">
                        <DynamicText text={point.title} />
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        <DynamicText text={point.desc} />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Advantages Grid Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-primary mb-16">
            <DynamicText text={c.gridHeading} />
          </h2>

          <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-10 ${hasIframe ? 'cursor-editor' : ''}`}>
            {c.advantages.map(advantage => (
              <div
                key={advantage.title}
                className="group bg-card rounded-xl overflow-hidden shadow-lg border border-border hover:shadow-xl transition-shadow duration-300"
              >
                {'image' in advantage && advantage.image ? (
                  <div className="overflow-hidden">
                    <Image
                      src={advantage.image}
                      alt={advantage.title}
                      className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-56 flex items-center justify-center bg-primary/5">
                    {'icon' in advantage && advantage.icon && (
                      <advantage.icon
                        className="w-24 h-24 text-primary group-hover:scale-110 transition-transform duration-300"
                        strokeWidth={1.4}
                      />
                    )}
                  </div>
                )}
                <div className="p-6">
                  <h3 className="font-bold text-lg text-foreground mb-3">
                    <DynamicText text={advantage.title} />
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    <DynamicText text={advantage.description} />
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <DynamicText text={advantage.subDescription} />
                  </p>
                </div>
              </div>
            ))}
          </div>
          {'extraHighlights' in c && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 mt-10">
              {c.extraHighlights.map(h => (
                <div
                  key={h.title}
                  className="group bg-card rounded-xl overflow-hidden shadow-lg border border-border hover:shadow-xl hover:border-primary/40 transition-all duration-300"
                >
                  <div className="h-56 flex items-center justify-center bg-primary/5">
                    <h.icon
                      className="w-24 h-24 text-primary group-hover:scale-110 transition-transform duration-300"
                      strokeWidth={1.4}
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-lg text-foreground mb-3">{h.title}</h3>
                    <p className="text-sm text-muted-foreground">{h.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

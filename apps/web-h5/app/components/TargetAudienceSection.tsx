'use client';

import { Button } from '@go-tech-frontend/ui';
import { BarChart3, FileText, Wallet, Wrench } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { audienceProducts } from '@/app/components/blockDefaults';
import Link from '@/app/components/Link';
import { useIframeContext } from '@/contexts/IframeContext';
import { useOptionalProductSelection } from '@/contexts/ProductSelectionContext';
import { DynamicText } from './DynamicI18nText.client';
import { type AudienceBlock, type AudienceItem, type PageBlock } from './PageBlocks';
import SwipeRow from './SwipeRow';

const resolveAudiences = (blocks: PageBlock[], productKey: 'hr' | 'pms') => {
  const block = blocks.find(
    (candidate): candidate is AudienceBlock => candidate.type === 'audiences' && candidate.id === 'home-audiences'
  );
  const configuredProduct = block?.products?.find(product => product.key === productKey);
  const legacyAudiences = productKey === 'pms' ? block?.audiences : undefined;
  const defaults = audienceProducts.find(product => product.key === productKey)?.audiences || [];

  return configuredProduct?.audiences || legacyAudiences || defaults;
};

const coreFeatures = [
  {
    icon: FileText,
    zh: '租契與合規管理',
    en: 'Lease & Compliance Management',
    desc: '統一儲存租約、釘契、按金記錄，自動提示租約到期，符合香港租務營運需要。'
  },
  {
    icon: Wallet,
    zh: '帳務與自動收租',
    en: 'Billing & Auto Rent Collection',
    desc: '租金、差餉、管理費自動計算，電子收據即時發送，帳目清晰可追溯。'
  },
  {
    icon: Wrench,
    zh: '維修工單管理',
    en: 'Maintenance Workflow',
    desc: '租客提交維修申請，線上跟進進度，訊息同步業主、租戶及維修人員。'
  },
  {
    icon: BarChart3,
    zh: '物業資產報表',
    en: 'Property Portfolio Analytics',
    desc: '一鍵匯出收益、空置率、收款狀況報表，掌握整個物業組合表現。'
  }
];

const TargetAudienceSection = ({ initialBlocks }: { initialBlocks?: PageBlock[] }) => {
  const { hasIframe } = useIframeContext();
  const productSelection = useOptionalProductSelection();
  const [blocks, setBlocks] = useState<PageBlock[]>(initialBlocks || []);

  useEffect(() => {
    setBlocks(initialBlocks || []);
  }, [initialBlocks]);

  useEffect(() => {
    if (!hasIframe) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'SET_PAGE_BLOCKS' || event.data.page !== 'home') return;
      if (!Array.isArray(event.data.blocks)) return;
      setBlocks(event.data.blocks as PageBlock[]);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [hasIframe]);

  const productKey = productSelection?.product || 'pms';
  const activeAudiences = resolveAudiences(blocks, productKey);

  return (
    <section className="py-16 bg-secondary">
      <div className="container mx-auto px-4">
        {productKey === 'pms' && (
          <div className="mb-14 bg-background rounded-xl shadow-sm border-l-4 border-primary p-6 md:p-10">
            <h2 className="text-2xl font-bold text-foreground mb-5">簡介/Introduction</h2>
            <div className="space-y-4 text-base md:text-lg text-foreground/80 leading-relaxed">
              <p>
                面對繁瑣紙本租簿、到期租契容易遺忘、按金與差餉帳目混亂、維修跟進耗時等香港租務常見痛點，
                <span className="font-semibold text-primary">Go Techs 租務系統</span>
                專為香港業主、物業管理公司、地產代理及資產管理團隊打造。
              </p>
              <p>
                無論是住宅單位、屋苑、商舖、工廈或服務式公寓，都可以透過雲端平台集中管理全部物業。電子租約存檔、自動租金提醒、單據管理、維修工單、租戶檔案、收益報表一應俱全。
              </p>
              <p>
                擺脫手動抄帳、多個檔案夾分散資料，隨時在手機或電腦查閱物業租務狀況。以科技簡化租務流程，減少業主與租客之間的爭議，讓您專注物業資產增值。
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-bold text-foreground">
            <DynamicText text="理想客戶" /> / Target Audience
          </h2>
          <Link href="/target-audience">
            <Button variant="default" size="sm">
              <DynamicText text="查看更多" />
            </Button>
          </Link>
        </div>

        <SwipeRow
          className={`flex md:block md:space-y-8 overflow-x-auto md:overflow-visible snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 gap-4 pb-3 md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:shrink-0 [&>*]:basis-[85%] [&>*]:snap-center md:[&>*]:basis-auto animate-fade-in ${hasIframe ? 'cursor-editor' : ''}`}
          data-block-id="audiences"
          data-block-role="Target Audience"
          data-product-key={productKey}
        >
          {activeAudiences.map((audience: AudienceItem, index: number) => (
            <div
              key={`${productKey}-${audience.sort}`}
              data-block-id="home-audiences"
              data-block-role="audiences"
              data-block-seq={audience.sort}
              data-product-key={productKey}
              className={`flex flex-col ${
                index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'
              } gap-6 items-center bg-background rounded-xl overflow-hidden shadow-sm`}
            >
              <div className="w-full md:w-2/5 h-64 md:h-80 relative">
                <Image
                  data-block-id="home-audiences"
                  data-block-role="img"
                  data-block-seq={audience.sort}
                  src={audience.initialSrc || audience.image || '/images/hero-hr.jpg'}
                  alt={audience.title}
                  fill
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="w-full md:w-3/5 p-6 md:p-10">
                <div className="flex items-start gap-4">
                  <span className="text-4xl font-bold text-primary opacity-50">{index + 1}</span>
                  <div>
                    <h4
                      className="text-xl font-bold text-foreground mb-3"
                      data-block-id="home-audiences"
                      data-block-role="title"
                      data-block-seq={audience.sort}
                    >
                      <DynamicText text={audience.title} />
                    </h4>
                    <p
                      className="text-muted-foreground leading-relaxed"
                      data-block-id="home-audiences"
                      data-block-role="description"
                      data-block-seq={audience.sort}
                    >
                      <DynamicText text={audience.description} />
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </SwipeRow>

        {productKey === 'pms' && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-foreground mb-10">核心功能/Core Features</h2>
            <SwipeRow className="flex md:grid md:grid-cols-2 lg:grid-cols-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 gap-5 pb-3 md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:shrink-0 [&>*]:basis-[85%] [&>*]:snap-center md:[&>*]:basis-auto">
              {coreFeatures.map(f => (
                <div
                  key={f.zh}
                  className="group bg-background rounded-xl p-6 shadow-sm border border-border hover:border-primary hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <f.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{f.zh}</h3>
                  <p className="text-xs font-medium text-primary mt-1 mb-3">{f.en}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </SwipeRow>
          </div>
        )}
      </div>
    </section>
  );
};

export default TargetAudienceSection;

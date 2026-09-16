'use client';

import { Button } from '@go-tech-frontend/ui';
import { useTranslations } from 'next-intl';
import Link from '@/app/components/Link';
import homeOffice from '@/assets/home-office.jpg';
import { useProductSelection } from '@/contexts/ProductSelectionContext';
import { DynamicText } from './DynamicI18nText.client';

const products = [
  {
    key: 'pms',
    semibold: '揮別租務公司的煩惱',
    title: 'GOTECH租務系統',
    relaxedSemibold: 'Gotech是一個專為租務管理打造的雲端系統，協助您輕鬆管理物業、追蹤租金收入並簡化溝通流程。',
    relaxedOffers: '簡省90%~95%的管理費用',
    relaxedGoal: '租務行業,最低收費',
    relaxedStep: '完成簽約只需 5 個步驟'
  },
  {
    key: 'hr',
    semibold: '揮別人手處理人事的煩惱',
    title: 'GOTECH HR 人力資源系統',
    relaxedSemibold: '由入職、考勤、假期審批到出糧與強積金報表，全部在雲端一站完成，資料即時同步、準確可追溯。',
    relaxedOffers: '減省 80% 以上人事行政工時',
    relaxedGoal: '按員工人數開通,彈性收費',
    relaxedStep: '完成簽約只需 5 個步驟'
  }
];

const StatsSection = () => {
  const t = useTranslations('StatsSection');
  const { product } = useProductSelection();
  const content = products.find(item => item.key === product);

  if (!content) return null;

  return (
    <section className="py-16 relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${homeOffice})` }} />
      <div className="absolute inset-0 bg-secondary/90" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-sm font-semibold text-primary mb-2">
              <DynamicText text={content.semibold} />
            </h3>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
              <DynamicText text={content.title} />
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              <DynamicText text={content.relaxedSemibold} />
            </p>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              <DynamicText text={content.relaxedOffers} />
            </p>

            <div className="space-y-3">
              <p className="text-lg text-muted-foreground">
                <DynamicText text={content.relaxedGoal} />
              </p>
              <p className="text-3xl font-bold text-primary">
                <DynamicText text={content.relaxedStep} />
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <Link href="/contact">
              <Button size="lg" className="px-8 py-6 text-lg">
                {t('relaxedContact')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;

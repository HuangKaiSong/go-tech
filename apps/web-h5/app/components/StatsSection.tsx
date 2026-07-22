'use client';

import { Button } from '@go-tech-frontend/ui';
import { useTranslations } from 'next-intl';
import Link from '@/app/components/Link';
import homeOffice from '@/assets/home-office.jpg';

const StatsSection = () => {
  const t = useTranslations('StatsSection');

  return (
    <section className="py-16 relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${homeOffice})` }} />
      <div className="absolute inset-0 bg-secondary/90" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-sm font-semibold text-primary mb-2">{t('semibold')}</h3>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">{t('title')}</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">{t('relaxedSemibold')}</p>
            <p className="text-muted-foreground mb-8 leading-relaxed">{t('relaxedOffers')}</p>

            <div className="space-y-3">
              <p className="text-lg text-muted-foreground">{t('relaxedGoal')}</p>
              <p className="text-3xl font-bold text-primary">{t('relaxedStep')}</p>
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

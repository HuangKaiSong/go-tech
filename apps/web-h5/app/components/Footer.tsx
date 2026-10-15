import { Mail, MapPin, Phone, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DynamicText } from './DynamicI18nText';
// import Image from 'next/image';
import Link from './Link';
// import { TrialAction } from './trial-action';

const groups = [
  {
    title: '方案/費用',
    links: [
      ['方案介紹', '/service-plan'],
      ['了解費用', '/service-plan']
    ]
  },
  {
    title: '服務/支援',
    links: [
      ['使用說明/教學', '/system-features'],
      ['聯絡我們', '/contact']
    ]
  },
  {
    title: '關於我們',
    links: [
      ['公司簡介', '/core-advantages'],
      ['查看品牌', '/']
    ]
  }
];

const Footer = () => {
  const t = useTranslations('Footer');

  return (
    <footer className="bg-foreground text-background pt-10 pb-6 md:py-12">
      <div className="container mx-auto px-5 md:px-4">
        <div className="grid md:grid-cols-5 gap-8 mb-8">
          {/* <Image
            src="/images/Gotech_Logo.webp"
            loading="eager"
            alt="logo"
            width={120}
            height={120}
            className="w-full max-w-30"
          />
          <div>
            <h4 className="font-semibold mb-4">{t('business')}</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link href="/system-features" className="hover:text-primary transition-colors">
                  {t('rentalManagement')}
                </Link>
              </li>
              <li>
                <Link href="/system-features" className="hover:text-primary transition-colors">
                  {t('rentCollection')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t('audience')}</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link href="/target-audience" className="hover:text-primary transition-colors">
                  {t('pmsSubscribers')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t('aboutUs')}</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link href="/service-plan" className="hover:text-primary transition-colors">
                  {t('servicePlan')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  {t('contact')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <ul className="space-y-2 text-sm text-white/80">
              <li>
                <TrialAction className="hover:text-primary transition-colors">{t('tryNow')}</TrialAction>
              </li>
            </ul>
          </div> */}

          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Settings className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">GO-TECHS</span>
            </div>
            <p className="text-background/70 text-sm mb-4">
              <DynamicText text="專業租務管理系統" />
            </p>
            <ul className="md:hidden inline-flex flex-col items-start gap-2 text-sm text-background/70">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <span>+852 5971 1918</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <span>info@go-techs.com</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <DynamicText text="香港九龍觀塘道123號" />
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 grid grid-cols-3 gap-4 md:gap-8 border-t border-background/15 pt-6 md:border-0 md:pt-0">
            {groups.map(g => (
              <div key={g.title} className="text-center md:text-left">
                <h4 className="font-semibold mb-3 md:mb-4">
                  <DynamicText text={g.title} />
                </h4>
                <ul className="space-y-2 text-sm text-background/70">
                  {g.links.map(([label, to]) => (
                    <li key={label}>
                      <Link href={to} className="hover:text-primary transition-colors">
                        <DynamicText text={label} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-background/20 pt-5 md:pt-8 flex flex-col-reverse md:flex-row justify-between items-center gap-3 text-xs md:text-sm text-background/50">
          <p>{t('copyright')}</p>
          <div className="flex gap-5 md:gap-6">
            <Link href="/legal-agreement/terms/refund" className="hover:text-primary transition-colors">
              {t('refundPolicy')}
            </Link>
            <Link href="/legal-agreement/terms/terms-of-use" className="hover:text-primary transition-colors">
              {t('termsOfUse')}
            </Link>
            <Link href="/legal-agreement/terms/privacy" className="hover:text-primary transition-colors">
              {t('privacyPolicy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

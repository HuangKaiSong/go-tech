import { Mail, MapPin, Phone, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DynamicText } from './DynamicI18nText';
import Link from './Link';

const groups = [
  {
    title: '產品/方案',
    links: [
      ['核心優勢', '/core-advantages'],
      ['查看系統功能', '/system-features'],
      ['服務計劃', '/service-plan']
    ]
  },
  {
    title: '客戶/支援',
    links: [
      ['理想客戶', '/target-audience'],
      ['需求反饋', '/feedback']
    ]
  },
  {
    title: '關於我們',
    links: [
      ['公司簡介', '/contact'],
      ['合作夥伴加盟', '/contact?tab=partner']
    ]
  }
];

const Footer = () => {
  const t = useTranslations('Footer');

  return (
    <footer className="bg-[hsl(220_20%_20%)] text-background pt-10 pb-6 md:py-12">
      <div className="w-full max-w-350 mx-auto px-5 md:px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Settings className="w-6 h-6 text-primary-foreground" aria-hidden="true" />
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
                      <Link
                        href={to}
                        className="hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-4"
                      >
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
          <p>
            <DynamicText text="© 2024 GO-TECHS 版權所有" />
          </p>
          <p className="font-semibold text-primary text-center">
            <DynamicText text="Go Techs — 租務數碼，一 Go 到位。" />
          </p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 md:gap-x-6">
            <Link
              href="/legal-agreement/terms/refund"
              className="hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-4"
            >
              {t('refundPolicy')}
            </Link>
            <Link
              href="/legal-agreement/terms/terms-of-use"
              className="hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-4"
            >
              {t('termsOfUse')}
            </Link>
            <Link
              href="/legal-agreement/terms/privacy"
              className="hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-4"
            >
              {t('privacyPolicy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

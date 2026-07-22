import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';

const Footer = () => {
  const t = useTranslations('Footer');

  return (
    <footer className="bg-black/70 text-white/80 py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-5 gap-8 mb-8">
          <Image
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
                <Link href="/free-trial" className="hover:text-primary transition-colors">
                  {t('tryNow')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-white/70">
          <p>{t('copyright')}</p>
          <div className="flex gap-6 mt-4 md:mt-0">
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

'use client';

import { Button, Dialog, DialogContent, Input, Textarea, toast } from '@go-tech-frontend/ui';
import { Award, Handshake, Headphones, Info, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import Footer from '@/app/components/Footer';
import Header from '@/app/components/v2/Header';
import { useProgressRouter } from '@/app/hooks/use-progress-router';
import partnerBanner from '@/assets/partner-banner.jpg';
import { clientFetch } from '@/lib/client-http/client-fetch';
import { isNotifiedClientHttpError } from '@/lib/client-http/client-http-error';
import { DynamicText } from '../../components/DynamicI18nText.client';
import { useBatchTranslation } from '../../hooks/useBatchTranslation';
import AboutUs from './about-us';
import styles from './contact.module.css';

const partnerBenefits = [
  { icon: TrendingUp, title: '豐厚佣金回報', description: '按成交與續費持續分成' },
  { icon: Headphones, title: '全方位培訓支援', description: '產品、銷售及實施培訓' },
  { icon: Award, title: '官方認證夥伴', description: '共享品牌與客戶資源' }
];

const Page = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useProgressRouter();
  const tab = searchParams.get('tab') === 'partner' ? 'partner' : 'about';
  const banner =
    tab === 'about'
      ? ['About Us', '關於我們', '以科技推動物業管理智能化']
      : ['Partner Program', '合作夥伴加盟', '想賺取更多, 立即加入我們'];
  const setTab = (nextTab: 'about' | 'partner') => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextTab === 'partner') params.set('tab', 'partner');
    else params.delete('tab');
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ''}`);
  };
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const namePlaceholder = useBatchTranslation('請輸入您的姓名');
  const emailPlaceholder = useBatchTranslation('請輸入您的電子郵箱');
  const phonePlaceholder = useBatchTranslation('請輸入您的聯繫電話');
  const messagePlaceholder = useBatchTranslation('請輸入您想對我們說的');
  const submitFailed = useBatchTranslation('提交失敗，請稍後重試');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setPending(true);

      const response = await clientFetch('/go-tech/platform/leaveMessage/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result?.code !== 200) throw new Error(submitFailed);

      // Show success dialog
      setShowSuccess(true);
      // Reset form
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      if (!isNotifiedClientHttpError(error)) toast.error(error instanceof Error ? error.message : submitFailed);
    } finally {
      setPending(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <section
        className={`${styles.content} relative -mt-16 md:-mt-25 pt-24 md:pt-28 min-h-90 md:min-h-110 flex items-center`}
      >
        <Image src={partnerBanner} alt="Go Techs 合作夥伴" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-linear-to-r from-foreground/85 via-foreground/60 to-foreground/20" />
        <div className="w-full max-w-350 mx-auto px-4 relative z-10 py-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/20 text-primary border border-primary/40 px-3 py-1 text-xs font-semibold mb-4">
            <Handshake className="w-4 h-4" aria-hidden="true" /> {banner[0]}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-background mb-3">
            <DynamicText text={banner[1]} />
          </h1>
          <p className="text-2xl md:text-3xl font-bold text-primary">
            <DynamicText text={banner[2]} />
          </p>
        </div>
      </section>

      <main className={`${styles.content} flex-1 pb-16 bg-linear-to-b from-primary/10 to-background`}>
        <div className="w-full max-w-350 mx-auto px-4">
          <nav aria-label="關於我們與合作夥伴" className="flex justify-center -mt-7 relative z-20 mb-10">
            <div className="inline-flex p-1 rounded-full bg-card shadow-lg border border-border">
              {(
                [
                  ['about', Info, '關於我們'],
                  ['partner', Handshake, '合作夥伴加盟']
                ] as const
              ).map(([key, Icon, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  aria-current={tab === key ? 'page' : undefined}
                  className={`inline-flex items-center gap-1.5 px-3 md:px-7 py-2.5 rounded-full text-xs md:text-base whitespace-nowrap font-semibold transition-all focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${tab === key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <DynamicText text={label} />
                </button>
              ))}
            </div>
          </nav>
          {tab === 'about' ? (
            <AboutUs />
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto relative z-10 mb-10">
                {partnerBenefits.map(({ description, icon: Icon, title }) => (
                  <div
                    key={title}
                    className="bg-card rounded-xl shadow-lg border border-border p-5 flex items-start gap-3"
                  >
                    <div className="w-10 h-10 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">
                        <DynamicText text={title} />
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <DynamicText text={description} />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="max-w-2xl mx-auto bg-card rounded-xl shadow-lg border-t-4 border-primary p-8 md:p-12">
                <h2 className="text-3xl md:text-4xl font-bold text-primary text-center mb-2">
                  <DynamicText text="申請成為合作夥伴" />
                </h2>
                <p className="text-center text-muted-foreground mb-10">
                  <DynamicText text="填寫以下資料，我們的夥伴團隊將盡快與您聯繫" />
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="contact-name" className="block text-lg font-medium text-foreground mb-2">
                      <DynamicText text="姓名" /> <span className="text-primary">*</span>
                    </label>
                    <Input
                      id="contact-name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={namePlaceholder}
                      required
                      className="h-12 border-input"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-email" className="block text-lg font-medium text-foreground mb-2">
                      <DynamicText text="電子郵箱" /> <span className="text-primary">*</span>
                    </label>
                    <Input
                      id="contact-email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={emailPlaceholder}
                      required
                      className="h-12 border-input"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-phone" className="block text-lg font-medium text-foreground mb-2">
                      <DynamicText text="聯繫電話" /> <span className="text-primary">*</span>
                    </label>
                    <Input
                      id="contact-phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder={phonePlaceholder}
                      required
                      className="h-12 border-input"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-lg font-medium text-foreground mb-2">
                      <DynamicText text="您想說的" /> <span className="text-primary">*</span>
                    </label>
                    <Textarea
                      id="contact-message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder={messagePlaceholder}
                      required
                      className="min-h-30 border-input resize-none"
                    />
                  </div>

                  <div className="pt-4">
                    <Button type="submit" className="w-full max-w-xs mx-auto block h-12 text-lg" loading={pending}>
                      <DynamicText text="提交申請" />
                    </Button>
                  </div>
                </form>
              </div>
              <p className="mt-10 text-center text-lg md:text-xl font-bold text-foreground">
                <DynamicText text="成為" /> <span className="text-primary">Go Techs</span>{' '}
                <DynamicText text="的加盟實施夥伴" />
              </p>
            </>
          )}
        </div>
      </main>

      <Footer />

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md text-center p-8">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            <DynamicText text="發送成功" />
          </h2>
          <p className="text-muted-foreground">
            <DynamicText text="我們看到後會第一時間跟您聯繫，請耐心等待並保持電話暢通。" />
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default function ContactPage() {
  return (
    <Suspense>
      <Page />
    </Suspense>
  );
}

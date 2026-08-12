'use client';

import { Button, Dialog, DialogContent, Input, Textarea, toast } from '@go-tech-frontend/ui';
import { useLocale } from 'next-intl';
import { useState } from 'react';
import Footer from '@/app/components/Footer';
import Header from '@/app/components/Header';
import { translateError } from '@/app/lib/translate-error';
import { HttpError, httpFetch } from '@/lib/http-fetch';
import { DynamicText } from '../components/DynamicI18nText.client';
import { useBatchTranslation } from '../hooks/useBatchTranslation';

const Page = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const locale = useLocale();
  const namePlaceholder = useBatchTranslation('請輸入您的姓名');
  const emailPlaceholder = useBatchTranslation('請輸入您的電子郵箱');
  const phonePlaceholder = useBatchTranslation('請輸入您的聯繫電話');
  const messagePlaceholder = useBatchTranslation('請輸入您想對我們說的');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setPending(true);

      const response = await httpFetch('/go-tech/platform/leaveMessage/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result && result.code && result.code === 200) {
        // Show success dialog
        setShowSuccess(true);
        // Reset form
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        toast.error((await translateError(result.message, locale)) || result.message);
      }
    } catch (error) {
      // httpFetch 已将服务端中文 message 翻译为当前语言
      if (error instanceof HttpError) {
        toast.error(error.message);
      }
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

      {/* Main Content */}
      <main className="flex-1 pt-32 pb-16 bg-linear-to-b from-primary/10 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold text-primary text-center mb-10">
              <DynamicText text="聯繫我們" />
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  <DynamicText text="姓名" /> <span className="text-primary">*</span>
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={namePlaceholder}
                  required
                  className="h-12 border-gray-300"
                />
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  <DynamicText text="電子郵箱" /> <span className="text-primary">*</span>
                </label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={emailPlaceholder}
                  required
                  className="h-12 border-gray-300"
                />
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  <DynamicText text="聯繫電話" /> <span className="text-primary">*</span>
                </label>
                <Input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={phonePlaceholder}
                  required
                  className="h-12 border-gray-300"
                />
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  <DynamicText text="您想說的" /> <span className="text-primary">*</span>
                </label>
                <Textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={messagePlaceholder}
                  required
                  className="min-h-30 border-gray-300 resize-none"
                />
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full max-w-xs mx-auto block h-12 text-lg" loading={pending}>
                  <DynamicText text="發送" />
                </Button>
              </div>
            </form>
          </div>
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

export default Page;

'use client';

import { Button } from '@go-tech-frontend/ui';
import { DatabaseZap, RefreshCw } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import Link from '@/app/components/Link';
import Header from '@/app/components/v2/Header';

const messages = {
  'zh-hk': {
    title: '反饋服務暫時無法連接',
    description: '暫時無法載入反饋資料，請稍後重試。',
    retry: '重新載入',
    pending: '正在重新載入…',
    home: '返回首頁'
  },
  'zh-cn': {
    title: '反馈服务暂时无法连接',
    description: '暂时无法加载反馈数据，请稍后重试。',
    retry: '重新加载',
    pending: '正在重新加载…',
    home: '返回首页'
  },
  'en-us': {
    title: 'Feedback service is temporarily unavailable',
    description: 'We couldn’t load the feedback data. Please try again shortly.',
    retry: 'Try again',
    pending: 'Retrying…',
    home: 'Back to home'
  }
};

export default function FeedbackUnavailable() {
  const locale = useLocale();
  const copy = messages[locale as keyof typeof messages] ?? messages['zh-hk'];
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      <Header />
      <main className="flex min-h-[70vh] items-center justify-center px-6 py-24">
        <section aria-labelledby="feedback-unavailable-title" className="w-full max-w-lg text-center">
          <DatabaseZap aria-hidden="true" className="mx-auto mb-6 size-12 text-muted-foreground" />
          <h1 id="feedback-unavailable-title" className="text-2xl font-semibold text-foreground">
            {copy.title}
          </h1>
          <p className="mt-4 text-muted-foreground">{copy.description}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button disabled={pending} onClick={() => startTransition(() => router.refresh())}>
              <RefreshCw aria-hidden="true" className={`mr-2 size-4${pending ? ' animate-spin' : ''}`} />
              <span role="status">{pending ? copy.pending : copy.retry}</span>
            </Button>
            <Link href="/" className="rounded-md px-4 py-2 text-sm underline underline-offset-4">
              {copy.home}
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

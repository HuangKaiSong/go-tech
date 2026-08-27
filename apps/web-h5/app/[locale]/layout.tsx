import { Sonner, TooltipProvider } from '@go-tech/web-ui';
import { decodeJwt } from 'jose';
import type { Metadata } from 'next';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import type { Locale } from '@/i18n/config';
import { routing } from '@/i18n/routing';
import { getBaseUrl } from '@/lib/http';
import { DynamicI18nProvider } from '../components/DynamicI18nProvider';
import { HtmlLangSync } from '../components/html-lang-sync';
import Layout from '../components/Layout';
import { getDynamicMessages } from '../lib/translation/messages';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

const metadata = {
  'zh-hk': {
    title: 'GO-TECH租務系統',
    keywords: ['GO-TECH', '租務', '管理系統', '租務管理系統'],
    description:
      '越多物業,越易管理!GO-TECH租務系統,GO-TECH是一個專為租務管理打造的雲端系統，協助您輕鬆管理物業、追蹤租金收入並簡化溝通流程。'
  },
  'zh-cn': {
    title: 'GO-TECH租務系統',
    keywords: ['GO-TECH', '租務', '管理系統', '租務管理系統'],
    description:
      '越多物業,越易管理!GO-TECH租務系統,GO-TECH是一個專為租務管理打造的雲端系統，協助您輕鬆管理物業、追蹤租金收入並簡化溝通流程。'
  },
  'en-us': {
    title: 'GO-TECH租務系統',
    keywords: ['GO-TECH', '租務', '管理系統', '租務管理系統'],
    description:
      '越多物業,越易管理!GO-TECH租務系統,GO-TECH是一個專為租務管理打造的雲端系統，協助您輕鬆管理物業、追蹤租金收入並簡化溝通流程。'
  }
};

function resolveLocale(value: string): Locale {
  if (!hasLocale(routing.locales, value)) notFound();

  return value;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);

  return {
    title: metadata[locale].title,
    keywords: metadata[locale].keywords,
    description: metadata[locale].description,
    icons: [{ rel: 'icon', url: '/favicon.svg' }]
  };
}

export default async function LocaleLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const locale = resolveLocale((await params).locale);
  const cookiesStore = await cookies();
  const dynamicMessages = await getDynamicMessages(locale);

  let tenants: Tenant[] = [];
  let user: User | null = null;
  const token = cookiesStore.get('GO_TECH_AUTH_TOKEN')?.value;

  if (token) {
    user = decodeJwt(token) as User;
    const baseUrl = getBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/go-tech/platform/packageOrder/myTenants`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.data)) {
          tenants = data.data;
        }
      }
    } catch {
      // fetch 失败时 tenants 保持为空数组
    }
  }

  return (
    <NextIntlClientProvider>
      <HtmlLangSync locale={locale} />
      <DynamicI18nProvider messages={dynamicMessages}>
        <TooltipProvider>
          <AuthProvider _tenants={tenants} initialUser={user} _token={token}>
            <Layout>{children}</Layout>
          </AuthProvider>
          <Sonner className="toaster group" position="top-right" richColors />
        </TooltipProvider>
      </DynamicI18nProvider>
    </NextIntlClientProvider>
  );
}

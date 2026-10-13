import { TooltipProvider } from '@go-tech/web-ui';
import { decodeJwt } from 'jose';
import type { Metadata } from 'next';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProductSelectionProvider } from '@/contexts/ProductSelectionContext';
import type { Locale } from '@/i18n/config';
import { routing } from '@/i18n/routing';
import { captureServerError } from '@/lib/browser-monitor/server';
import { getBaseUrl } from '@/lib/http';
import { getLocalizedAlternates } from '@/lib/seo';
import { serverPlatformFetch } from '@/lib/server-fetch';
import { VIEW_MODE_COOKIE, parseViewMode } from '@/lib/view-mode';
import { ClientHttpErrorNotifier } from '../components/client-http-error-notifier';
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

async function fetchLayoutData(
  url: string,
  init: RequestInit
): Promise<{ code?: unknown; data?: unknown } | undefined> {
  try {
    const response = await serverPlatformFetch(url, init);
    if (!response.ok) {
      return undefined;
    }
    const data: unknown = await response.json();
    if (typeof data !== 'object' || data === null) return undefined;
    return {
      code: 'code' in data ? data.code : undefined,
      data: 'data' in data ? data.data : undefined
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown request error';
    await captureServerError(new Error(`GET ${url} failed: ${message}`, { cause: error }));
    return undefined;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const requestPathname = (await headers()).get('x-go-tech-pathname');

  return {
    title: metadata[locale].title,
    keywords: metadata[locale].keywords,
    description: metadata[locale].description,
    alternates: getLocalizedAlternates(locale, requestPathname),
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
    const [tenantData, userData] = await Promise.all([
      fetchLayoutData(`${baseUrl}/go-tech/platform/packageOrder/myTenants`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }),
      fetchLayoutData(`${baseUrl}/go-tech/platform/platformCustomer/getInfo`, {
        headers: new Headers({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'User-Type': 'platform_customer'
        })
      })
    ]);
    if (Array.isArray(tenantData?.data)) {
      tenants = tenantData.data;
    }
    if (userData?.code === 200 && typeof userData.data === 'object' && userData.data !== null) {
      user = { ...user, ...userData.data };
    }
  }

  return (
    <NextIntlClientProvider>
      <ClientHttpErrorNotifier />
      <HtmlLangSync locale={locale} />
      <ProductSelectionProvider>
        <DynamicI18nProvider messages={dynamicMessages}>
          <TooltipProvider>
            <AuthProvider _tenants={tenants} initialUser={user} _token={token}>
              <Layout initialViewMode={parseViewMode(cookiesStore.get(VIEW_MODE_COOKIE)?.value)}>{children}</Layout>
            </AuthProvider>
          </TooltipProvider>
        </DynamicI18nProvider>
      </ProductSelectionProvider>
    </NextIntlClientProvider>
  );
}

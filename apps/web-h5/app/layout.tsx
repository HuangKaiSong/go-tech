import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Sonner, TooltipProvider } from '@go-tech/web-ui';
import { decodeJwt } from 'jose';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { ThemeProvider } from 'next-themes';
import { cookies } from 'next/headers';
import Script from 'next/script';
import { AuthProvider } from '@/contexts/AuthContext';
import { getBaseUrl } from '@/lib/http';
import { createSvgSpriteHtml } from '@/plugins/createSvgIcons';
// oxlint-disable import/no-unassigned-import
import './globals.css';
import { DynamicI18nProvider } from './components/DynamicI18nProvider';
import Layout from './components/Layout';
import LocaleInitializer from './components/LocaleInitializer';
import { getDynamicMessages } from './lib/translation/messages';

export const metadata: Metadata = {
  title: 'GO-TECH租務系統',
  keywords: ['GO-TECH', '租務', '管理系統', '租務管理系統'],
  description:
    '越多物業,越易管理!GO-TECH租務系統,GO-TECH是一個專為租務管理打造的雲端系統，協助您輕鬆管理物業、追蹤租金收入並簡化溝通流程。',
  icons: [{ rel: 'icon', url: '/favicon.svg' }]
};

const themeColorScript = `

`;

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookiesStore = await cookies();
  const supportedLocales = ['zh-hk', 'en-us', 'zh-cn'] as const;
  type SupportedLocale = (typeof supportedLocales)[number];
  const isSupportedLocale = (value: string | undefined): value is SupportedLocale =>
    supportedLocales.includes(value as SupportedLocale);
  const defaultLocale = isSupportedLocale(process.env.GO_TECH_LANGUAGE) ? process.env.GO_TECH_LANGUAGE : 'zh-hk';
  const cookieLocale = cookiesStore.get('GO_TECH_LANGUAGE')?.value;
  const language = isSupportedLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const shouldInitLocale = !isSupportedLocale(cookieLocale);
  const dynamicMessages = await getDynamicMessages(language);

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

  // 相对模块文件解析图标目录，避免使用 process.cwd() 触发 Turbopack 追踪整个项目
  const iconsDir = resolve(dirname(fileURLToPath(import.meta.url)), '../public/icons/svg');

  const { html: svgSpriteHtml } = await createSvgSpriteHtml({
    iconDirs: [iconsDir],
    customDomId: '__svg__icons__dom__',
    symbolId: 'icon-[name]'
  });

  return (
    <html lang={language} suppressHydrationWarning>
      <head>
        <Script id="theme-color" strategy="beforeInteractive">
          {themeColorScript}
        </Script>
      </head>
      <body className="min-w-[1280px]">
        {shouldInitLocale ? <LocaleInitializer locale={language} /> : null}
        <div aria-hidden="true" dangerouslySetInnerHTML={{ __html: svgSpriteHtml }} />
        <NextIntlClientProvider>
          <DynamicI18nProvider messages={dynamicMessages}>
            <ThemeProvider attribute="class" enableSystem={false}>
              <TooltipProvider>
                <AuthProvider _tenants={tenants} initialUser={user} _token={token}>
                  <Layout>{children}</Layout>
                </AuthProvider>
                <Sonner className="toaster group" position="top-right" richColors />
              </TooltipProvider>
            </ThemeProvider>
          </DynamicI18nProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { ThemeProvider } from 'next-themes';
import { headers } from 'next/headers';
import Script from 'next/script';
import { connection } from 'next/server';
import { routing } from '@/i18n/routing';
import { RuntimeConfigProvider } from '@/lib/runtime-config/provider';
import { configValue, publicSnapshot } from '@/lib/runtime-config/server';
// oxlint-disable import/no-unassigned-import
import './globals.css';
import { createSvgSpriteHtml } from '@/plugins/createSvgIcons';

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  return { metadataBase: new URL(await configValue('NEXT_PUBLIC_SITE_URL')) };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const initialConfig = await publicSnapshot();
  const locale = (await headers()).get('x-next-intl-locale');
  const language = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;

  // 相对模块文件解析图标目录，避免使用 process.cwd() 触发 Turbopack 追踪整个项目
  const iconsDir = resolve(dirname(fileURLToPath(import.meta.url)), '../public/icons/svg');
  const { html: svgSpriteHtml } = await createSvgSpriteHtml({
    iconDirs: [iconsDir],
    customDomId: '__svg__icons__dom__',
    symbolId: 'icon-[name]'
  });

  return (
    <html lang={language} suppressHydrationWarning>
      <Script id="googletagmanager" strategy="afterInteractive">
        {`(function(w, d, s, l, i) {
          w[l] = w[l] || [];
          w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
          var f = d.getElementsByTagName(s)[0];
          var j = d.createElement(s);
          var dl = l !== 'dataLayer' ? '&l=' + l : '';
          j.async = true;
          j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
          f.parentNode.insertBefore(j, f);
        })(window, document, 'script', 'dataLayer', 'GTM-T6TZQGBX');`}
      </Script>
      <body className="w-full">
        <div aria-hidden="true" dangerouslySetInnerHTML={{ __html: svgSpriteHtml }} />
        <RuntimeConfigProvider initial={initialConfig}>
          <ThemeProvider attribute="class" enableSystem={false}>
            {children}
          </ThemeProvider>
        </RuntimeConfigProvider>
      </body>
    </html>
  );
}

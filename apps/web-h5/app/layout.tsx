import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { ThemeProvider } from 'next-themes';
import { headers } from 'next/headers';
import { routing } from '@/i18n/routing';
import { siteUrl } from '@/lib/seo';
import { createSvgSpriteHtml } from '@/plugins/createSvgIcons';
// oxlint-disable import/no-unassigned-import
import './globals.css';

export const metadata: Metadata = {
  metadataBase: siteUrl
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
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
      <body className="w-full">
        <div aria-hidden="true" dangerouslySetInnerHTML={{ __html: svgSpriteHtml }} />
        <ThemeProvider attribute="class" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

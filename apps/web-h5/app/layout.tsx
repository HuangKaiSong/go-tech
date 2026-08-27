import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasLocale } from 'next-intl';
import { ThemeProvider } from 'next-themes';
import { headers } from 'next/headers';
import { Suspense } from 'react';
import { routing } from '@/i18n/routing';
import { createSvgSpriteHtml } from '@/plugins/createSvgIcons';
import { NavigationProgress } from './components/navigation-progress';
// oxlint-disable import/no-unassigned-import
import './globals.css';

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
      <body className="min-w-[1280px]">
        <div aria-hidden="true" dangerouslySetInnerHTML={{ __html: svgSpriteHtml }} />
        <ThemeProvider attribute="class" enableSystem={false}>
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

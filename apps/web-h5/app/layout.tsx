import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { ThemeProvider } from 'next-themes';
import { headers } from 'next/headers';
import { connection } from 'next/server';
import { routing } from '@/i18n/routing';
import { RuntimeConfigProvider } from '@/lib/runtime-config/provider';
import { configValue, publicSnapshot } from '@/lib/runtime-config/server';
import { createSvgSpriteHtml } from '@/plugins/createSvgIcons';
// oxlint-disable import/no-unassigned-import
import './globals.css';

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

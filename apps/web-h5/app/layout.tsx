import { AuthProvider } from "@/contexts/AuthContext";
import { getBaseUrl } from "@/lib/http";
import { createSvgSpriteHtml } from "@/plugins/createSvgIcons";
import { existsSync } from "fs";
import { decodeJwt } from "jose";
import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { cookies } from "next/headers";
import { resolve } from "path";
import Layout from "./components/Layout";
import LocaleInitializer from "./components/LocaleInitializer";
import "./globals.css";

export const metadata: Metadata = {
  title: "GO-TECH租務系統",
  keywords: ['GO-TECH', '租務', '管理系統', '租務管理系統',],
  description: "越多物業,越易管理!GO-TECH租務系統,GO-TECH是一個專為租務管理打造的雲端系統，協助您輕鬆管理物業、追蹤租金收入並簡化溝通流程。",
  icons: [
    { rel: "icon", url: "/favicon.svg" }
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookiesStore = await cookies();
  const supportedLocales = ['hk', 'en'] as const;
  type SupportedLocale = (typeof supportedLocales)[number];
  const isSupportedLocale = (value: string | undefined): value is SupportedLocale =>
    supportedLocales.includes(value as SupportedLocale);
  const defaultLocale = isSupportedLocale(process.env.GO_TECH_LANGUAGE)
    ? process.env.GO_TECH_LANGUAGE
    : 'hk';
  const cookieLocale = cookiesStore.get("GO_TECH_LANGUAGE")?.value;
  const language = isSupportedLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const shouldInitLocale = !isSupportedLocale(cookieLocale);

  let tenants: Tenant[] = [];
  let user: User | null = null;
  const token = cookiesStore.get("GO_TECH_AUTH_TOKEN")?.value;

  if (token) {
    user = decodeJwt(token) as User;
    const baseUrl = getBaseUrl()
    await fetch(`${baseUrl}/go-tech/platform/packageOrder/myTenants`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => res.json()).then((data) => {
      tenants = data?.data || [];
    });
  }

  const iconDirCandidates = [
    resolve(process.cwd(), "public/icons/svg"),
    resolve(process.cwd(), "apps/web-h5/public/icons/svg"),
  ];
  const iconDirs = iconDirCandidates.filter((dir) => existsSync(dir));

  const { html: svgSpriteHtml } = await createSvgSpriteHtml({
    iconDirs: iconDirs.length > 0 ? iconDirs : [iconDirCandidates[0]],
    customDomId: "__svg__icons__dom__",
    symbolId: "icon-[name]",
  });

  return (
    <html lang={language}>
      <body>
        {shouldInitLocale ? <LocaleInitializer locale={language} /> : null}
        <div
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: svgSpriteHtml }}
        ></div>
        <NextIntlClientProvider>
          <AuthProvider _tenants={tenants} initialUser={user} _token={token}>
            <Layout>{children}</Layout>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

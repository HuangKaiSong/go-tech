import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: false,
  i18n: {
    defaultLocale: 'hk',
    locales: ['hk', 'en'],
    localeDetection: false,
  }
};

export default nextConfig;

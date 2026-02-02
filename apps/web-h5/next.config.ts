import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: '/go-tech/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL + '/go-tech/:path*', // 替换为实际后端地址
      },
    ]
  },
};

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

export default withNextIntl(nextConfig);

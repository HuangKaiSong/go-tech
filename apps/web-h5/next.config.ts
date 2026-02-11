import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: false,
  allowedDevOrigins: ['localhost:5173', '192.168.0.168:5173', '192.168.0.202:3201'],
  async rewrites() {
    return [
      {
        source: '/go-tech/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL + '/go-tech/:path*', // 替换为实际后端地址
      },
    ]
  },
  images: {
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'go-techs.com',
        port: '',
        pathname: '/go-tech/**',
      }
    ]
  }
};

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

export default withNextIntl(nextConfig);

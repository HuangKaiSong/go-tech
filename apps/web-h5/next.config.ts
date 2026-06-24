import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { type Rewrite } from 'next/dist/lib/load-custom-routes';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: false,
  allowedDevOrigins: ['localhost', '192.168.0.168', '192.168.0.202', 'admin.go-techs.com'],
  async rewrites() {
    const proxy: Rewrite[] = [
      {
        source: '/go-tech/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/go-tech/:path*` // 替换为实际后端地址
      },
      {
        source: '/pms-resource/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/pms-resource/:path*` // 替换为实际后端地址
      },
      {
        source: '/pms-admin/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/pms-admin/:path*` // 替换为实际后端地址
      }
    ];

    // if (process.env.NODE_ENV === 'development') {
    //   proxy.unshift(
    //     {
    //       source: '/pms-resource/web-back/minio/upload',
    //       destination: 'http://192.168.0.202:7171/pms-resource/web-back/minio/upload'
    //     },
    //   )
    // }
    return proxy;
  },
  images: {
    dangerouslyAllowLocalIP: true,
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'go-techs.com',
        port: '',
        pathname: '/go-tech/**'
      }
    ]
  }
};

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

export default withNextIntl(nextConfig);

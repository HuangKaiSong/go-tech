import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import { Rewrite } from "next/dist/lib/load-custom-routes";

const isDev = process.env.NODE_ENV === 'development'

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://go-techs.com https://admin.go-techs.com;
    connect-src 'self' https://go-techs.com https://admin.go-techs.com;
    font-src 'self' https://at.alicdn.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'self' https://admin.go-techs.com;
    upgrade-insecure-requests;
`

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: false,
  allowedDevOrigins: ['localhost', '192.168.0.168', '192.168.0.202', 'admin.go-techs.com'],
  // async headers() {
  //   return [
  //     {
  //       source: '/(.*)',
  //       headers: [
  //         {
  //           key: 'Content-Security-Policy',
  //           value: cspHeader.replace(/\s{2,}/g, ' ').trim(),
  //         },
  //         {
  //           key: 'Access-Control-Allow-Origin',
  //           value: '*',
  //         }
  //       ],
  //     },
  //   ]
  // },
  async rewrites() {
    const proxy: Rewrite[] = [
      {
        source: '/go-tech/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL + '/go-tech/:path*', // 替换为实际后端地址
      },
      {
        source: '/pms-resource/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL + '/pms-resource/:path*', // 替换为实际后端地址
      },
      {
        source: '/pms-admin/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL + '/pms-admin/:path*', // 替换为实际后端地址
      },
    ]

    // if (process.env.NODE_ENV === 'development') {
    //   proxy.unshift(
    //     {
    //       source: '/pms-resource/web-back/minio/upload',
    //       destination: 'http://192.168.0.202:7171/pms-resource/web-back/minio/upload'
    //     },
    //   )
    // }
    return proxy
  },
  images: {
    dangerouslyAllowLocalIP: true,
    unoptimized: true,
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

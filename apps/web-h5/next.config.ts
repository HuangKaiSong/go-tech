import path from 'node:path';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const workspaceRoot = path.resolve(process.cwd(), '../..');

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  serverExternalPackages: ['node:sqlite'],
  outputFileTracingRoot: workspaceRoot,
  reactCompiler: true,
  reactStrictMode: false,
  cleanDistDir: true,
  allowedDevOrigins: ['localhost', '192.168.0.168', '192.168.0.202', 'admin.go-techs.com'],
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
  },
  // logging: {
  //   browserToTerminal: true,
  //   serverFunctions: true
  // },
  turbopack: {
    root: workspaceRoot
  }
};

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

export default withNextIntl(nextConfig);

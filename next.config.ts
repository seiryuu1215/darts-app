import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';
import { withSentryConfig } from '@sentry/nextjs';
import createNextIntlPlugin from 'next-intl/plugin';

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  serverExternalPackages: ['puppeteer', 'puppeteer-core', '@sparticuz/chromium', 'firebase-admin'],
  outputFileTracingIncludes: {
    '/api/dartslive-stats': ['./node_modules/@sparticuz/chromium/bin/**'],
    '/api/cron/daily-stats': ['./node_modules/@sparticuz/chromium/bin/**'],
    '/api/line/webhook': ['./node_modules/@sparticuz/chromium/bin/**'],
    '/api/export-pdf': ['./node_modules/@sparticuz/chromium/bin/**'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.dartshive.jp' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'makeshop-multi-images.akamaized.net' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          // CSP は proxy.ts（ミドルウェア）が nonce 方式で動的に設定するため、
          // ここではフォールバック用の最小限ポリシーのみ定義する。
          // proxy.ts の matcher に該当しないリクエスト（prefetch 等）向け。
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self'",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self'",
              "img-src 'self' data: blob:",
              "connect-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

export default withSentryConfig(withNextIntl(withSerwist(nextConfig)), {
  silent: true,
});

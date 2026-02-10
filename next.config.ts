import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['puppeteer', 'puppeteer-core', '@sparticuz/chromium', 'firebase-admin'],
  outputFileTracingIncludes: {
    '/api/dartslive-stats': ['./node_modules/@sparticuz/chromium/bin/**'],
  },
};

export default nextConfig;

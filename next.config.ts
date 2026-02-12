import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  serverExternalPackages: ['puppeteer', 'puppeteer-core', '@sparticuz/chromium', 'firebase-admin'],
  outputFileTracingIncludes: {
    '/api/dartslive-stats': ['./node_modules/@sparticuz/chromium/bin/**'],
  },
};

export default withSerwist(nextConfig);

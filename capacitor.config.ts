import type { CapacitorConfig } from '@capacitor/cli';

const isDev = process.env.NODE_ENV === 'development';

const config: CapacitorConfig = {
  appId: 'com.seiryuu.dartslab',
  appName: 'Darts Lab',
  webDir: 'out',
  server: isDev
    ? {
        // 開発時: ローカルdev serverのURL（環境変数で上書き可能）
        url: process.env.CAPACITOR_DEV_URL ?? 'http://192.168.10.114:3000',
        cleartext: true,
      }
    : {
        // 本番: Vercel デプロイURL
        url: 'https://darts-app-lime.vercel.app',
      },
};

export default config;

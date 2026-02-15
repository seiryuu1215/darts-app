import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.darts.app',
  appName: 'Darts Lab',
  webDir: 'out',
  server: {
    // 本番: Vercel デプロイURL
    url: 'https://darts-app-lime.vercel.app',
    // 開発時: ローカルdev serverのURLに切り替え（PCのIPアドレス）
    // url: 'http://192.168.10.114:3000',
    // cleartext: true,
  },
};

export default config;

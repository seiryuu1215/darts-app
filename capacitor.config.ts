import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.darts.app',
  appName: 'Darts Lab',
  webDir: 'out',
  server: {
    // 開発時: ローカルdev serverのURLを設定（PCのIPアドレス）
    url: 'http://192.168.10.114:3000',
    // 本番時: VercelのデプロイURLを設定
    // url: 'https://your-deployed-url.vercel.app',
    cleartext: true,
  },
};

export default config;

import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Darts Lab - ダーツセッティング管理・バレル検索・スタッツ分析',
    template: '%s | Darts Lab',
  },
  description:
    'ダーツのセッティングを登録・管理・共有。7,000種以上のバレル検索、診断クイズ、DARTSLIVEスタッツ連携でダーツライフをサポート。',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Darts Lab',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: 'Darts Lab',
  },
  twitter: {
    card: 'summary',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1976d2' },
    { media: '(prefers-color-scheme: dark)', color: '#121212' },
  ],
};

// JS実行前にテーマを判定し data-theme 属性を付与するスクリプト
// globals.css の html[data-theme='dark'] body ルールで背景色が即座に適用される
const themeInitScript = `(function(){try{var s=localStorage.getItem('colorMode');var d=s||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');if(d==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers>
          <Header />
          <main style={{ minHeight: 'calc(100vh - 128px)' }}>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

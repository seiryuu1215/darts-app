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
  themeColor: '#1976d2',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
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

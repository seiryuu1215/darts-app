import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ログイン',
  description: 'Darts Labにログインしてセッティング管理・バレル検索・スタッツ分析を始めましょう。',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}

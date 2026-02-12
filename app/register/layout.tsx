import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '新規登録',
  description:
    'Darts Labに無料登録。ダーツセッティングの管理・共有、バレル検索、スタッツ分析を始めましょう。',
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}

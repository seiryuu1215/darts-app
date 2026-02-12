import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'セッティング一覧',
  description: 'ダーツのセッティングを登録・管理・共有。バレル・シャフト・フライト・チップの組み合わせを記録。',
};

export default function DartsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

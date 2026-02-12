import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'バレル検索',
  description:
    '7,000種以上のダーツバレルを重量・径・長さ・カットで検索。売れ筋ランキングやおすすめバレルも。',
};

export default function BarrelsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'マイショップ',
  description:
    'お気に入りのダーツショップを管理。路線フィルター・訪問記録・評価・タグで効率的に整理。',
};

export default function ShopsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

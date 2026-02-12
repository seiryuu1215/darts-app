import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '記事',
  description: 'ダーツの知識・テクニック・レビュー記事を読む・書く。コミュニティで情報共有。',
};

export default function ArticlesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

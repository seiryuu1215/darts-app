import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ブックマーク',
  description: 'ブックマークしたバレルやセッティングを一覧で確認・管理。',
};

export default function BookmarksLayout({ children }: { children: React.ReactNode }) {
  return children;
}

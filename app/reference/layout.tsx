import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'シャフト重量 早見表',
  description:
    '各ブランドのダーツシャフト重量を一覧で比較。L-Shaft・Fit Flight・PRO GRIP等に対応。',
};

export default function ReferenceLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ディスカッション | Darts Lab',
  description:
    'セッティング相談、レーティング・上達、バレル選び、練習法など、ダーツに関するテーマ別掲示板。知見を蓄積・共有しよう。',
};

export default function DiscussionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

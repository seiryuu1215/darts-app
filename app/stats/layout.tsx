import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'スタッツ',
  description: 'DARTSLIVEスタッツの推移を可視化。Rating・PPD・MPRの月次トレンドやコンディション管理。',
};

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

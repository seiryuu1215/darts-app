import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '料金プラン',
  description:
    'Darts Lab PROプランの料金・機能比較。DARTSLIVE連携・無制限セッティング登録・CSV出力など。1週間の無料トライアル付き。',
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import { Container, Typography, Paper } from '@mui/material';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'プライバシーポリシー - Darts Lab',
};

export default function PrivacyPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        プライバシーポリシー
      </Typography>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>1. 個人情報の取得</Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          当サイトでは、ユーザー登録時にメールアドレス、表示名等の情報を取得します。
          DARTSLIVE 連携機能を利用する場合、認証情報はセッション中のみサーバーサイドで処理され、永続的に保存されることはありません。
          LINE連携の自動チェック機能を利用する場合のみ、DARTSLIVE認証情報はAES-256-GCMで暗号化した上でサーバーに保存されます。連携解除時に完全に削除されます。
        </Typography>

        <Typography variant="h6" gutterBottom>2. 個人情報の利用目的</Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          取得した個人情報は、サービスの提供・運営、ユーザーサポート、利用状況の分析に利用します。
        </Typography>

        <Typography variant="h6" gutterBottom>3. Cookie・アクセス解析</Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          当サイトでは、Firebase Analytics を利用してアクセス情報を収集しています。
          また、Cookie を使用してログイン状態の保持や、ユーザー体験の向上に活用しています。
        </Typography>

        <Typography variant="h6" gutterBottom>4. アフィリエイトについて</Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          当サイトは、Amazon.co.jp アソシエイト、楽天アフィリエイト、A8.net 等のアフィリエイトプログラムに参加しています。
          商品リンクを経由して購入された場合、当サイトに紹介料が支払われることがあります。
        </Typography>

        <Typography variant="h6" gutterBottom>5. 外部データソースについて</Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          本サービスの製品データベースには、ダーツハイブ等の外部サイトより自動取得したデータが含まれます。
          これらのデータの著作権は各権利者に帰属します。
          決済処理にはStripeを利用しており、クレジットカード情報は当サイトのサーバーに保存されません。
        </Typography>

        <Typography variant="h6" gutterBottom>6. 個人情報の第三者提供</Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。
        </Typography>

        <Typography variant="h6" gutterBottom>7. お問い合わせ</Typography>
        <Typography variant="body1">
          プライバシーポリシーに関するお問い合わせは、X（Twitter）@seiryuu_darts までご連絡ください。
        </Typography>
      </Paper>
    </Container>
  );
}

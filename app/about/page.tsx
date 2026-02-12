import { Container, Typography, Paper, Box } from '@mui/material';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'このサイトについて - Darts Lab',
};

export default function AboutPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        このサイトについて
      </Typography>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Darts Lab とは</Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Darts Lab は、ダーツプレイヤーのためのセッティング管理・スタッツ記録アプリです。
          自身のダーツセッティング（バレル・シャフト・フライト・チップ）を登録・共有し、
          DARTSLIVE のスタッツを自動取得してグラフで成長を可視化できます。
        </Typography>

        <Typography variant="h6" gutterBottom>主な機能</Typography>
        <Box component="ul" sx={{ pl: 3, mb: 2 }}>
          <li><Typography variant="body1">セッティングの登録・管理・比較</Typography></li>
          <li><Typography variant="body1">バレルデータベース（スペック検索・おすすめ機能）</Typography></li>
          <li><Typography variant="body1">バレルシミュレーター・診断クイズ</Typography></li>
          <li><Typography variant="body1">DARTSLIVE スタッツ連携（自動取得・グラフ表示）</Typography></li>
          <li><Typography variant="body1">ナレッジ記事の投稿・閲覧</Typography></li>
        </Box>

        <Typography variant="h6" gutterBottom>開発者</Typography>
        <Typography variant="body1">
          個人開発プロジェクトとして運営しています。
          お問い合わせは X（Twitter）@seiryuu_darts までお気軽にどうぞ。
        </Typography>
      </Paper>
    </Container>
  );
}

import { Container, Typography, Paper } from '@mui/material';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '利用規約 - Darts Lab',
};

export default function TermsPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        利用規約
      </Typography>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>1. サービスの利用</Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          本サービスは、ダーツプレイヤー向けのセッティング管理・情報共有を目的として提供しています。
          利用者は、本規約に同意の上でサービスをご利用ください。
        </Typography>

        <Typography variant="h6" gutterBottom>2. アカウント</Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          ユーザーは自身のアカウント情報を適切に管理する責任を負います。
          アカウントの不正利用により生じた損害について、当サイトは責任を負いません。
        </Typography>

        <Typography variant="h6" gutterBottom>3. 投稿コンテンツ</Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          ユーザーが投稿したセッティング情報、コメント等のコンテンツについて、著作権はユーザーに帰属します。
          ただし、サービスの運営に必要な範囲で、当サイトがこれを利用することがあります。
        </Typography>

        <Typography variant="h6" gutterBottom>4. 禁止事項</Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          法令に違反する行為、他のユーザーの迷惑となる行為、サービスの運営を妨害する行為を禁止します。
        </Typography>

        <Typography variant="h6" gutterBottom>5. 免責事項</Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          当サイトは、提供する情報の正確性・完全性を保証しません。
          外部ショップへのリンク先での取引については、当サイトは一切の責任を負いません。
          DARTSLIVE スタッツの取得は外部サービスの仕様変更により利用できなくなる場合があります。
        </Typography>

        <Typography variant="h6" gutterBottom>6. 規約の変更</Typography>
        <Typography variant="body1">
          本規約は予告なく変更される場合があります。変更後の規約は、本ページに掲載した時点で効力を生じます。
        </Typography>
      </Paper>
    </Container>
  );
}

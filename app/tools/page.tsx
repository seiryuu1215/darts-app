'use client';

import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Breadcrumbs from '@/components/layout/Breadcrumbs';

interface ToolInfo {
  name: string;
  description: string;
  url: string;
  tags: string[];
  integration: string;
}

const TOOLS: ToolInfo[] = [
  {
    name: 'n01 (Nakka)',
    description:
      'Windows/Mac対応の練習スコアラー。01/Cricket/Count-Up対応。CSV/テキスト形式でスコアデータを出力可能。DARTSLIVE連携なしでも使える。',
    url: 'https://www.nakka.com/n01/',
    tags: ['デスクトップ', 'CSV対応', '無料'],
    integration:
      'n01のCSVエクスポート機能でデータを書き出し、Darts Labの「n01取り込み」からインポートできます。練習記録をDarts Labに統合して分析しましょう。',
  },
  {
    name: 'Pro Darter',
    description:
      'ブラウザベースのスコアラー。501/Cricket/Around The Clock等に対応。リアルタイムで統計情報を表示。アカウント不要で利用可能。',
    url: 'https://www.prodarter.com/',
    tags: ['ブラウザ', '登録不要', '無料'],
    integration:
      'Pro Darterでの練習後、Darts Labのスタッツ手動記録からスコアとメモを記録できます。特にCOUNT-UPの一貫性追跡に便利です。',
  },
  {
    name: 'Dartore',
    description:
      'PWA対応の無料スコアラーアプリ。スマホからもブラウザからも利用可能。シンプルなUIで素早くスコア入力できる。',
    url: 'https://dartore.com/',
    tags: ['PWA', 'スマホ対応', '無料'],
    integration:
      'Dartoreでのスコアを記録後、Darts Labの手動記録やLINE Bot経由でコンディションやメモと一緒に記録できます。',
  },
  {
    name: 'MyDartTraining',
    description:
      '音声入力にも対応したスコアラーアプリ。ハンズフリーでダーツを投げながらスコアを記録できる。iOS/Android対応。',
    url: 'https://mydarttraining.com/',
    tags: ['音声入力', 'iOS/Android', '無料'],
    integration:
      'MyDartTrainingで練習したらDarts Labで調子を記録。カレンダービューで練習頻度を可視化し、モチベーション維持に活用しましょう。',
  },
];

export default function ToolsPage() {
  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs items={[{ label: 'ツールハブ' }]} />

        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
          ダーツツールハブ
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Darts Labと組み合わせて使える無料ダーツツールのコレクションです。
          外部ツールのデータをDarts Labに取り込んで、練習の全体像を把握しましょう。
        </Typography>

        <Grid container spacing={2}>
          {TOOLS.map((tool) => (
            <Grid size={{ xs: 12, sm: 6 }} key={tool.name}>
              <Card
                variant="outlined"
                sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2 }}
              >
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {tool.name}
                    </Typography>
                    <Button
                      size="small"
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                      sx={{ minWidth: 'auto', whiteSpace: 'nowrap' }}
                    >
                      開く
                    </Button>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                    {tool.tags.map((tag) => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {tool.description}
                  </Typography>

                  <Box
                    sx={{
                      mt: 'auto',
                      p: 1.5,
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                      Darts Labとの使い方
                    </Typography>
                    <Typography variant="caption" color="text.secondary" component="p">
                      {tool.integration}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}

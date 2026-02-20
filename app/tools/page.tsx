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
  usage: string;
}

const TOOLS: ToolInfo[] = [
  {
    name: 'n01 (Nakka)',
    description:
      'Windows/Mac対応の練習スコアラー。01/Cricket/Count-Up対応。CSV/テキスト形式でスコアデータを出力可能。DARTSLIVE連携なしでも使える。',
    url: 'https://www.nakka.com/n01/',
    tags: ['デスクトップ', 'CSV対応', '無料'],
    usage:
      'n01で自宅練習のスコアを管理し、Darts LabではDARTSLIVEのスタッツや推移を確認。練習と実戦の両方を把握できます。',
  },
  {
    name: 'Pro Darter',
    description:
      'ブラウザベースのスコアラー。501/Cricket/Around The Clock等に対応。リアルタイムで統計情報を表示。アカウント不要で利用可能。',
    url: 'https://www.prodarter.com/',
    tags: ['ブラウザ', '登録不要', '無料'],
    usage:
      'Pro Darterで気軽にブラウザ練習し、Darts Labで公式スタッツの推移やレーティング分析を確認。併用で練習効率アップ。',
  },
  {
    name: 'Dartore',
    description:
      'PWA対応の無料スコアラーアプリ。スマホからもブラウザからも利用可能。シンプルなUIで素早くスコア入力できる。',
    url: 'https://dartore.com/',
    tags: ['PWA', 'スマホ対応', '無料'],
    usage:
      'Dartoreでスマホから手軽にスコア管理。Darts LabではDARTSLIVEの公式データを元にした分析や目標管理に集中できます。',
  },
  {
    name: 'MyDartTraining',
    description:
      '音声入力にも対応したスコアラーアプリ。ハンズフリーでダーツを投げながらスコアを記録できる。iOS/Android対応。',
    url: 'https://mydarttraining.com/',
    tags: ['音声入力', 'iOS/Android', '無料'],
    usage:
      'MyDartTrainingで音声入力しながら練習。Darts Labでは公式スタッツの推移確認やセッティング管理に活用できます。',
  },
];

export default function ToolsPage() {
  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs items={[{ label: 'おすすめ外部ツール' }]} />

        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
          おすすめ外部ツール
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Darts Labと併用すると便利な無料ダーツツールをまとめました。
          それぞれの得意分野を活かして、練習効率をアップしましょう。
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
                      Darts Labとの使い分け
                    </Typography>
                    <Typography variant="caption" color="text.secondary" component="p">
                      {tool.usage}
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

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  AlertTitle,
  Button,
  Card,
  CardContent,
  Rating,
  Chip,
  LinearProgress,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import SyncIcon from '@mui/icons-material/Sync';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import type { HealthInsight } from '@/types';
import { MOCK_HEALTH_INSIGHTS, MOCK_CONDITION_SCORE } from '../../mocks/health';

interface HealthPageStoryProps {
  variant: 'connected' | 'noData' | 'withInsights' | 'conditionScore';
}

function MetricCard({
  icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit: string;
  color: string;
}) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ textAlign: 'center', py: 2 }}>
        <Box sx={{ color, mb: 0.5 }}>{icon}</Box>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" fontWeight="bold">
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {unit}
        </Typography>
      </CardContent>
    </Card>
  );
}

function InsightCard({ insight }: { insight: HealthInsight }) {
  const severityMap: Record<string, 'info' | 'warning' | 'error'> = {
    info: 'info',
    warning: 'warning',
    critical: 'error',
  };
  return (
    <Alert severity={severityMap[insight.severity]} sx={{ mb: 1 }}>
      <Typography variant="body2">{insight.messageJa}</Typography>
    </Alert>
  );
}

function HealthPageStory({ variant }: HealthPageStoryProps) {
  const [period, setPeriod] = useState<'1' | '7' | '14' | '30'>('7');
  const hasData = variant !== 'noData';
  const showInsights = variant === 'withInsights' || variant === 'conditionScore';
  const showCondition = variant === 'conditionScore';

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs items={[{ label: 'ヘルスケア' }]} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            ヘルスケア
          </Typography>
          {hasData && (
            <Button variant="outlined" size="small" startIcon={<SyncIcon />}>
              同期
            </Button>
          )}
        </Box>

        {!hasData && (
          <Paper
            sx={{
              textAlign: 'center',
              py: 8,
              px: 2,
              bgcolor: 'background.default',
              border: '1px dashed',
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              ヘルスケアデータを連携
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Apple HealthKitと連携して、健康データとダーツパフォーマンスの相関を分析します
            </Typography>
            <Button variant="contained" startIcon={<SyncIcon />}>
              HealthKit連携を開始
            </Button>
          </Paper>
        )}

        {hasData && (
          <>
            {/* Period Toggle */}
            <ToggleButtonGroup
              value={period}
              exclusive
              onChange={(_, v) => v && setPeriod(v)}
              size="small"
              sx={{ mb: 2 }}
            >
              <ToggleButton value="1">1日</ToggleButton>
              <ToggleButton value="7">7日</ToggleButton>
              <ToggleButton value="14">14日</ToggleButton>
              <ToggleButton value="30">30日</ToggleButton>
            </ToggleButtonGroup>

            {/* Condition Score */}
            {showCondition && (
              <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" fontWeight="bold" color="success.main">
                        {MOCK_CONDITION_SCORE.score}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        / 100
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Chip label={MOCK_CONDITION_SCORE.label} color="success" size="small" />
                        <Rating value={MOCK_CONDITION_SCORE.star} readOnly size="small" />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        今日のコンディションスコア
                      </Typography>
                    </Box>
                  </Box>
                  {/* Factor bars */}
                  <Box sx={{ mt: 2 }}>
                    {Object.entries(MOCK_CONDITION_SCORE.factors).map(([key, val]) => (
                      <Box
                        key={key}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
                      >
                        <Typography variant="caption" sx={{ width: 80 }}>
                          {key}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={val}
                          sx={{ flex: 1, height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="caption" sx={{ width: 30 }}>
                          {val}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Metric Cards */}
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <MetricCard
                  icon={<FavoriteIcon />}
                  label="安静時心拍"
                  value={58}
                  unit="bpm"
                  color="#f44336"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <MetricCard
                  icon={<FavoriteIcon />}
                  label="HRV"
                  value={52}
                  unit="ms"
                  color="#2196f3"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <MetricCard
                  icon={<BedtimeIcon />}
                  label="睡眠"
                  value="7h 30m"
                  unit=""
                  color="#9c27b0"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <MetricCard
                  icon={<DirectionsWalkIcon />}
                  label="歩数"
                  value="10,200"
                  unit="歩"
                  color="#4caf50"
                />
              </Grid>
            </Grid>

            {/* Charts placeholder */}
            <Paper
              variant="outlined"
              sx={{
                height: 200,
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography color="text.secondary">直近{period}日間のトレンドチャート</Typography>
            </Paper>

            {/* Insights */}
            {showInsights && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  インサイト
                </Typography>
                {MOCK_HEALTH_INSIGHTS.map((insight, i) => (
                  <InsightCard key={i} insight={insight} />
                ))}
              </Box>
            )}

            {/* Correlation placeholder */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                ダーツパフォーマンス相関
              </Typography>
              <Alert severity="info">
                <AlertTitle>HRV × PPD</AlertTitle>
                HRVが高い日はPPDが平均+3.2高い傾向
              </Alert>
            </Paper>
          </>
        )}
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Health/HealthPage',
  component: HealthPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof HealthPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Connected: Story = {
  args: { variant: 'connected' },
};

export const NoData: Story = {
  args: { variant: 'noData' },
};

export const WithInsights: Story = {
  args: { variant: 'withInsights' },
};

export const ConditionScore: Story = {
  args: { variant: 'conditionScore' },
};

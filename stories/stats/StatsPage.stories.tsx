import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Container, Box, Typography, Button, Card, CardContent, Paper } from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import DownloadIcon from '@mui/icons-material/Download';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import StatsPageContent from '@/components/stats/StatsPageContent';
import PRSiteSection from '@/components/stats/PRSiteSection';
import ProPaywall from '@/components/ProPaywall';
import AchievementList from '@/components/progression/AchievementList';
import XpHistoryList from '@/components/progression/XpHistoryList';
import { getFlightColor } from '@/lib/dartslive-colors';
import { calc01Rating, ppdForRating } from '@/lib/dartslive-rating';
import {
  MOCK_DARTSLIVE_DATA,
  MOCK_PERIOD_SUMMARY,
  MOCK_PERIOD_RECORDS,
  MOCK_SA_FLIGHT_DATA,
  MOCK_C_FLIGHT_DATA,
  MOCK_ACHIEVEMENT_SNAPSHOT,
  MOCK_UNLOCKED_ACHIEVEMENTS,
  MOCK_XP_HISTORY,
} from '../mocks/dartslive-stats';
import type { DartsliveData } from '../mocks/dartslive-stats';
import type { AchievementSnapshot } from '@/lib/progression/xp-engine';

interface FullStatsPageProps {
  dlData: DartsliveData;
  variant: 'connected' | 'empty' | 'paywall';
}

function FullStatsPage({ dlData, variant }: FullStatsPageProps) {
  const periodTab = 'all' as const;
  const [monthlyTab, setMonthlyTab] = useState<'rating' | 'zeroOne' | 'cricket' | 'countUp'>(
    'rating',
  );
  const [gameChartCategory, setGameChartCategory] = useState('COUNT-UP');

  const c = dlData.current;
  const flightColor = c.flight ? getFlightColor(c.flight) : '#808080';
  const expectedCountUp = c.stats01Avg != null ? Math.round(c.stats01Avg * 8) : null;
  const current01RtInt = c.stats01Avg != null ? Math.floor(calc01Rating(c.stats01Avg)) : null;
  const dangerCountUp =
    current01RtInt != null ? Math.round(ppdForRating(current01RtInt - 2) * 8) : null;
  const excellentCountUp =
    current01RtInt != null ? Math.round(ppdForRating(current01RtInt + 2) * 8) : null;

  const isConnected = variant === 'connected';
  const isPaywall = variant === 'paywall';

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs items={[{ label: 'Stats' }]} />

        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              DARTSLIVE Stats
            </Typography>
            {isConnected && (
              <Typography variant="caption" color="text.secondary">
                最終取得: 2/21 18:30
              </Typography>
            )}
          </Box>
          {!isPaywall && (
            <Button
              variant={isConnected ? 'outlined' : 'contained'}
              startIcon={<SyncIcon />}
              size="small"
            >
              {isConnected ? '更新' : 'ダーツライブ連携'}
            </Button>
          )}
        </Box>

        {/* Paywall */}
        {isPaywall && (
          <ProPaywall
            title="DARTSLIVE連携はPROプラン限定です"
            description="PROプランにアップグレードすると、DARTSLIVEアカウントと連携してスタッツの自動取得・推移グラフ・レーティング目標分析が利用できます。"
          />
        )}

        {/* Empty state */}
        {variant === 'empty' && (
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
              ダーツライブと連携
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              アカウント情報でログインし、メインカードのスタッツ・推移を表示します
            </Typography>
            <Button variant="contained" startIcon={<SyncIcon />}>
              連携する
            </Button>
          </Paper>
        )}

        {/* Connected: full stats content */}
        {isConnected && (
          <StatsPageContent
            dlData={dlData}
            periodTab={periodTab}
            periodSummary={MOCK_PERIOD_SUMMARY}
            periodRecords={MOCK_PERIOD_RECORDS}
            flightColor={flightColor}
            expectedCountUp={expectedCountUp}
            dangerCountUp={dangerCountUp}
            excellentCountUp={excellentCountUp}
            activeSoftDart={null}
            monthlyTab={monthlyTab}
            gameChartCategory={gameChartCategory}
            onMonthlyTabChange={setMonthlyTab}
            onGameChartCategoryChange={setGameChartCategory}
          />
        )}

        {/* CSV Export */}
        {isConnected && (
          <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
            <CardContent
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: '12px !important',
              }}
            >
              <Box>
                <Typography variant="body2">スタッツをエクスポート</Typography>
                <Typography variant="caption" color="text.secondary">
                  全履歴をCSVファイルでダウンロード
                </Typography>
              </Box>
              <Button variant="outlined" size="small" startIcon={<DownloadIcon />}>
                CSV出力
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Manual Record */}
        <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: '12px !important',
            }}
          >
            <Box>
              <Typography variant="body2">調子やメモを記録</Typography>
              <Typography variant="caption" color="text.secondary">
                手動でスタッツを記録・管理（LINE Botからも記録できます）
              </Typography>
            </Box>
            <Button variant="outlined" size="small">
              手動記録
            </Button>
          </CardContent>
        </Card>

        {/* Calendar Link */}
        <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: '12px !important',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarMonthIcon sx={{ color: 'text.secondary' }} />
              <Box>
                <Typography variant="body2">カレンダー</Typography>
                <Typography variant="caption" color="text.secondary">
                  プレイ日・調子を日別に確認
                </Typography>
              </Box>
            </Box>
            <Button variant="outlined" size="small">
              開く
            </Button>
          </CardContent>
        </Card>

        {/* PR Site Section */}
        <PRSiteSection />

        {/* Progression */}
        <Box sx={{ mt: 4 }}>
          <AchievementList
            unlockedIds={MOCK_UNLOCKED_ACHIEVEMENTS}
            snapshot={MOCK_ACHIEVEMENT_SNAPSHOT as AchievementSnapshot}
          />
          <XpHistoryList history={MOCK_XP_HISTORY} />
        </Box>
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/StatsPage',
  component: FullStatsPage,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof FullStatsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BBFlight: Story = {
  args: { dlData: MOCK_DARTSLIVE_DATA, variant: 'connected' },
};

export const SAFlight: Story = {
  args: { dlData: MOCK_SA_FLIGHT_DATA, variant: 'connected' },
};

export const CFlight: Story = {
  args: { dlData: MOCK_C_FLIGHT_DATA, variant: 'connected' },
};

export const EmptyState: Story = {
  args: { dlData: MOCK_DARTSLIVE_DATA, variant: 'empty' },
};

export const Paywall: Story = {
  args: { dlData: MOCK_DARTSLIVE_DATA, variant: 'paywall' },
};

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Container, Box, Typography, Tabs, Tab, Paper, Grid, Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import ProPaywall from '@/components/ProPaywall';
import {
  MOCK_WEEKLY_REPORTS,
  MOCK_MONTHLY_REPORTS,
  type MockWeeklyReport,
  type MockMonthlyReport,
} from '../../mocks/reports';

interface ReportsPageStoryProps {
  variant: 'weekly' | 'monthly' | 'paywall' | 'empty';
}

function WeeklyCard({ report }: { report: MockWeeklyReport }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Chip label={report.periodLabel} size="small" />
        {report.ratingChange != null && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
            {report.ratingChange > 0 ? (
              <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
            ) : report.ratingChange < 0 ? (
              <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
            ) : null}
            <Typography
              variant="body2"
              fontWeight="bold"
              color={
                report.ratingChange > 0
                  ? 'success.main'
                  : report.ratingChange < 0
                    ? 'error.main'
                    : 'text.primary'
              }
            >
              {report.ratingChange > 0 ? '+' : ''}
              {report.ratingChange}
            </Typography>
          </Box>
        )}
      </Box>
      <Grid container spacing={2} sx={{ mb: 1 }}>
        <Grid size={4}>
          <Typography variant="caption" color="text.secondary">
            プレイ日数
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {report.playDays}日
          </Typography>
        </Grid>
        <Grid size={4}>
          <Typography variant="caption" color="text.secondary">
            総ゲーム数
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {report.totalGames}
          </Typography>
        </Grid>
        <Grid size={4}>
          <Typography variant="caption" color="text.secondary">
            XP獲得
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {report.xpGained}
          </Typography>
        </Grid>
      </Grid>
      {report.awardsHighlights.length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {report.awardsHighlights.map((a) => (
            <Chip key={a.label} label={`${a.label} ×${a.count}`} size="small" variant="outlined" />
          ))}
        </Box>
      )}
    </Paper>
  );
}

function MonthlyCard({ report }: { report: MockMonthlyReport }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Chip label={report.periodLabel} size="small" />
        {report.ratingChange != null && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
            {report.ratingChange > 0 ? (
              <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
            ) : report.ratingChange < 0 ? (
              <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
            ) : null}
            <Typography
              variant="body2"
              fontWeight="bold"
              color={
                report.ratingChange > 0
                  ? 'success.main'
                  : report.ratingChange < 0
                    ? 'error.main'
                    : 'text.primary'
              }
            >
              {report.ratingChange > 0 ? '+' : ''}
              {report.ratingChange}
            </Typography>
          </Box>
        )}
      </Box>
      <Grid container spacing={2} sx={{ mb: 1 }}>
        <Grid size={3}>
          <Typography variant="caption" color="text.secondary">
            プレイ日数
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {report.playDays}日
          </Typography>
        </Grid>
        <Grid size={3}>
          <Typography variant="caption" color="text.secondary">
            総ゲーム数
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {report.totalGames}
          </Typography>
        </Grid>
        <Grid size={3}>
          <Typography variant="caption" color="text.secondary">
            平均PPD
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {report.avgPpd ?? '-'}
          </Typography>
        </Grid>
        <Grid size={3}>
          <Typography variant="caption" color="text.secondary">
            平均MPR
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {report.avgMpr ?? '-'}
          </Typography>
        </Grid>
      </Grid>
      {report.awardsHighlights.length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
          {report.awardsHighlights.map((a) => (
            <Chip key={a.label} label={`${a.label} ×${a.count}`} size="small" variant="outlined" />
          ))}
        </Box>
      )}
      <Typography variant="caption" color="text.secondary">
        目標達成: {report.goalsAchieved}/{report.goalsActive + report.goalsAchieved} | XP: +
        {report.xpGained}
      </Typography>
    </Paper>
  );
}

function ReportsPageStory({ variant }: ReportsPageStoryProps) {
  const [tab, setTab] = useState(variant === 'monthly' ? 1 : 0);

  if (variant === 'paywall') {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
          <Breadcrumbs items={[{ label: 'レポート' }]} />
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
            レポート
          </Typography>
          <ProPaywall
            title="レポートはPROプラン限定です"
            description="PROプランにアップグレードすると、週次・月次のプレイレポートを確認できます。"
          />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs items={[{ label: 'レポート' }]} />
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
          レポート
        </Typography>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="週次" />
          <Tab label="月次" />
        </Tabs>

        {variant === 'empty' && (
          <Paper sx={{ textAlign: 'center', py: 6, bgcolor: 'background.default' }}>
            <Typography color="text.secondary">データがありません</Typography>
          </Paper>
        )}

        {variant !== 'empty' &&
          tab === 0 &&
          MOCK_WEEKLY_REPORTS.map((r, i) => <WeeklyCard key={i} report={r} />)}

        {variant !== 'empty' &&
          tab === 1 &&
          MOCK_MONTHLY_REPORTS.map((r, i) => <MonthlyCard key={i} report={r} />)}
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Reports/ReportsPage',
  component: ReportsPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ReportsPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WeeklyView: Story = {
  args: { variant: 'weekly' },
};

export const MonthlyView: Story = {
  args: { variant: 'monthly' },
};

export const Paywall: Story = {
  args: { variant: 'paywall' },
};

export const Empty: Story = {
  args: { variant: 'empty' },
};

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SyncIcon from '@mui/icons-material/Sync';
import DownloadIcon from '@mui/icons-material/Download';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import Chip from '@mui/material/Chip';
import Link from 'next/link';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { getFlightColor } from '@/lib/dartslive-colors';
import { calc01Rating, ppdForRating } from '@/lib/dartslive-rating';
import { canExportCsv } from '@/lib/permissions';
import ProPaywall from '@/components/ProPaywall';

// Progression components
import AchievementList from '@/components/progression/AchievementList';
import XpHistoryList from '@/components/progression/XpHistoryList';

// Stats components
import StatsLoginDialog from '@/components/stats/StatsLoginDialog';
import StatsPageContent from '@/components/stats/StatsPageContent';
import AdminApiStatsSection from '@/components/stats/AdminApiStatsSection';

import { useStatsPage } from '@/lib/hooks/useStatsPage';

export default function StatsPage() {
  const router = useRouter();
  const {
    session,
    status,
    canDartslive,
    isAdminApi,
    dlData,
    dlOpen,
    setDlOpen,
    dlEmail,
    setDlEmail,
    dlPassword,
    setDlPassword,
    dlLoading,
    dlError,
    dlConsent,
    setDlConsent,
    dlUpdatedAt,
    handleFetch,
    apiEnrichedData,
    apiDailyHistory,
    apiDartoutList,
    apiAwardList,
    apiRecentPlays,
    apiCountupPlays,
    fetchAdminApiData,
    periodTab,
    periodSummary,
    periodRecords,
    monthlyTab,
    setMonthlyTab,
    gameChartCategory,
    setGameChartCategory,
    activeSoftDart,
    achievements,
    achievementSnapshot,
    xpHistory,
  } = useStatsPage();

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  if (status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const c = dlData?.current;
  const flightColor = c?.flight ? getFlightColor(c.flight) : '#808080';

  // カウントアップ期待値
  const expectedCountUp = c?.stats01Avg != null ? Math.round(c.stats01Avg * 8) : null;
  const current01RtInt = c?.stats01Avg != null ? Math.floor(calc01Rating(c.stats01Avg)) : null;
  const dangerCountUp =
    current01RtInt != null ? Math.round(ppdForRating(current01RtInt - 2) * 8) : null;
  const excellentCountUp =
    current01RtInt != null ? Math.round(ppdForRating(current01RtInt + 2) * 8) : null;

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
            {canDartslive && dlUpdatedAt && (
              <Typography variant="caption" color="text.secondary">
                最終取得:{' '}
                {new Date(dlUpdatedAt).toLocaleString('ja-JP', {
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Typography>
            )}
          </Box>
          {canDartslive && (
            <Button
              variant={dlData ? 'outlined' : 'contained'}
              startIcon={dlLoading ? <CircularProgress size={18} color="inherit" /> : <SyncIcon />}
              onClick={() => setDlOpen(true)}
              disabled={dlLoading}
              size="small"
            >
              {dlLoading ? '取得中...' : dlData ? '更新' : 'ダーツライブ連携'}
            </Button>
          )}
        </Box>

        {/* PRO アップグレード案内 */}
        {!canDartslive && (
          <ProPaywall
            title="DARTSLIVE連携はPROプラン限定です"
            description="PROプランにアップグレードすると、DARTSLIVEアカウントと連携してスタッツの自動取得・推移グラフ・レーティング目標分析が利用できます。"
          />
        )}

        {/* 未取得 */}
        {canDartslive && !dlData && !dlLoading && (
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
            <Button variant="contained" startIcon={<SyncIcon />} onClick={() => setDlOpen(true)}>
              連携する
            </Button>
          </Paper>
        )}

        {canDartslive && dlLoading && !dlData && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography color="text.secondary">ダーツライブからスタッツ取得中...</Typography>
          </Box>
        )}

        {canDartslive && dlData && c && (
          <StatsPageContent
            dlData={dlData}
            periodTab={periodTab}
            periodSummary={periodSummary}
            periodRecords={periodRecords}
            flightColor={flightColor}
            expectedCountUp={expectedCountUp}
            dangerCountUp={dangerCountUp}
            excellentCountUp={excellentCountUp}
            activeSoftDart={activeSoftDart}
            monthlyTab={monthlyTab}
            gameChartCategory={gameChartCategory}
            onMonthlyTabChange={setMonthlyTab}
            onGameChartCategoryChange={setGameChartCategory}
          />
        )}

        {/* Admin API Stats */}
        {isAdminApi && (
          <AdminApiStatsSection
            dailyHistory={apiDailyHistory}
            enrichedData={apiEnrichedData}
            onSyncComplete={fetchAdminApiData}
            dartoutList={apiDartoutList}
            awardList={apiAwardList}
            recentPlays={apiRecentPlays}
            countupPlays={apiCountupPlays}
            flight={c?.flight}
          />
        )}

        {/* Progression (折り畳み) */}
        <Accordion
          defaultExpanded={false}
          sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                実績 & XP
              </Typography>
              {achievements.length > 0 && (
                <Chip label={`${achievements.length}件解除`} size="small" color="success" />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <AchievementList unlockedIds={achievements} snapshot={achievementSnapshot} />
            <XpHistoryList history={xpHistory} />
          </AccordionDetails>
        </Accordion>

        {/* 13. CSV Export */}
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">スタッツをエクスポート</Typography>
                {!canExportCsv(session?.user?.role) && (
                  <Chip label="PRO" color="primary" size="small" />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                全履歴をCSVファイルでダウンロード
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              href="/api/stats-history/export"
              disabled={!canExportCsv(session?.user?.role)}
            >
              CSV出力
            </Button>
          </CardContent>
        </Card>

        {/* 14. Manual Record */}
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
            <Button variant="outlined" size="small" onClick={() => router.push('/stats/new')}>
              手動記録
            </Button>
          </CardContent>
        </Card>

        {/* 15. Calendar Link */}
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
            <Button variant="outlined" size="small" component={Link} href="/stats/calendar">
              開く
            </Button>
          </CardContent>
        </Card>
      </Box>

      {/* Login Dialog */}
      {canDartslive && (
        <StatsLoginDialog
          open={dlOpen}
          onClose={() => setDlOpen(false)}
          email={dlEmail}
          setEmail={setDlEmail}
          password={dlPassword}
          setPassword={setDlPassword}
          consent={dlConsent}
          setConsent={setDlConsent}
          loading={dlLoading}
          error={dlError}
          onFetch={handleFetch}
        />
      )}
    </Container>
  );
}

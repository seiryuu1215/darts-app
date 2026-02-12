'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  CircularProgress,
  LinearProgress,
  Chip,
  Button,
  Paper,
} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BarrelProduct, QuizAnswer } from '@/types';
import type { BarrelAnalysis } from '@/lib/recommend-barrels';
import BarrelQuiz from '@/components/barrels/BarrelQuiz';
import BarrelCard from '@/components/barrels/BarrelCard';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { recommendFromQuiz, recommendFromQuizWithAnalysis } from '@/lib/recommend-barrels';
import { canViewDetailedAnalysis } from '@/lib/permissions';

type QuizResult = { barrel: BarrelProduct; score: number; matchPercent: number };

export default function QuizPage() {
  const { data: session } = useSession();
  const [allBarrels, setAllBarrels] = useState<BarrelProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<QuizResult[] | null>(null);
  const [analysisResults, setAnalysisResults] = useState<BarrelAnalysis[] | null>(null);

  const showDetails = canViewDetailedAnalysis(session?.user?.role);

  useEffect(() => {
    getDocs(collection(db, 'barrels'))
      .then((snap) => {
        setAllBarrels(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BarrelProduct));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleComplete = (answers: QuizAnswer) => {
    if (showDetails) {
      const recs = recommendFromQuizWithAnalysis(answers, allBarrels, 9);
      setAnalysisResults(recs);
      setResults(null);
    } else {
      const recs = recommendFromQuiz(answers, allBarrels, 9);
      setResults(recs);
      setAnalysisResults(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setResults(null);
    setAnalysisResults(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const hasResults = results || analysisResults;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Breadcrumbs items={[{ label: 'バレル検索', href: '/barrels' }, { label: '診断クイズ' }]} />

      <Typography variant="h4" gutterBottom>
        バレル診断クイズ
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        6つの質問に答えるだけで、あなたにぴったりのバレルを見つけます。
      </Typography>

      {!hasResults ? (
        <>
          <BarrelQuiz onComplete={handleComplete} />
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              バレルをお持ちの方は{' '}
              <Button
                component={Link}
                href="/barrels/recommend"
                size="small"
                startIcon={<AutoAwesomeIcon />}
              >
                おすすめバレル検索
              </Button>{' '}
              もご利用ください
            </Typography>
          </Box>
        </>
      ) : (
        <>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
          >
            <Typography variant="h5">診断結果</Typography>
            <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={handleReset}>
              もう一度
            </Button>
          </Box>

          <Grid container spacing={2}>
            {/* PRO: 詳細分析付き */}
            {analysisResults &&
              analysisResults.map((analysis) => (
                <Grid key={analysis.barrel.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box sx={{ mb: 1 }}>
                    <BarrelCard barrel={analysis.barrel} />
                  </Box>
                  <Paper variant="outlined" sx={{ p: 1.5 }}>
                    {/* 一致度バー */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="caption" fontWeight="bold" sx={{ minWidth: 48 }}>
                        マッチ度
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={analysis.matchPercent}
                        sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                        color={
                          analysis.matchPercent >= 70
                            ? 'success'
                            : analysis.matchPercent >= 40
                              ? 'primary'
                              : 'warning'
                        }
                      />
                      <Typography
                        variant="caption"
                        fontWeight="bold"
                        sx={{ minWidth: 32, textAlign: 'right' }}
                      >
                        {analysis.matchPercent}%
                      </Typography>
                    </Box>

                    {/* スペック差分チップ */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                      {analysis.diffs.weightDiff != null && (
                        <Chip
                          label={`重量 ${analysis.diffs.weightDiff > 0 ? '+' : ''}${analysis.diffs.weightDiff}g`}
                          size="small"
                          variant="outlined"
                          color={
                            Math.abs(analysis.diffs.weightDiff) <= 0.5
                              ? 'success'
                              : Math.abs(analysis.diffs.weightDiff) <= 2
                                ? 'default'
                                : 'warning'
                          }
                        />
                      )}
                      {analysis.diffs.diameterDiff != null && (
                        <Chip
                          label={`径 ${analysis.diffs.diameterDiff > 0 ? '+' : ''}${analysis.diffs.diameterDiff.toFixed(1)}mm`}
                          size="small"
                          variant="outlined"
                          color={
                            Math.abs(analysis.diffs.diameterDiff) <= 0.2
                              ? 'success'
                              : Math.abs(analysis.diffs.diameterDiff) <= 0.5
                                ? 'default'
                                : 'warning'
                          }
                        />
                      )}
                      {analysis.diffs.lengthDiff != null && (
                        <Chip
                          label={`長さ ${analysis.diffs.lengthDiff > 0 ? '+' : ''}${analysis.diffs.lengthDiff}mm`}
                          size="small"
                          variant="outlined"
                          color={
                            Math.abs(analysis.diffs.lengthDiff) <= 1
                              ? 'success'
                              : Math.abs(analysis.diffs.lengthDiff) <= 3
                                ? 'default'
                                : 'warning'
                          }
                        />
                      )}
                      {analysis.diffs.cutMatch !== 'none' && (
                        <Chip
                          label={analysis.diffs.cutMatch === 'exact' ? 'カット一致' : 'カット近似'}
                          size="small"
                          variant="outlined"
                          color={analysis.diffs.cutMatch === 'exact' ? 'success' : 'info'}
                        />
                      )}
                      {analysis.diffs.brandMatch && (
                        <Chip label="同ブランド" size="small" variant="outlined" color="info" />
                      )}
                    </Box>

                    {/* 感覚の違い */}
                    <Box>
                      {analysis.insights.map((insight, i) => (
                        <Typography
                          key={i}
                          variant="caption"
                          display="block"
                          color="text.secondary"
                          sx={{ lineHeight: 1.6 }}
                        >
                          ・{insight}
                        </Typography>
                      ))}
                    </Box>
                  </Paper>
                </Grid>
              ))}

            {/* Free: マッチ度のみ + PROティーザー */}
            {results &&
              results.map(({ barrel, matchPercent }) => (
                <Grid key={barrel.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box sx={{ mb: 1 }}>
                    <BarrelCard barrel={barrel} />
                  </Box>
                  <Paper variant="outlined" sx={{ p: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="caption" fontWeight="bold">
                        マッチ度
                      </Typography>
                      <Chip
                        label={`${Math.round(matchPercent)}%`}
                        size="small"
                        color={
                          matchPercent >= 70
                            ? 'success'
                            : matchPercent >= 40
                              ? 'warning'
                              : 'default'
                        }
                      />
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={matchPercent}
                      sx={{ height: 6, borderRadius: 3 }}
                      color={
                        matchPercent >= 70 ? 'success' : matchPercent >= 40 ? 'warning' : 'inherit'
                      }
                    />
                  </Paper>
                </Grid>
              ))}
          </Grid>

          {/* Freeユーザー向け PRO ティーザー */}
          {results && (
            <Paper
              sx={{
                mt: 3,
                p: 2.5,
                textAlign: 'center',
                border: '1px dashed',
                borderColor: 'primary.main',
                borderRadius: 2,
                bgcolor: 'background.default',
              }}
            >
              <LockOpenIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                PROプランで詳細レポートを確認
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 1.5 }}
              >
                スペック差分・フィーリングの違い・移行アドバイスを確認できます
              </Typography>
              <Button
                variant="outlined"
                size="small"
                component={Link}
                href="/pricing"
                sx={{ borderRadius: 2 }}
              >
                PROプランを見る
              </Button>
            </Paper>
          )}
        </>
      )}
    </Container>
  );
}

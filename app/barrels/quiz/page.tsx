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
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BarrelProduct, QuizAnswer } from '@/types';
import BarrelQuiz from '@/components/barrels/BarrelQuiz';
import BarrelCard from '@/components/barrels/BarrelCard';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { recommendFromQuiz } from '@/lib/recommend-barrels';

interface QuizResult {
  barrel: BarrelProduct;
  score: number;
  matchPercent: number;
}

export default function QuizPage() {
  const [allBarrels, setAllBarrels] = useState<BarrelProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<QuizResult[] | null>(null);

  useEffect(() => {
    getDocs(collection(db, 'barrels'))
      .then((snap) => {
        setAllBarrels(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BarrelProduct));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleComplete = (answers: QuizAnswer) => {
    const recs = recommendFromQuiz(answers, allBarrels, 9);
    setResults(recs);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setResults(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Breadcrumbs
        items={[
          { label: 'バレル検索', href: '/barrels' },
          { label: '診断クイズ' },
        ]}
      />

      <Typography variant="h4" gutterBottom>
        バレル診断クイズ
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        6つの質問に答えるだけで、あなたにぴったりのバレルを見つけます。
      </Typography>

      {!results ? (
        <>
          <BarrelQuiz onComplete={handleComplete} />
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              バレルをお持ちの方は{' '}
              <Button component={Link} href="/barrels/recommend" size="small" startIcon={<AutoAwesomeIcon />}>
                おすすめバレル検索
              </Button>
              {' '}もご利用ください
            </Typography>
          </Box>
        </>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5">診断結果</Typography>
            <Button
              variant="outlined"
              startIcon={<RestartAltIcon />}
              onClick={handleReset}
            >
              もう一度
            </Button>
          </Box>

          <Grid container spacing={2}>
            {results.map(({ barrel, matchPercent }) => (
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
                      color={matchPercent >= 70 ? 'success' : matchPercent >= 40 ? 'warning' : 'default'}
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={matchPercent}
                    sx={{ height: 6, borderRadius: 3 }}
                    color={matchPercent >= 70 ? 'success' : matchPercent >= 40 ? 'warning' : 'inherit'}
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Container>
  );
}

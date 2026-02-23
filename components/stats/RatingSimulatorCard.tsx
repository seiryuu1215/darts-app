'use client';

import { useState, useMemo } from 'react';
import { Paper, Typography, Box, Slider } from '@mui/material';
import {
  calcRating,
  calc01Rating,
  calcCriRating,
  ppdForRating,
  mprForRating,
} from '@/lib/dartslive-rating';
import { COLOR_01, COLOR_CRICKET } from '@/lib/dartslive-colors';
import { getFlightColor } from '@/lib/dartslive-colors';

interface RatingSimulatorCardProps {
  currentPpd: number;
  currentMpr: number;
}

function getFlightFromRating(rating: number): string {
  if (rating >= 14) return 'SA';
  if (rating >= 12) return 'AA';
  if (rating >= 10) return 'A';
  if (rating >= 8) return 'BB';
  if (rating >= 6) return 'B';
  if (rating >= 4) return 'CC';
  if (rating >= 2) return 'C';
  return 'N';
}

export default function RatingSimulatorCard({ currentPpd, currentMpr }: RatingSimulatorCardProps) {
  const [ppdDelta, setPpdDelta] = useState(0);
  const [mprDelta, setMprDelta] = useState(0);

  const current = useMemo(
    () => ({
      rating: calcRating(currentPpd, currentMpr),
      o1Rt: calc01Rating(currentPpd),
      criRt: calcCriRating(currentMpr),
    }),
    [currentPpd, currentMpr],
  );

  const simulated = useMemo(() => {
    const newPpd = Math.max(0, currentPpd + ppdDelta);
    const newMpr = Math.max(0, currentMpr + mprDelta);
    return {
      ppd: newPpd,
      mpr: newMpr,
      rating: calcRating(newPpd, newMpr),
      o1Rt: calc01Rating(newPpd),
      criRt: calcCriRating(newMpr),
    };
  }, [currentPpd, currentMpr, ppdDelta, mprDelta]);

  const ratingDiff = simulated.rating - current.rating;
  const newFlight = getFlightFromRating(Math.floor(simulated.rating));
  const currentFlight = getFlightFromRating(Math.floor(current.rating));
  const flightChanged = newFlight !== currentFlight;

  // 効率比較: 同じレーティング上昇に必要なPPDとMPR
  const efficiency = useMemo(() => {
    const targetRating = Math.floor(current.rating) + 1;
    const needed01Rt = targetRating * 2 - current.criRt;
    const neededCriRt = targetRating * 2 - current.o1Rt;
    const ppdNeeded = ppdForRating(needed01Rt) - currentPpd;
    const mprNeeded = mprForRating(neededCriRt) - currentMpr;

    return {
      ppdNeeded: Math.max(0, Math.round(ppdNeeded * 100) / 100),
      mprNeeded: Math.max(0, Math.round(mprNeeded * 100) / 100),
      nextRating: targetRating,
      ppdAchieved: ppdNeeded <= 0,
      mprAchieved: mprNeeded <= 0,
    };
  }, [current, currentPpd, currentMpr]);

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1.5 }}>
        レーティングシミュレータ
      </Typography>

      {/* 現在値 → シミュレーション結果 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          mb: 2,
          p: 1.5,
          borderRadius: 1,
          bgcolor: 'rgba(255,255,255,0.03)',
          border: '1px solid #333',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            現在
          </Typography>
          <Typography
            variant="h5"
            sx={{ fontWeight: 'bold', color: getFlightColor(currentFlight) }}
          >
            Rt.{current.rating.toFixed(2)}
          </Typography>
          <Typography variant="caption" sx={{ color: getFlightColor(currentFlight) }}>
            {currentFlight}
          </Typography>
        </Box>
        <Typography variant="h5" color="text.secondary">
          →
        </Typography>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            シミュレーション
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 'bold',
              color: getFlightColor(newFlight),
            }}
          >
            Rt.{simulated.rating.toFixed(2)}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
            <Typography variant="caption" sx={{ color: getFlightColor(newFlight) }}>
              {newFlight}
            </Typography>
            {ratingDiff !== 0 && (
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 'bold',
                  color: ratingDiff > 0 ? '#4caf50' : '#f44336',
                }}
              >
                ({ratingDiff > 0 ? '+' : ''}
                {ratingDiff.toFixed(2)})
              </Typography>
            )}
          </Box>
          {flightChanged && (
            <Typography variant="caption" sx={{ color: '#FF9800', fontWeight: 'bold' }}>
              フライト変更!
            </Typography>
          )}
        </Box>
      </Box>

      {/* PPDスライダー */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: COLOR_01 }}>
            01 PPD: {simulated.ppd.toFixed(1)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {ppdDelta > 0 ? '+' : ''}
            {ppdDelta.toFixed(1)} (Rt.{simulated.o1Rt.toFixed(2)})
          </Typography>
        </Box>
        <Slider
          value={ppdDelta}
          onChange={(_, v) => setPpdDelta(v as number)}
          min={-20}
          max={20}
          step={0.5}
          sx={{
            color: COLOR_01,
            '& .MuiSlider-thumb': { width: 16, height: 16 },
          }}
          marks={[
            { value: -20, label: '-20' },
            { value: 0, label: '0' },
            { value: 20, label: '+20' },
          ]}
        />
      </Box>

      {/* MPRスライダー */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: COLOR_CRICKET }}>
            Cricket MPR: {simulated.mpr.toFixed(2)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {mprDelta > 0 ? '+' : ''}
            {mprDelta.toFixed(2)} (Rt.{simulated.criRt.toFixed(2)})
          </Typography>
        </Box>
        <Slider
          value={mprDelta}
          onChange={(_, v) => setMprDelta(v as number)}
          min={-1}
          max={1}
          step={0.05}
          sx={{
            color: COLOR_CRICKET,
            '& .MuiSlider-thumb': { width: 16, height: 16 },
          }}
          marks={[
            { value: -1, label: '-1.0' },
            { value: 0, label: '0' },
            { value: 1, label: '+1.0' },
          ]}
        />
      </Box>

      {/* 次のレーティングまでの効率比較 */}
      <Box
        sx={{
          p: 1.5,
          borderRadius: 1,
          bgcolor: 'rgba(255,255,255,0.03)',
          border: '1px solid #333',
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
          Rt.{efficiency.nextRating}到達に必要な改善幅
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="caption" sx={{ color: COLOR_01 }}>
              01のみ
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: 'bold', color: efficiency.ppdAchieved ? '#4caf50' : COLOR_01 }}
            >
              {efficiency.ppdAchieved ? '達成済み' : `+${efficiency.ppdNeeded} PPD`}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: COLOR_CRICKET }}>
              Cricketのみ
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: 'bold', color: efficiency.mprAchieved ? '#4caf50' : COLOR_CRICKET }}
            >
              {efficiency.mprAchieved ? '達成済み' : `+${efficiency.mprNeeded} MPR`}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

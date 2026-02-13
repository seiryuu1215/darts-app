'use client';

import { Paper, Box, Typography } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { COLOR_01, COLOR_CRICKET } from '@/lib/dartslive-colors';
import { getRatingTarget } from '@/lib/dartslive-rating';

interface RatingTargetCardProps {
  stats01Avg: number;
  statsCriAvg: number;
  flightColor: string;
}

export default function RatingTargetCard({
  stats01Avg,
  statsCriAvg,
  flightColor,
}: RatingTargetCardProps) {
  const target = getRatingTarget(stats01Avg, statsCriAvg);

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
        <ArrowUpwardIcon sx={{ fontSize: 18, color: flightColor }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          次の目標: Rt.{target.nextRating}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
          01 Rt: {target.current01Rt.toFixed(2)} / Cri Rt: {target.currentCriRt.toFixed(2)}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Paper variant="outlined" sx={{ flex: 1, p: 1.5, borderColor: COLOR_01 + '44' }}>
          <Typography variant="caption" sx={{ color: COLOR_01, fontWeight: 'bold' }}>
            01だけで上げる場合
          </Typography>
          {target.ppd01Only.achieved ? (
            <Typography variant="body1" sx={{ mt: 0.5, color: 'success.main', fontWeight: 'bold' }}>
              達成済み
            </Typography>
          ) : (
            <>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                PPD {target.ppd01Only.target.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                あと +{target.ppd01Only.gap.toFixed(2)} 必要
              </Typography>
            </>
          )}
        </Paper>
        <Paper variant="outlined" sx={{ flex: 1, p: 1.5, borderColor: COLOR_CRICKET + '44' }}>
          <Typography variant="caption" sx={{ color: COLOR_CRICKET, fontWeight: 'bold' }}>
            Cricketだけで上げる場合
          </Typography>
          {target.mprCriOnly.achieved ? (
            <Typography variant="body1" sx={{ mt: 0.5, color: 'success.main', fontWeight: 'bold' }}>
              達成済み
            </Typography>
          ) : (
            <>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                MPR {target.mprCriOnly.target.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                あと +{target.mprCriOnly.gap.toFixed(2)} 必要
              </Typography>
            </>
          )}
        </Paper>
      </Box>
      {/* 均等に上げる場合 */}
      <Paper variant="outlined" sx={{ p: 1.5, mt: 1.5, borderColor: 'divider' }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
          均等に上げる場合
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              PPD{' '}
              {target.ppdBalanced.achieved ? (
                <Typography component="span" sx={{ color: 'success.main' }}>
                  達成済み
                </Typography>
              ) : (
                <>
                  {target.ppdBalanced.target.toFixed(2)}
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                    sx={{ ml: 0.5 }}
                  >
                    (+{target.ppdBalanced.gap.toFixed(2)})
                  </Typography>
                </>
              )}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              MPR{' '}
              {target.mprBalanced.achieved ? (
                <Typography component="span" sx={{ color: 'success.main' }}>
                  達成済み
                </Typography>
              ) : (
                <>
                  {target.mprBalanced.target.toFixed(2)}
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                    sx={{ ml: 0.5 }}
                  >
                    (+{target.mprBalanced.gap.toFixed(2)})
                  </Typography>
                </>
              )}
            </Typography>
          </Box>
        </Box>
      </Paper>
      {target.ppd01Only.achieved && target.mprCriOnly.achieved && (
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 1 }}>
          最大レーティングに到達しています
        </Typography>
      )}
    </Paper>
  );
}

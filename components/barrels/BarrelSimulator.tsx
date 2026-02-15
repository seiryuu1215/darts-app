'use client';

import { Box, Typography, Chip } from '@mui/material';
import type { BarrelProduct } from '@/types';
import { getBarrelImageUrl } from '@/lib/image-proxy';

interface BarrelSimulatorProps {
  barrels: BarrelProduct[];
}

const HEX_COLORS = ['#1976d2', '#dc004e'];
const BORDER_COLORS = ['rgba(25,118,210,0.5)', 'rgba(220,0,78,0.5)'];
const PX_PER_MM = 8;

/**
 * Pure CSS barrel comparison — no proxy or Canvas needed.
 * Each barrel image is loaded directly from the source (browser handles CORS for <img>).
 * Scaled by spec-based length so both are at the same mm→px ratio.
 */
function BarrelImage({
  barrel,
  index,
  yOffset,
}: {
  barrel: BarrelProduct;
  index: number;
  yOffset: number;
}) {
  const len = barrel.length ?? 45;
  const displayWidth = len * PX_PER_MM;
  const color = HEX_COLORS[index % HEX_COLORS.length];
  const borderColor = BORDER_COLORS[index % BORDER_COLORS.length];

  if (!barrel.imageUrl) {
    return (
      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          top: `calc(50% + ${yOffset}px)`,
          transform: 'translate(-50%, -50%)',
          width: displayWidth,
          height: 40,
          border: `2px dashed ${color}`,
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.5,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          画像なし
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        left: '50%',
        top: `calc(50% + ${yOffset}px)`,
        transform: 'translate(-50%, -50%)',
        width: displayWidth,
        opacity: 0.8,
        border: `2px solid ${borderColor}`,
        borderRadius: '4px',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <Box
        component="img"
        src={getBarrelImageUrl(barrel.imageUrl) ?? ''}
        alt={`${barrel.brand} ${barrel.name}`}
        sx={{
          display: 'block',
          width: '100%',
          height: 'auto',
        }}
      />
    </Box>
  );
}

export default function BarrelSimulator({ barrels }: BarrelSimulatorProps) {
  if (barrels.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">バレルを選択してください</Typography>
      </Box>
    );
  }

  const maxLen = Math.max(...barrels.map((b) => b.length ?? 45));
  const containerWidth = maxLen * PX_PER_MM + 80;
  // Stack vertically with slight offset for comparison
  const containerHeight = barrels.length === 1 ? 160 : 240;
  const offsets = barrels.length === 1 ? [0] : [-30, 30];

  return (
    <Box>
      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
        {barrels.map((b, i) => (
          <Chip
            key={b.id ?? i}
            label={`${b.brand} ${b.name} (${b.length ?? '?'}mm / ⌀${b.maxDiameter ?? '?'}mm)`}
            size="small"
            sx={{
              bgcolor: HEX_COLORS[i % HEX_COLORS.length],
              color: '#fff',
              fontWeight: 'bold',
            }}
          />
        ))}
      </Box>

      {/* Comparison area */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: containerWidth,
          height: containerHeight,
          mx: 'auto',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
          bgcolor: 'background.paper',
        }}
      >
        {/* Center guide line */}
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '50%',
            borderTop: '1px dashed',
            borderColor: 'divider',
            opacity: 0.3,
          }}
        />

        {barrels.map((barrel, i) => (
          <BarrelImage key={barrel.id ?? i} barrel={barrel} index={i} yOffset={offsets[i] ?? 0} />
        ))}
      </Box>
    </Box>
  );
}

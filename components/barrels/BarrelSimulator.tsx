'use client';

import { Box, Typography, Chip, Skeleton } from '@mui/material';
import type { BarrelProduct } from '@/types';
import { useProcessedBarrelImage } from './useProcessedBarrelImage';

interface BarrelSimulatorProps {
  barrels: BarrelProduct[];
}

const TINT_COLORS: [number, number, number][] = [
  [25, 118, 210], // #1976d2 blue
  [220, 0, 78], // #dc004e red
];
const HEX_COLORS = ['#1976d2', '#dc004e'];
const TARGET_PX_PER_MM = 8;

/** Single barrel image — background removed, scaled to mm, tinted */
function BarrelOverlayImage({
  barrel,
  index,
}: {
  barrel: BarrelProduct;
  index: number;
}) {
  const tint = TINT_COLORS[index % TINT_COLORS.length];
  const { image, loading } = useProcessedBarrelImage(barrel, tint);

  const len = barrel.length ?? 45;
  const dia = barrel.maxDiameter ?? 7;

  if (loading) {
    return (
      <Skeleton
        variant="rectangular"
        sx={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: len * TARGET_PX_PER_MM,
          height: dia * TARGET_PX_PER_MM,
          borderRadius: 1,
        }}
      />
    );
  }

  // Fallback: if processing failed, show original image with CSS tint
  if (!image) {
    if (!barrel.imageUrl) return null;
    const color = HEX_COLORS[index % HEX_COLORS.length];
    const fallbackWidth = len * TARGET_PX_PER_MM;
    const fallbackHeight = (dia / len) * fallbackWidth * 3;
    return (
      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: fallbackWidth,
          height: fallbackHeight,
          overflow: 'hidden',
          borderRadius: 1,
          border: `2px solid ${color}`,
          opacity: 0.7,
          pointerEvents: 'none',
        }}
      >
        <Box
          component="img"
          src={`/api/proxy-image?url=${encodeURIComponent(barrel.imageUrl)}`}
          alt={`${barrel.brand} ${barrel.name}`}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </Box>
    );
  }

  // Scale image so barrel.length maps to the target px/mm
  const pxPerMm = image.widthPx / len;
  const displayScale = TARGET_PX_PER_MM / pxPerMm;
  const displayWidth = image.widthPx * displayScale;
  const displayHeight = image.heightPx * displayScale;

  return (
    <Box
      component="img"
      src={image.dataUrl}
      alt={`${barrel.brand} ${barrel.name}`}
      sx={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: displayWidth,
        height: displayHeight,
        opacity: 0.75,
        pointerEvents: 'none',
      }}
    />
  );
}

export default function BarrelSimulator({ barrels }: BarrelSimulatorProps) {
  if (barrels.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">
          バレルを選択してください
        </Typography>
      </Box>
    );
  }

  const maxLen = Math.max(...barrels.map((b) => b.length ?? 45));
  const maxDia = Math.max(...barrels.map((b) => b.maxDiameter ?? 7));
  const containerWidth = maxLen * TARGET_PX_PER_MM + 60;
  const containerHeight = Math.max(120, maxDia * TARGET_PX_PER_MM * 3 + 40);

  return (
    <Box>
      {/* Legend chips */}
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

      {/* Overlay comparison area */}
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
        {/* Center axis guide line */}
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '50%',
            borderTop: '1px dashed',
            borderColor: 'divider',
            opacity: 0.4,
          }}
        />

        {barrels.map((barrel, i) => (
          <BarrelOverlayImage
            key={barrel.id ?? i}
            barrel={barrel}
            index={i}
          />
        ))}
      </Box>
    </Box>
  );
}

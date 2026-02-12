import type { BarrelContour } from '@/types';

/** Raw pixel-level contour before normalization */
interface RawContour {
  /** Per-column top edge y-coordinate */
  topEdge: number[];
  /** Per-column bottom edge y-coordinate */
  bottomEdge: number[];
  /** Starting x offset in the source image */
  xOffset: number;
  /** Image height used for extraction */
  imageHeight: number;
}

/**
 * Extract barrel outline from image pixel data.
 * Expects a white-background, horizontally-oriented barrel photo.
 *
 * Returns null if the image doesn't contain a recognizable barrel shape
 * (barrel width < 30% of image height).
 */
export function extractContourFromImageData(
  imageData: ImageData,
  options?: { brightnessThreshold?: number },
): RawContour | null {
  const { width, height, data } = imageData;
  const threshold = options?.brightnessThreshold ?? 230;

  const topEdge: number[] = [];
  const bottomEdge: number[] = [];

  // For each column x, find the top-most and bottom-most non-background pixel
  for (let x = 0; x < width; x++) {
    let top = -1;
    let bottom = -1;
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      if (brightness <= threshold && a >= 128) {
        if (top === -1) top = y;
        bottom = y;
      }
    }
    topEdge.push(top);
    bottomEdge.push(bottom);
  }

  // Trim empty columns from both ends
  let startX = 0;
  let endX = width - 1;
  while (startX < width && topEdge[startX] === -1) startX++;
  while (endX > startX && topEdge[endX] === -1) endX--;

  if (startX >= endX) return null;

  const trimmedTop = topEdge.slice(startX, endX + 1);
  const trimmedBottom = bottomEdge.slice(startX, endX + 1);

  // Check barrel height vs image height (must be at least 30%)
  let maxBarrelHeight = 0;
  for (let i = 0; i < trimmedTop.length; i++) {
    if (trimmedTop[i] !== -1) {
      const h = trimmedBottom[i] - trimmedTop[i];
      if (h > maxBarrelHeight) maxBarrelHeight = h;
    }
  }
  if (maxBarrelHeight < height * 0.15) return null;

  // Interpolate internal gaps (columns where detection failed)
  for (let i = 0; i < trimmedTop.length; i++) {
    if (trimmedTop[i] === -1) {
      // Find prev and next valid
      let prev = i - 1;
      while (prev >= 0 && trimmedTop[prev] === -1) prev--;
      let next = i + 1;
      while (next < trimmedTop.length && trimmedTop[next] === -1) next++;
      if (prev >= 0 && next < trimmedTop.length) {
        const t = (i - prev) / (next - prev);
        trimmedTop[i] = Math.round(trimmedTop[prev] + t * (trimmedTop[next] - trimmedTop[prev]));
        trimmedBottom[i] = Math.round(trimmedBottom[prev] + t * (trimmedBottom[next] - trimmedBottom[prev]));
      }
    }
  }

  // Smooth with moving average (window = 7)
  const smooth = (arr: number[], window: number): number[] => {
    const half = Math.floor(window / 2);
    return arr.map((_, i) => {
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, i - half); j <= Math.min(arr.length - 1, i + half); j++) {
        if (arr[j] !== -1) {
          sum += arr[j];
          count++;
        }
      }
      return count > 0 ? sum / count : arr[i];
    });
  };

  return {
    topEdge: smooth(trimmedTop, 7),
    bottomEdge: smooth(trimmedBottom, 7),
    xOffset: startX,
    imageHeight: height,
  };
}

/**
 * Normalize raw pixel contour to mm-based coordinate system.
 * Downsamples to ~90 points per side.
 */
export function normalizeContourToMm(
  raw: RawContour,
  lengthMm: number,
  maxDiaMm: number,
): BarrelContour {
  const barrelLengthPx = raw.topEdge.length;
  const pxPerMm = barrelLengthPx / lengthMm;

  // Calculate center axis
  const centerY: number[] = [];
  for (let i = 0; i < barrelLengthPx; i++) {
    centerY.push((raw.topEdge[i] + raw.bottomEdge[i]) / 2);
  }

  // Find max pixel radius for scaling
  let maxRadiusPx = 0;
  for (let i = 0; i < barrelLengthPx; i++) {
    const r = (raw.bottomEdge[i] - raw.topEdge[i]) / 2;
    if (r > maxRadiusPx) maxRadiusPx = r;
  }

  const radiusScale = maxRadiusPx > 0 ? (maxDiaMm / 2) / maxRadiusPx : 1;

  // Downsample to ~90 points
  const numPoints = Math.min(90, barrelLengthPx);
  const step = barrelLengthPx / numPoints;

  const upperProfile: [number, number][] = [];
  const lowerProfile: [number, number][] = [];

  for (let i = 0; i < numPoints; i++) {
    const px = Math.min(Math.round(i * step), barrelLengthPx - 1);
    const xMm = px / pxPerMm;
    const topRadius = (centerY[px] - raw.topEdge[px]) * radiusScale;
    const botRadius = (raw.bottomEdge[px] - centerY[px]) * radiusScale;
    upperProfile.push([xMm, topRadius]);
    lowerProfile.push([xMm, botRadius]);
  }

  return { upperProfile, lowerProfile };
}

/**
 * Convert a BarrelContour to an SVG path string for rendering.
 */
export function contourToSvgPath(
  contour: BarrelContour,
  scale: number,
  xOffset: number,
  yCenter: number,
): string {
  const { upperProfile, lowerProfile } = contour;
  if (upperProfile.length === 0) return '';

  // Build upper edge points (left to right)
  const upperPoints = upperProfile.map(([xMm, rMm]) => ({
    x: xOffset + xMm * scale,
    y: yCenter - rMm * scale,
  }));

  // Build lower edge points (right to left for closed path)
  const lowerPoints = [...lowerProfile].reverse().map(([xMm, rMm]) => ({
    x: xOffset + xMm * scale,
    y: yCenter + rMm * scale,
  }));

  // Create smooth path using line segments (contour already smoothed)
  const allPoints = [...upperPoints, ...lowerPoints];
  if (allPoints.length < 2) return '';

  const parts = [`M ${allPoints[0].x.toFixed(1)} ${allPoints[0].y.toFixed(1)}`];
  for (let i = 1; i < allPoints.length; i++) {
    parts.push(`L ${allPoints[i].x.toFixed(1)} ${allPoints[i].y.toFixed(1)}`);
  }
  parts.push('Z');

  return parts.join(' ');
}

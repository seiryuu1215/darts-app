import type { BarrelContour } from '@/types';

/** Raw pixel-level contour before normalization */
interface RawContour {
  topEdge: number[];
  bottomEdge: number[];
  xOffset: number;
  imageHeight: number;
}

interface BarrelRegion {
  yStart: number;
  yEnd: number;
  height: number;
  centerY: number;
}

/**
 * Otsu's method: compute optimal brightness threshold from image histogram.
 * Separates foreground (barrel) from background automatically.
 */
function computeOtsuThreshold(imageData: ImageData): number {
  const { width, height, data } = imageData;
  const histogram = new Array(256).fill(0);
  const total = width * height;

  for (let i = 0; i < total; i++) {
    const idx = i * 4;
    const brightness = Math.round(
      0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2],
    );
    histogram[brightness]++;
  }

  let sumAll = 0;
  for (let i = 0; i < 256; i++) sumAll += i * histogram[i];

  let sumBg = 0;
  let weightBg = 0;
  let maxVariance = 0;
  let bestThreshold = 200;

  for (let t = 0; t < 256; t++) {
    weightBg += histogram[t];
    if (weightBg === 0) continue;
    const weightFg = total - weightBg;
    if (weightFg === 0) break;

    sumBg += t * histogram[t];
    const meanBg = sumBg / weightBg;
    const meanFg = (sumAll - sumBg) / weightFg;
    const variance = weightBg * weightFg * (meanBg - meanFg) ** 2;

    if (variance > maxVariance) {
      maxVariance = variance;
      bestThreshold = t;
    }
  }

  // For white-background barrel images, the threshold should be high.
  // Clamp to reasonable range for barrel detection.
  return Math.max(150, Math.min(240, bestThreshold));
}

/**
 * Scan rows to detect individual barrel regions separated by background gaps.
 * Returns regions sorted by proximity to image center (center-most first).
 */
function detectBarrelRegions(
  imageData: ImageData,
  threshold: number,
): BarrelRegion[] {
  const { width, height, data } = imageData;
  const minFill = width * 0.05;
  const rowFill: boolean[] = [];

  for (let y = 0; y < height; y++) {
    let count = 0;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const brightness =
        0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      if (brightness <= threshold && data[idx + 3] >= 128) count++;
    }
    rowFill.push(count >= minFill);
  }

  const regions: BarrelRegion[] = [];
  let inRegion = false;
  let regionStart = 0;

  for (let y = 0; y <= height; y++) {
    const filled = y < height ? rowFill[y] : false;
    if (filled && !inRegion) {
      inRegion = true;
      regionStart = y;
    } else if (!filled && inRegion) {
      inRegion = false;
      const regionHeight = y - regionStart;
      if (regionHeight >= height * 0.05) {
        regions.push({
          yStart: regionStart,
          yEnd: y - 1,
          height: regionHeight,
          centerY: (regionStart + y - 1) / 2,
        });
      }
    }
  }

  // Sort by proximity to image center (center-most barrel is best for extraction)
  const imgCenter = height / 2;
  regions.sort(
    (a, b) => Math.abs(a.centerY - imgCenter) - Math.abs(b.centerY - imgCenter),
  );
  return regions;
}

/**
 * Extract barrel outline from image pixel data.
 * Uses Otsu's method for adaptive thresholding and selects the center-most barrel.
 */
export function extractContourFromImageData(
  imageData: ImageData,
): RawContour | null {
  const { width, data } = imageData;

  const threshold = computeOtsuThreshold(imageData);
  const regions = detectBarrelRegions(imageData, threshold);
  if (regions.length === 0) return null;

  const target = regions[0];
  const yMin = target.yStart;
  const yMax = target.yEnd;

  const topEdge: number[] = [];
  const bottomEdge: number[] = [];

  for (let x = 0; x < width; x++) {
    let top = -1;
    let bottom = -1;
    for (let y = yMin; y <= yMax; y++) {
      const idx = (y * width + x) * 4;
      const brightness =
        0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      if (brightness <= threshold && data[idx + 3] >= 128) {
        if (top === -1) top = y;
        bottom = y;
      }
    }
    topEdge.push(top);
    bottomEdge.push(bottom);
  }

  // Trim empty columns
  let startX = 0;
  let endX = width - 1;
  while (startX < width && topEdge[startX] === -1) startX++;
  while (endX > startX && topEdge[endX] === -1) endX--;
  if (startX >= endX) return null;

  const trimmedTop = topEdge.slice(startX, endX + 1);
  const trimmedBottom = bottomEdge.slice(startX, endX + 1);

  // Validate barrel height
  let maxBarrelHeight = 0;
  for (let i = 0; i < trimmedTop.length; i++) {
    if (trimmedTop[i] !== -1) {
      const h = trimmedBottom[i] - trimmedTop[i];
      if (h > maxBarrelHeight) maxBarrelHeight = h;
    }
  }
  if (maxBarrelHeight < 3) return null;

  // Interpolate internal gaps
  for (let i = 0; i < trimmedTop.length; i++) {
    if (trimmedTop[i] === -1) {
      let prev = i - 1;
      while (prev >= 0 && trimmedTop[prev] === -1) prev--;
      let next = i + 1;
      while (next < trimmedTop.length && trimmedTop[next] === -1) next++;
      if (prev >= 0 && next < trimmedTop.length) {
        const t = (i - prev) / (next - prev);
        trimmedTop[i] = Math.round(
          trimmedTop[prev] + t * (trimmedTop[next] - trimmedTop[prev]),
        );
        trimmedBottom[i] = Math.round(
          trimmedBottom[prev] + t * (trimmedBottom[next] - trimmedBottom[prev]),
        );
      }
    }
  }

  // Gaussian smoothing (sigma=1.0) — preserves cut detail much better than moving average.
  // At 800px width, sigma=1.0 only blurs ~0.25mm of structure.
  const gaussianSmooth = (arr: number[], sigma: number): number[] => {
    const radius = Math.ceil(sigma * 2.5);
    const kernel: number[] = [];
    let kernelSum = 0;
    for (let k = -radius; k <= radius; k++) {
      const v = Math.exp(-(k * k) / (2 * sigma * sigma));
      kernel.push(v);
      kernelSum += v;
    }
    for (let k = 0; k < kernel.length; k++) kernel[k] /= kernelSum;

    return arr.map((_, i) => {
      let sum = 0;
      let wsum = 0;
      for (let k = -radius; k <= radius; k++) {
        const idx = i + k;
        if (idx >= 0 && idx < arr.length && arr[idx] !== -1) {
          sum += arr[idx] * kernel[k + radius];
          wsum += kernel[k + radius];
        }
      }
      return wsum > 0 ? sum / wsum : arr[i];
    });
  };

  return {
    topEdge: gaussianSmooth(trimmedTop, 1.0),
    bottomEdge: gaussianSmooth(trimmedBottom, 1.0),
    xOffset: startX,
    imageHeight: imageData.height,
  };
}

/**
 * Normalize raw pixel contour to mm-based coordinate system.
 * Uses known length and maxDiameter to accurately scale.
 */
export function normalizeContourToMm(
  raw: RawContour,
  lengthMm: number,
  maxDiaMm: number,
): BarrelContour {
  const barrelLengthPx = raw.topEdge.length;
  const pxPerMm = barrelLengthPx / lengthMm;

  const centerY: number[] = [];
  for (let i = 0; i < barrelLengthPx; i++) {
    centerY.push((raw.topEdge[i] + raw.bottomEdge[i]) / 2);
  }

  let maxRadiusPx = 0;
  for (let i = 0; i < barrelLengthPx; i++) {
    const r = (raw.bottomEdge[i] - raw.topEdge[i]) / 2;
    if (r > maxRadiusPx) maxRadiusPx = r;
  }

  const radiusScale = maxRadiusPx > 0 ? (maxDiaMm / 2) / maxRadiusPx : 1;
  const numPoints = Math.min(200, barrelLengthPx);
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

  const upperPoints = upperProfile.map(([xMm, rMm]) => ({
    x: xOffset + xMm * scale,
    y: yCenter - rMm * scale,
  }));

  const lowerPoints = [...lowerProfile].reverse().map(([xMm, rMm]) => ({
    x: xOffset + xMm * scale,
    y: yCenter + rMm * scale,
  }));

  const allPoints = [...upperPoints, ...lowerPoints];
  if (allPoints.length < 2) return '';

  const parts = [`M ${allPoints[0].x.toFixed(1)} ${allPoints[0].y.toFixed(1)}`];
  for (let i = 1; i < allPoints.length; i++) {
    parts.push(`L ${allPoints[i].x.toFixed(1)} ${allPoints[i].y.toFixed(1)}`);
  }
  parts.push('Z');

  return parts.join(' ');
}

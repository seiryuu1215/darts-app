/**
 * Process barrel product images: detect single barrel, crop, remove background,
 * apply color tint for visual distinction during overlay comparison.
 */

export interface ProcessedBarrelImage {
  dataUrl: string;
  widthPx: number;
  heightPx: number;
}

/** Otsu's method for optimal brightness threshold */
function computeOtsu(data: Uint8ClampedArray, totalPixels: number): number {
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const b = Math.round(
      0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2],
    );
    histogram[b]++;
  }

  let sumAll = 0;
  for (let i = 0; i < 256; i++) sumAll += i * histogram[i];

  let sumBg = 0;
  let weightBg = 0;
  let maxVar = 0;
  let best = 200;

  for (let t = 0; t < 256; t++) {
    weightBg += histogram[t];
    if (weightBg === 0) continue;
    const weightFg = totalPixels - weightBg;
    if (weightFg === 0) break;
    sumBg += t * histogram[t];
    const meanBg = sumBg / weightBg;
    const meanFg = (sumAll - sumBg) / weightFg;
    const v = weightBg * weightFg * (meanBg - meanFg) ** 2;
    if (v > maxVar) {
      maxVar = v;
      best = t;
    }
  }

  return Math.max(150, Math.min(240, best));
}

interface Region {
  yStart: number;
  yEnd: number;
  centerY: number;
}

/** Detect individual barrel regions by row scanning */
function detectRegions(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  threshold: number,
): Region[] {
  const minFill = w * 0.05;
  const regions: Region[] = [];
  let inRegion = false;
  let start = 0;

  for (let y = 0; y <= h; y++) {
    let count = 0;
    if (y < h) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const b =
          0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        if (b <= threshold && data[idx + 3] >= 128) count++;
      }
    }
    const filled = count >= minFill;
    if (filled && !inRegion) {
      inRegion = true;
      start = y;
    } else if (!filled && inRegion) {
      inRegion = false;
      if (y - start >= h * 0.05) {
        regions.push({
          yStart: start,
          yEnd: y - 1,
          centerY: (start + y - 1) / 2,
        });
      }
    }
  }

  // Sort by proximity to image center
  const mid = h / 2;
  regions.sort(
    (a, b) => Math.abs(a.centerY - mid) - Math.abs(b.centerY - mid),
  );
  return regions;
}

/**
 * Load a barrel product image, isolate one barrel, remove background,
 * and apply a color tint for overlay comparison.
 */
export async function processBarrelImage(
  imageUrl: string,
  tintColor?: [number, number, number],
  tintStrength = 0.3,
): Promise<ProcessedBarrelImage | null> {
  try {
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) return null;

    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);

    const maxWidth = 800;
    const scale = Math.min(1, maxWidth / bitmap.width);
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const imageData = ctx.getImageData(0, 0, w, h);
    const { data } = imageData;

    // Use Otsu for barrel region detection
    const otsuThreshold = computeOtsu(data, w * h);
    const regions = detectRegions(data, w, h, otsuThreshold);
    if (regions.length === 0) return null;

    const target = regions[0];

    // Find horizontal bounds within the target barrel region
    let minX = w;
    let maxX = 0;
    for (let y = target.yStart; y <= target.yEnd; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const b =
          0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        if (b <= otsuThreshold && data[idx + 3] >= 128) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
    }
    if (minX >= maxX) return null;

    // Crop with padding
    const pad = 4;
    const cropX = Math.max(0, minX - pad);
    const cropY = Math.max(0, target.yStart - pad);
    const cropW = Math.min(w, maxX + pad + 1) - cropX;
    const cropH = Math.min(h, target.yEnd + pad + 1) - cropY;

    // Create output canvas with the cropped barrel
    const out = document.createElement('canvas');
    out.width = cropW;
    out.height = cropH;
    const outCtx = out.getContext('2d');
    if (!outCtx) return null;

    outCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    // Remove white background with anti-aliased edges + apply tint
    const BG_THRESHOLD = 240; // pure white background
    const EDGE_WIDTH = 15; // smooth transition zone
    const outData = outCtx.getImageData(0, 0, cropW, cropH);
    const od = outData.data;

    for (let i = 0; i < od.length; i += 4) {
      const brightness =
        0.299 * od[i] + 0.587 * od[i + 1] + 0.114 * od[i + 2];

      if (brightness > BG_THRESHOLD) {
        // Fully transparent background
        od[i + 3] = 0;
      } else if (brightness > BG_THRESHOLD - EDGE_WIDTH) {
        // Anti-aliased edge: smooth transition
        const alpha = Math.round(
          255 * (BG_THRESHOLD - brightness) / EDGE_WIDTH,
        );
        od[i + 3] = Math.min(od[i + 3], alpha);
      }

      // Apply color tint to visible pixels
      if (od[i + 3] > 0 && tintColor) {
        const t = tintStrength;
        od[i] = Math.round(od[i] * (1 - t) + tintColor[0] * t);
        od[i + 1] = Math.round(od[i + 1] * (1 - t) + tintColor[1] * t);
        od[i + 2] = Math.round(od[i + 2] * (1 - t) + tintColor[2] * t);
      }
    }

    outCtx.putImageData(outData, 0, 0);

    return {
      dataUrl: out.toDataURL('image/png'),
      widthPx: cropW,
      heightPx: cropH,
    };
  } catch {
    return null;
  }
}

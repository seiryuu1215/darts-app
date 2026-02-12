'use client';

import { useState, useEffect } from 'react';
import type { BarrelProduct, BarrelContour } from '@/types';
import { loadImageAsCanvas } from '@/lib/barrel-image-loader';
import { extractContourFromImageData, normalizeContourToMm } from '@/lib/barrel-contour';

// Module-level cache: imageUrl → contour (or null if extraction failed)
const contourCache = new Map<string, BarrelContour | null>();

export function useBarrelContour(barrel: BarrelProduct): {
  contour: BarrelContour | null;
  loading: boolean;
} {
  const [contour, setContour] = useState<BarrelContour | null>(null);
  const [loading, setLoading] = useState(false);

  const imageUrl = barrel.imageUrl;
  const length = barrel.length;
  const maxDiameter = barrel.maxDiameter;

  useEffect(() => {
    if (!imageUrl || !length || !maxDiameter) {
      setContour(null);
      setLoading(false);
      return;
    }

    // Check cache
    if (contourCache.has(imageUrl)) {
      setContour(contourCache.get(imageUrl) ?? null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const imageData = await loadImageAsCanvas(imageUrl);
        if (cancelled) return;

        if (!imageData) {
          contourCache.set(imageUrl, null);
          setContour(null);
          setLoading(false);
          return;
        }

        const raw = extractContourFromImageData(imageData);
        if (cancelled) return;

        if (!raw) {
          contourCache.set(imageUrl, null);
          setContour(null);
          setLoading(false);
          return;
        }

        const normalized = normalizeContourToMm(raw, length, maxDiameter);
        if (cancelled) return;

        contourCache.set(imageUrl, normalized);
        setContour(normalized);
      } catch {
        if (!cancelled) {
          contourCache.set(imageUrl!, null);
          setContour(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [imageUrl, length, maxDiameter]);

  return { contour, loading };
}

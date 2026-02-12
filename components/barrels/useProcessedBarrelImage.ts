'use client';

import { useState, useEffect } from 'react';
import type { BarrelProduct } from '@/types';
import { processBarrelImage, type ProcessedBarrelImage } from '@/lib/barrel-image-processor';

const cache = new Map<string, ProcessedBarrelImage | null>();

export function useProcessedBarrelImage(
  barrel: BarrelProduct,
  tintColor?: [number, number, number],
): { image: ProcessedBarrelImage | null; loading: boolean } {
  const [image, setImage] = useState<ProcessedBarrelImage | null>(null);
  const [loading, setLoading] = useState(false);

  const imageUrl = barrel.imageUrl;
  const cacheKey = imageUrl ? `${imageUrl}:${tintColor?.join(',') ?? 'none'}` : '';

  useEffect(() => {
    if (!imageUrl) {
      setImage(null);
      setLoading(false);
      return;
    }

    if (cache.has(cacheKey)) {
      setImage(cache.get(cacheKey) ?? null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const result = await processBarrelImage(imageUrl, tintColor);
        if (!cancelled) {
          cache.set(cacheKey, result);
          setImage(result);
        }
      } catch {
        if (!cancelled) {
          cache.set(cacheKey, null);
          setImage(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [imageUrl, cacheKey]);

  return { image, loading };
}

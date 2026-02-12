/**
 * Load an image from a URL via the proxy API and return its pixel data.
 * Resizes to maxWidth for performance.
 */
export async function loadImageAsCanvas(
  imageUrl: string,
  maxWidth = 800,
): Promise<ImageData | null> {
  try {
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) return null;

    const blob = await res.blob();

    // Use createImageBitmap (widely supported in modern browsers)
    const bitmap = await createImageBitmap(blob);

    const scale = Math.min(1, maxWidth / bitmap.width);
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    // Try OffscreenCanvas first, fallback to document.createElement
    let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;

    if (typeof OffscreenCanvas !== 'undefined') {
      const offscreen = new OffscreenCanvas(w, h);
      ctx = offscreen.getContext('2d');
    }

    if (!ctx && typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      ctx = canvas.getContext('2d');
    }

    if (!ctx) return null;

    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    return ctx.getImageData(0, 0, w, h);
  } catch {
    return null;
  }
}

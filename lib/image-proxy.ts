/**
 * Resilient image fetching with fallback proxies.
 * Primary: own /api/proxy-image (works locally, may fail on Vercel if target blocks datacenter IPs)
 * Fallback: wsrv.nl (free CORS-enabled image proxy CDN)
 */

/** Build proxy URL — tries own proxy first, wsrv.nl as fallback */
function buildProxyUrls(imageUrl: string): string[] {
  return [
    `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`,
    `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}&n=-1`,
  ];
}

/** Fetch an image blob with automatic fallback between proxies */
export async function fetchImageWithFallback(imageUrl: string): Promise<Blob | null> {
  const urls = buildProxyUrls(imageUrl);

  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const blob = await res.blob();
        if (blob.size > 0) return blob;
      }
    } catch {
      // Try next proxy
    }
  }

  return null;
}

/** Get a displayable image URL with fallback (for <img> src) */
export function getProxyImageUrl(imageUrl: string): string {
  // For display, wsrv.nl is more reliable on Vercel
  return `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}&n=-1`;
}

/** Normalize barrel image URL and proxy through wsrv.nl for reliable display */
export function getBarrelImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  let url = imageUrl;
  // Protocol-relative → HTTPS
  if (url.startsWith('//')) {
    url = `https:${url}`;
  }
  // Relative path → absolute dartshive URL
  if (url.startsWith('/')) {
    url = `https://www.dartshive.jp${url}`;
  }
  // HTTP → HTTPS
  url = url.replace(/^http:\/\//, 'https://');
  // Proxy through wsrv.nl to avoid hotlinking / CORS issues
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&n=-1`;
}

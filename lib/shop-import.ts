/**
 * ショップインポート共有ライブラリ
 *
 * ダーツライブサーチからのスクレイピングロジック。
 * スクリプト (scripts/add-multi-line-shops.ts) と APIルート (api/shops/import-by-line)
 * の両方で使用される。
 */

import { ALLOWED_PREFECTURES } from '@/lib/line-stations';

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 駅名でダーツライブサーチを検索し、ショップのenc_idリストを返す
 */
export async function searchShopsByStation(station: string): Promise<string[]> {
  const url = `https://search.dartslive.com/jp/shops/?freeword=${encodeURIComponent(station)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DartsApp/1.0)' },
  });
  if (!res.ok) return [];
  const html = await res.text();
  const matches = html.matchAll(/href="\/jp\/shop\/([a-f0-9]+)"/g);
  const ids = new Set<string>();
  for (const m of matches) ids.add(m[1]);
  return [...ids];
}

export interface ShopDetailResult {
  name: string;
  address: string;
  nearestStation: string;
  imageUrl: string | null;
  machineCount: { dl2: number; dl3: number } | null;
  tags: string[];
}

/**
 * ショップ詳細ページ + shop-summery API からデータ取得
 */
export async function fetchShopDetails(shopEncId: string): Promise<ShopDetailResult | null> {
  const shopUrl = `https://search.dartslive.com/jp/shop/${shopEncId}`;

  const htmlRes = await fetch(shopUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DartsApp/1.0)', Accept: 'text/html' },
  });
  if (!htmlRes.ok) return null;
  const html = await htmlRes.text();

  // OGP
  const ogTitle =
    html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i)?.[1] ??
    html.match(/<meta\s+content="([^"]*)"\s+property="og:title"/i)?.[1] ??
    '';
  const ogImage =
    html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/i)?.[1] ??
    html.match(/<meta\s+content="([^"]*)"\s+property="og:image"/i)?.[1] ??
    '';

  const titleParts = ogTitle.split('|').map((s: string) => s.trim());
  const name = titleParts[0] || '';
  if (!name) return null;

  // Address
  let address = '';
  const addressRegex = /<p[\s\S]*?class="[^"]*address[^"]*"[\s\S]*?>([^<]+)<\/p>/gi;
  let addrMatch;
  while ((addrMatch = addressRegex.exec(html)) !== null) {
    const val = addrMatch[1].trim();
    if (val) {
      address = val;
      break;
    }
  }

  // Station
  const stationMatch = html.match(/<label>最寄り駅<\/label>[\s\S]*?<p[^>]*>([^<]+)/i);
  const nearestStation = stationMatch?.[1]?.trim() ?? '';

  // Tags
  const tags: string[] = [];
  try {
    const optionsMatch = html.match(/const\s+options\s*=\s*"(\{[\s\S]*?\})"/);
    if (optionsMatch) {
      const raw = optionsMatch[1]
        .replace(/\\u([0-9a-fA-F]{4})/g, (_: string, hex: string) =>
          String.fromCharCode(parseInt(hex, 16)),
        )
        .replace(/'/g, '"')
        .replace(/True/g, 'true')
        .replace(/False/g, 'false')
        .replace(/None/g, 'null');
      const options = JSON.parse(raw);
      const groups = options?.optionGroup?.optionGroupList;
      if (Array.isArray(groups)) {
        for (const group of groups) {
          if (Array.isArray(group?.optionList)) {
            for (const opt of group.optionList) {
              if (opt?.comment) tags.push(opt.comment);
            }
          }
        }
      }
    }
  } catch {
    /* ignore */
  }

  // Machine count
  let machineCount: { dl2: number; dl3: number } | null = null;
  let apiStationName = '';
  try {
    const summaryRes = await fetch(
      `https://search.dartslive.com/shop/shop-summery/?country_code=jp&shop_enc_id=${shopEncId}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DartsApp/1.0)' } },
    );
    if (summaryRes.ok) {
      const summary = await summaryRes.json();
      const machine = summary?.shop?.busyMachine?.machine;
      if (machine) {
        machineCount = { dl2: machine.dl2num ?? 0, dl3: machine.dl3num ?? 0 };
      }
      if (summary?.shop?.nearestStation?.nearestStationName) {
        apiStationName = summary.shop.nearestStation.nearestStationName;
      }
    }
  } catch {
    /* ignore */
  }

  const imageUrl = ogImage ? `/api/proxy-image?url=${encodeURIComponent(ogImage)}` : null;

  return {
    name,
    address,
    nearestStation: nearestStation || apiStationName,
    imageUrl,
    machineCount,
    tags,
  };
}

/**
 * 住所が許可された都道府県に含まれるか判定
 */
export function isAllowedPrefecture(address: string): boolean {
  if (!address) return true;
  return ALLOWED_PREFECTURES.some((pref) => address.includes(pref));
}

/**
 * 配列を指定サイズのチャンクに分けて並行処理（チャンク間にディレイ）
 */
export async function processInChunks<T, R>(
  items: T[],
  chunkSize: number,
  delayMs: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(chunk.map(fn));
    results.push(...chunkResults);
    if (i + chunkSize < items.length) {
      await sleep(delayMs);
    }
  }
  return results;
}

export interface ImportResult {
  lineName: string;
  stationsSearched: number;
  shopsFound: number;
  shopsSaved: number;
  shopsSkipped: number;
  errors: number;
}

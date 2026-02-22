import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, withAuth } from '@/lib/api-middleware';

async function handler(req: NextRequest) {
  const { url } = await req.json();

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // DARTSLIVEドメインのみ許可（SSRF対策）
  if (!parsedUrl.hostname.endsWith('dartslive.com')) {
    return NextResponse.json({ error: 'Only dartslive.com URLs are allowed' }, { status: 400 });
  }

  // Extract shop_enc_id and country_code from URL
  // e.g. /jp/shop/1a964311b027e7e70d9b047a20a7ba1e
  const pathMatch = parsedUrl.pathname.match(/\/(\w{2})\/shop\/([a-f0-9]+)/);
  const countryCode = pathMatch?.[1] ?? 'jp';
  const shopEncId = pathMatch?.[2] ?? '';

  // Fetch HTML for OGP + address + station
  const htmlRes = await fetch(parsedUrl.toString(), {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DartsApp/1.0)', Accept: 'text/html' },
    signal: AbortSignal.timeout(10000),
  });

  if (!htmlRes.ok) {
    return NextResponse.json({
      name: '',
      address: '',
      nearestStation: '',
      imageUrl: null,
      machineCount: null,
      tags: [],
    });
  }

  const html = await htmlRes.text();

  // OGP: allow whitespace/newlines between attribute and content
  const ogTitle =
    html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i)?.[1] ??
    html.match(/<meta\s+content="([^"]*)"\s+property="og:title"/i)?.[1] ??
    '';

  const ogImage =
    html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/i)?.[1] ??
    html.match(/<meta\s+content="([^"]*)"\s+property="og:image"/i)?.[1] ??
    '';

  // Parse shop name from og:title: "店名 | 県名 市名 | ダーツバー検索..."
  const titleParts = ogTitle.split('|').map((s: string) => s.trim());
  const name = titleParts[0] || '';

  // Address: find <p> with class containing "address" that has non-empty content
  // HTML has two: one with address text, one empty. Match the non-empty one.
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

  // Nearest station: <label>最寄り駅</label> ... </td>\n<td ...>\n<p ...>東京メトロ東西線 行徳駅 249m</p>
  const stationMatch = html.match(/<label>最寄り駅<\/label>[\s\S]*?<p[^>]*>([^<]+)/i);
  const nearestStation = stationMatch?.[1]?.trim() ?? '';

  // Machine count + station name from internal API
  let machineCount: { dl2: number; dl3: number } | null = null;
  let apiStationName = '';
  if (shopEncId) {
    try {
      const summaryRes = await fetch(
        `https://search.dartslive.com/shop/shop-summery/?country_code=${countryCode}&shop_enc_id=${shopEncId}`,
        {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DartsApp/1.0)' },
          signal: AbortSignal.timeout(5000),
        },
      );
      if (summaryRes.ok) {
        const summary = await summaryRes.json();
        const machine = summary?.shop?.busyMachine?.machine;
        if (machine) {
          machineCount = {
            dl2: machine.dl2num ?? 0,
            dl3: machine.dl3num ?? 0,
          };
        }
        if (summary?.shop?.nearestStation?.nearestStationName) {
          apiStationName = summary.shop.nearestStation.nearestStationName;
        }
      }
    } catch {
      // ignore — machine count is optional
    }
  }

  // Extract tags from embedded `const options = "..."` JSON in HTML
  // This is more reliable than matching <span> tags which may differ by region
  const tags: string[] = [];
  try {
    const optionsMatch = html.match(/const\s+options\s*=\s*"(\{[\s\S]*?\})"/);
    if (optionsMatch) {
      // Decode unicode escapes and convert Python-style to JSON
      const raw = optionsMatch[1]
        .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
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
    // Fallback: try matching <span> tags directly
    const knownTags = [
      '分煙',
      '禁煙',
      '喫煙可',
      '投げ放題',
      'インストラクター在籍',
      'グッズ販売あり',
      'スポーツ観戦あり',
      'パーティグッズあり',
      'フードが充実',
      'お酒が充実',
      '予約可',
      '貸切可',
      'Wi-Fi完備',
      '朝まで営業',
    ];
    for (const tag of knownTags) {
      if (html.includes(`<span>${tag}</span>`)) tags.push(tag);
    }
  }
  // Machine count is in the machineCount field — not duplicated in tags

  // Proxy external images through our API to avoid CORS/content-type issues
  const imageUrl = ogImage ? `/api/proxy-image?url=${encodeURIComponent(ogImage)}` : null;

  return NextResponse.json({
    name,
    address,
    nearestStation: nearestStation || apiStationName,
    imageUrl,
    machineCount,
    tags,
  });
}

export const POST = withErrorHandler(withAuth(handler), 'shops/fetch-url');

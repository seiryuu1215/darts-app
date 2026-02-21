import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
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

    const isDartsLiveSearch = parsedUrl.hostname.includes('dartslive.com');

    // DARTSLIVE SEARCH: HTML + internal API
    if (isDartsLiveSearch) {
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
        return NextResponse.json({ name: '', address: '', nearestStation: '', imageUrl: null, machineCount: null });
      }

      const html = await htmlRes.text();

      // OGP: allow whitespace/newlines between attribute and content
      const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i)?.[1]
        ?? html.match(/<meta\s+content="([^"]*)"\s+property="og:title"/i)?.[1]
        ?? '';

      const ogImage = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/i)?.[1]
        ?? html.match(/<meta\s+content="([^"]*)"\s+property="og:image"/i)?.[1]
        ?? '';

      // Parse shop name from og:title: "店名 | 県名 市名 | ダーツバー検索..."
      const titleParts = ogTitle.split('|').map((s: string) => s.trim());
      const name = titleParts[0] || '';

      // Address: <label>住所</label> ... <p\n  class="address ..."\n>千葉県...</p>
      // The <p> tag has class="address" but may span multiple lines
      const addressMatch = html.match(/<label>住所<\/label>[\s\S]*?<p[\s\S]*?class="[^"]*address[^"]*"[\s\S]*?>([^<]+)/i);
      const address = addressMatch?.[1]?.trim() ?? '';

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

      return NextResponse.json({
        name,
        address,
        nearestStation: nearestStation || apiStationName,
        imageUrl: ogImage || null,
        machineCount,
      });
    }

    // Non-DARTSLIVE URLs: extract OGP only
    const res = await fetch(parsedUrl.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DartsApp/1.0)', Accept: 'text/html' },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ name: '', address: '', nearestStation: '', imageUrl: null, machineCount: null });
    }

    const html = await res.text();

    const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i)?.[1]
      ?? html.match(/<meta\s+content="([^"]*)"\s+property="og:title"/i)?.[1]
      ?? html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]
      ?? '';

    const ogImage = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/i)?.[1]
      ?? html.match(/<meta\s+content="([^"]*)"\s+property="og:image"/i)?.[1]
      ?? '';

    return NextResponse.json({
      name: ogTitle.trim(),
      address: '',
      nearestStation: '',
      imageUrl: ogImage || null,
      machineCount: null,
    });
  } catch {
    return NextResponse.json(
      { name: '', address: '', nearestStation: '', imageUrl: null, machineCount: null },
    );
  }
}

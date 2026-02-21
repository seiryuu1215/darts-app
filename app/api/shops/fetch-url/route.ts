import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const res = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DartsApp/1.0)',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 502 });
    }

    const html = await res.text();

    // Extract OGP tags via regex
    const ogTitle = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]*?)"\s*\/?>/i)?.[1]
      ?? html.match(/<meta\s+content="([^"]*?)"\s+(?:property|name)="og:title"\s*\/?>/i)?.[1]
      ?? '';

    const ogImage = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]*?)"\s*\/?>/i)?.[1]
      ?? html.match(/<meta\s+content="([^"]*?)"\s+(?:property|name)="og:image"\s*\/?>/i)?.[1]
      ?? '';

    const isDartsLiveSearch = parsedUrl.hostname.includes('dartslive.com');

    let name = ogTitle;
    let address = '';
    let nearestStation = '';

    if (isDartsLiveSearch) {
      // Parse og:title: "店名 | 県名 市名 | ダーツバー検索 DARTSLIVE SEARCH"
      const titleParts = ogTitle.split('|').map((s: string) => s.trim());
      if (titleParts.length >= 1) {
        name = titleParts[0];
      }

      // Extract address from HTML body
      // Look for address pattern in the page content
      const addressMatch = html.match(/〒[\d\-]+\s*<br\s*\/?>\s*([^<]+)/i)
        ?? html.match(/<p[^>]*class="[^"]*address[^"]*"[^>]*>([^<]+)/i)
        ?? html.match(/住所[：:]\s*([^<\n]+)/i);

      if (addressMatch) {
        address = addressMatch[1].trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      } else {
        // Try to find address by looking for Japanese prefecture patterns
        const prefectureMatch = html.match(/((?:北海道|青森県|岩手県|宮城県|秋田県|山形県|福島県|茨城県|栃木県|群馬県|埼玉県|千葉県|東京都|神奈川県|新潟県|富山県|石川県|福井県|山梨県|長野県|岐阜県|静岡県|愛知県|三重県|滋賀県|京都府|大阪府|兵庫県|奈良県|和歌山県|鳥取県|島根県|岡山県|広島県|山口県|徳島県|香川県|愛媛県|高知県|福岡県|佐賀県|長崎県|熊本県|大分県|宮崎県|鹿児島県|沖縄県)[^\s<]{2,30})/);
        if (prefectureMatch) {
          address = prefectureMatch[1].trim();
        }
      }

      // Extract nearest station
      const stationMatch = html.match(/((?:JR|東京メトロ|都営|京急|京王|小田急|東急|西武|東武|相鉄|名鉄|近鉄|阪急|阪神|南海|京阪|地下鉄|モノレール|ゆりかもめ|りんかい線|つくばエクスプレス|東京臨海高速鉄道|新交通|市営|北総|千葉都市|埼玉高速|東葉高速)[^\s<]*?(?:線|ライン)\s*[^\s<]*?駅)/i)
        ?? html.match(/最寄[り駅：:]+\s*([^<\n]+)/i)
        ?? html.match(/([\u4e00-\u9fff]{2,10}駅)/);

      if (stationMatch) {
        nearestStation = stationMatch[1].trim();
      }
    } else {
      // Non-DARTSLIVE URLs: just extract og:title
      const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (!name && titleTag) {
        name = titleTag[1].trim();
      }
    }

    return NextResponse.json({
      name: name || '',
      address: address || '',
      nearestStation: nearestStation || '',
      imageUrl: ogImage || null,
    });
  } catch {
    return NextResponse.json(
      { name: '', address: '', nearestStation: '', imageUrl: null },
    );
  }
}

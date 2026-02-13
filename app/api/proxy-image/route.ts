import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOSTS = [
  'dartshive.jp',
  'www.dartshive.jp',
  'image.dartshive.jp',
  'firebasestorage.googleapis.com',
];

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'URLが必要です' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: '無効なURLです' }, { status: 400 });
  }

  if (parsed.protocol !== 'https:') {
    return NextResponse.json({ error: '許可されていないプロトコルです' }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.some((h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`))) {
    return NextResponse.json({ error: '許可されていないドメインです' }, { status: 403 });
  }

  const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: '画像の取得に失敗しました' }, { status: 502 });
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    if (!VALID_IMAGE_TYPES.some((t) => contentType.includes(t))) {
      return NextResponse.json({ error: '画像形式が不正です' }, { status: 400 });
    }

    const contentLength = parseInt(res.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_SIZE) {
      return NextResponse.json({ error: 'ファイルサイズが大きすぎます' }, { status: 413 });
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_SIZE) {
      return NextResponse.json({ error: 'ファイルサイズが大きすぎます' }, { status: 413 });
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({ error: '画像の取得に失敗しました' }, { status: 500 });
  }
}

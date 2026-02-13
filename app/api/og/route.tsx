import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const OG_ALLOWED_HOSTS = ['firebasestorage.googleapis.com'];

function isAllowedImageUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return OG_ALLOWED_HOSTS.some((h) => parsed.hostname === h);
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get('title') || 'Darts Lab';
  const barrel = searchParams.get('barrel') || '';
  const weight = searchParams.get('weight') || '';
  const user = searchParams.get('user') || '';
  const rawImageUrl = searchParams.get('image') || '';
  const imageUrl = isAllowedImageUrl(rawImageUrl) ? rawImageUrl : '';

  return new ImageResponse(
    <div
      style={{
        width: '1200px',
        height: '630px',
        display: 'flex',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: '#fff',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}
    >
      {/* Left: Image area */}
      {imageUrl && (
        <div
          style={{
            width: '480px',
            height: '630px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <img src={imageUrl} alt="" width={460} height={590} style={{ objectFit: 'contain' }} />
        </div>
      )}

      {/* Right: Info area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '48px 48px 48px 24px',
          gap: '16px',
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: '44px',
            fontWeight: 'bold',
            lineHeight: 1.2,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            overflow: 'hidden',
          }}
        >
          {title}
        </div>

        {/* Barrel info */}
        {barrel && (
          <div
            style={{
              fontSize: '28px',
              color: '#90caf9',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span>{barrel}</span>
            {weight && (
              <span
                style={{
                  fontSize: '22px',
                  background: '#1976d2',
                  padding: '4px 12px',
                  borderRadius: '20px',
                }}
              >
                {weight}g
              </span>
            )}
          </div>
        )}

        {/* User */}
        {user && <div style={{ fontSize: '22px', color: '#aaa', marginTop: '8px' }}>by {user}</div>}

        {/* Branding */}
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            right: '48px',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1976d2',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '28px' }}>🎯</span>
          Darts Lab
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}

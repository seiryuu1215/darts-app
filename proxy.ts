import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://js.stripe.com https://platform.twitter.com https://va.vercel-scripts.com`,
    "style-src 'self' 'unsafe-inline'",
    [
      "img-src 'self' data: blob:",
      'https://firebasestorage.googleapis.com',
      'https://storage.googleapis.com',
      'https://dartshive.jp',
      'https://*.dartshive.jp',
      'https://wsrv.nl',
      'https://api.dicebear.com',
      'https://pbs.twimg.com',
      'https://platform.twitter.com',
      'https://makeshop-multi-images.akamaized.net',
      'https://*.stripe.com',
    ].join(' '),
    "font-src 'self' https://fonts.gstatic.com",
    [
      "connect-src 'self'",
      'https://*.googleapis.com',
      'https://*.firebaseio.com',
      'wss://*.firebaseio.com',
      'https://*.firebaseapp.com',
      'https://*.stripe.com',
      'https://*.sentry.io',
      'https://*.ingest.sentry.io',
      'https://px.a8.net',
      'https://va.vercel-scripts.com',
      'https://vitals.vercel-insights.com',
    ].join(' '),
    "frame-src 'self' https://js.stripe.com https://*.firebaseapp.com https://platform.twitter.com https://syndication.twitter.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon\\.ico|sw\\.js|manifest\\.json|icons/).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};

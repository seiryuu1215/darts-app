import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://platform.twitter.com`,
    "style-src 'self' 'unsafe-inline'",
    [
      "img-src 'self' data: blob:",
      'https://firebasestorage.googleapis.com',
      'https://storage.googleapis.com',
      'https://*.dartshive.jp',
      'https://wsrv.nl',
      'https://api.dicebear.com',
      'https://pbs.twimg.com',
      'https://platform.twitter.com',
    ].join(' '),
    "font-src 'self'",
    [
      "connect-src 'self'",
      'https://*.googleapis.com',
      'https://*.firebaseio.com',
      'https://*.firebaseapp.com',
      'https://*.sentry.io',
      'https://*.ingest.sentry.io',
    ].join(' '),
    "frame-src 'self' https://platform.twitter.com https://syndication.twitter.com",
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

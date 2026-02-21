import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import * as Sentry from '@sentry/nextjs';
import type { UserRole } from '@/types';
import { checkRedisRateLimit } from '@/lib/rate-limit';

export interface AuthContext {
  userId: string;
  role: UserRole;
  email: string | null;
}

type HandlerWithAuth = (req: NextRequest, ctx: AuthContext) => Promise<NextResponse>;
type Handler = (req: NextRequest) => Promise<NextResponse>;

// ──────────────────────────────
// Rate Limiter (in-memory fallback + Upstash Redis)
// ──────────────────────────────
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 60; // requests per window

function getRateLimitKey(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

function checkInMemoryRateLimit(key: string): NextResponse | null {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)) } },
    );
  }
  return null;
}

export async function checkRateLimit(req: NextRequest): Promise<NextResponse | null> {
  const key = getRateLimitKey(req);

  // Upstash Redis を優先、未設定時はin-memoryフォールバック
  const redisResult = await checkRedisRateLimit(key);
  if (redisResult) {
    if (!redisResult.success) {
      const retryAfter = Math.ceil((redisResult.reset - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(Math.max(retryAfter, 1)) } },
      );
    }
    return null;
  }

  return checkInMemoryRateLimit(key);
}

// Cleanup stale entries every 5 minutes (in-memory fallback用)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
      if (now > entry.resetAt) rateLimitStore.delete(key);
    }
  }, 5 * 60_000);
}

/**
 * エラーハンドリングラッパー — try-catch + console.error + 500レスポンス
 */
export function withErrorHandler(handler: Handler, label: string): Handler {
  return async (req: NextRequest) => {
    const rateLimited = await checkRateLimit(req);
    if (rateLimited) return rateLimited;
    try {
      return await handler(req);
    } catch (error) {
      console.error(`${label}:`, error);
      Sentry.captureException(error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  };
}

/**
 * 認証ラッパー — getServerSession + 401チェック → AuthContext提供
 */
export function withAuth(handler: HandlerWithAuth): Handler {
  return async (req: NextRequest) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未ログインです' }, { status: 401 });
    }
    return handler(req, {
      userId: session.user.id,
      role: session.user.role || 'general',
      email: session.user.email || null,
    });
  };
}

/**
 * 管理者ラッパー — withAuth + Firestore admin roleチェック + 403
 */
export function withAdmin(handler: HandlerWithAuth): Handler {
  return withAuth(async (req, ctx) => {
    const adminDoc = await adminDb.doc(`users/${ctx.userId}`).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }
    return handler(req, { ...ctx, role: 'admin' });
  });
}

/**
 * 権限チェックラッパー — withAuth + 権限関数チェック + 403
 */
export function withPermission(
  checkFn: (role: UserRole | undefined) => boolean,
  errorMsg: string,
  handler: HandlerWithAuth,
): Handler {
  return withAuth(async (req, ctx) => {
    if (!checkFn(ctx.role)) {
      return NextResponse.json({ error: errorMsg }, { status: 403 });
    }
    return handler(req, ctx);
  });
}

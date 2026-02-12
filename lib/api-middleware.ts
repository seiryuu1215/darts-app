import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import * as Sentry from '@sentry/nextjs';
import type { UserRole } from '@/types';

export interface AuthContext {
  userId: string;
  role: UserRole;
  email: string | null;
}

type HandlerWithAuth = (req: NextRequest, ctx: AuthContext) => Promise<NextResponse>;
type Handler = (req: NextRequest) => Promise<NextResponse>;

/**
 * エラーハンドリングラッパー — try-catch + console.error + 500レスポンス
 */
export function withErrorHandler(handler: Handler, label: string): Handler {
  return async (req: NextRequest) => {
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

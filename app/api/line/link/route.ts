import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { randomInt } from 'crypto';
import { withAuth, withErrorHandler } from '@/lib/api-middleware';

export const POST = withErrorHandler(
  withAuth(async (_req, { userId }) => {
    // 8桁暗号学的安全ランダムコード生成
    const code = String(randomInt(10000000, 100000000));

    // 10分後の有効期限
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await adminDb.doc(`lineLinkCodes/${code}`).set({
      userId,
      expiresAt,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ code });
  }),
  'LINE link error',
);

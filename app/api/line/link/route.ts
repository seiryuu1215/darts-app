import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { randomInt } from 'crypto';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未ログインです' }, { status: 401 });
  }

  // 8桁暗号学的安全ランダムコード生成
  const code = String(randomInt(10000000, 100000000));

  // 10分後の有効期限
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await adminDb.doc(`lineLinkCodes/${code}`).set({
    userId: session.user.id,
    expiresAt,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ code });
}

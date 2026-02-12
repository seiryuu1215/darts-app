import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { encrypt } from '@/lib/crypto';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未ログインです' }, { status: 401 });
  }

  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'メールアドレスとパスワードを入力してください' }, { status: 400 });
  }

  await adminDb.doc(`users/${session.user.id}`).update({
    dlCredentialsEncrypted: {
      email: encrypt(email),
      password: encrypt(password),
    },
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未ログインです' }, { status: 401 });
  }

  await adminDb.doc(`users/${session.user.id}`).update({
    dlCredentialsEncrypted: FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { encrypt } from '@/lib/crypto';
import { z } from 'zod';
import { withAuth, withErrorHandler } from '@/lib/api-middleware';

const credentialsSchema = z.object({
  email: z.string().email().max(256),
  password: z.string().min(1).max(256),
});

export const POST = withErrorHandler(
  withAuth(async (request: NextRequest, { userId }) => {
    const body = await request.json();
    const parsed = credentialsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'メールアドレスとパスワードを正しく入力してください' },
        { status: 400 },
      );
    }
    const { email, password } = parsed.data;

    await adminDb.doc(`users/${userId}`).update({
      dlCredentialsEncrypted: {
        email: encrypt(email),
        password: encrypt(password),
      },
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  }),
  'Save DL credentials error',
);

export const DELETE = withErrorHandler(
  withAuth(async (_req, { userId }) => {
    await adminDb.doc(`users/${userId}`).update({
      dlCredentialsEncrypted: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  }),
  'Delete DL credentials error',
);

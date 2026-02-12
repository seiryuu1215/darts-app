import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '@/lib/firebase-admin';
import { withAuth, withErrorHandler } from '@/lib/api-middleware';

// adminDbをインポートすることでfirebase-adminの初期化を保証
void adminDb;

export const GET = withErrorHandler(
  withAuth(async (_req, { userId }) => {
    const customToken = await getAuth().createCustomToken(userId);
    return NextResponse.json({ token: customToken });
  }),
  'Custom token error',
);

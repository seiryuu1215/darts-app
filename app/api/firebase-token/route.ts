import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '@/lib/firebase-admin';

// adminDbをインポートすることでfirebase-adminの初期化を保証
void adminDb;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const customToken = await getAuth().createCustomToken(session.user.id);
    return NextResponse.json({ token: customToken });
  } catch (error) {
    console.error('Custom token error:', error);
    return NextResponse.json({ error: 'Token generation failed' }, { status: 500 });
  }
}

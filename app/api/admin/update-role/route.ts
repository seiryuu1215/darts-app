import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserRole } from '@/types';
import { authOptions } from '@/lib/auth';

const VALID_ROLES: UserRole[] = ['admin', 'pro', 'general'];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未認証' }, { status: 401 });
    }

    // 管理者チェック: Firestoreから直接確認
    const adminDoc = await getDoc(doc(db, 'users', session.user.id));
    if (!adminDoc.exists() || adminDoc.data().role !== 'admin') {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId と role は必須です' }, { status: 400 });
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: '無効なroleです' }, { status: 400 });
    }

    // 対象ユーザの存在確認
    const targetDoc = await getDoc(doc(db, 'users', userId));
    if (!targetDoc.exists()) {
      return NextResponse.json({ error: 'ユーザが見つかりません' }, { status: 404 });
    }

    await updateDoc(doc(db, 'users', userId), { role });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('権限変更エラー:', error);
    return NextResponse.json({ error: '権限変更に失敗しました' }, { status: 500 });
  }
}

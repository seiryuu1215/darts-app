import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { adminDb } from '@/lib/firebase-admin';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const updateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['admin', 'pro', 'general']),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未認証' }, { status: 401 });
    }

    // 管理者チェック: adminDb（サーバーサイド）で直接確認
    const adminDoc = await adminDb.doc(`users/${session.user.id}`).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: '入力が不正です', details: parsed.error.flatten() }, { status: 400 });
    }
    const { userId, role } = parsed.data;

    // 対象ユーザの存在確認
    const targetDoc = await adminDb.doc(`users/${userId}`).get();
    if (!targetDoc.exists) {
      return NextResponse.json({ error: 'ユーザが見つかりません' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { role };

    // 手動PRO設定時: subscriptionフィールドをクリア（webhookでダウングレードされないように）
    if (role === 'pro') {
      updateData.subscriptionId = null;
      updateData.subscriptionStatus = null;
    }

    await adminDb.doc(`users/${userId}`).update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('権限変更エラー:', error);
    return NextResponse.json({ error: '権限変更に失敗しました' }, { status: 500 });
  }
}

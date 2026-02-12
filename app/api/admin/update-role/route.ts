import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { z } from 'zod';
import { withAdmin, withErrorHandler } from '@/lib/api-middleware';

const updateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['admin', 'pro', 'general']),
});

export const POST = withErrorHandler(
  withAdmin(async (request: NextRequest) => {
    const body = await request.json();
    const parsed = updateRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: '入力が不正です', details: parsed.error.flatten() },
        { status: 400 },
      );
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
  }),
  '権限変更エラー',
);

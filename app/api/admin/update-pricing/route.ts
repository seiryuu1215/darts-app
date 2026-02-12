import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { adminDb } from '@/lib/firebase-admin';
import { authOptions } from '@/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';

const pricingSchema = z.object({
  proMonthlyPriceYen: z.number().int().min(0).optional(),
  proPromoPriceYen: z.number().int().min(0).optional(),
  proStripePriceId: z.string().min(1).optional(),
  proPromoStripePriceId: z.string().min(1).optional(),
  promoStartDate: z.string().nullable().optional(),
  promoEndDate: z.string().nullable().optional(),
  trialDays: z.number().int().min(0).max(90).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未認証' }, { status: 401 });
    }

    // 管理者チェック: adminDb（サーバーサイド）で確認
    const adminDoc = await adminDb.doc(`users/${session.user.id}`).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = pricingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: '入力が不正です', details: parsed.error.flatten() }, { status: 400 });
    }
    const {
      proMonthlyPriceYen,
      proPromoPriceYen,
      proStripePriceId,
      proPromoStripePriceId,
      promoStartDate,
      promoEndDate,
      trialDays,
    } = parsed.data;

    const updateData: Record<string, unknown> = {
      updatedBy: session.user.id,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (proMonthlyPriceYen !== undefined) updateData.proMonthlyPriceYen = proMonthlyPriceYen;
    if (proPromoPriceYen !== undefined) updateData.proPromoPriceYen = proPromoPriceYen;
    if (proStripePriceId !== undefined) updateData.proStripePriceId = proStripePriceId;
    if (proPromoStripePriceId !== undefined) updateData.proPromoStripePriceId = proPromoStripePriceId;
    if (trialDays !== undefined) updateData.trialDays = trialDays;

    if (promoStartDate) {
      updateData.promoStartDate = Timestamp.fromDate(new Date(promoStartDate));
    } else if (promoStartDate === null) {
      updateData.promoStartDate = null;
    }

    if (promoEndDate) {
      updateData.promoEndDate = Timestamp.fromDate(new Date(promoEndDate));
    } else if (promoEndDate === null) {
      updateData.promoEndDate = null;
    }

    await adminDb.doc('config/pricing').set(updateData, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Pricing update error:', error);
    return NextResponse.json({ error: '設定の更新に失敗しました' }, { status: 500 });
  }
}

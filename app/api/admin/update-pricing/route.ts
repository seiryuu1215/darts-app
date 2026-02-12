import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import { withAdmin, withErrorHandler } from '@/lib/api-middleware';

const pricingSchema = z.object({
  proMonthlyPriceYen: z.number().int().min(0).optional(),
  proPromoPriceYen: z.number().int().min(0).optional(),
  proStripePriceId: z.string().min(1).optional(),
  proPromoStripePriceId: z.string().min(1).optional(),
  promoStartDate: z.string().nullable().optional(),
  promoEndDate: z.string().nullable().optional(),
  trialDays: z.number().int().min(0).max(90).optional(),
});

export const POST = withErrorHandler(
  withAdmin(async (request: NextRequest, { userId }) => {
    const body = await request.json();
    const parsed = pricingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: '入力が不正です', details: parsed.error.flatten() },
        { status: 400 },
      );
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
      updatedBy: userId,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (proMonthlyPriceYen !== undefined) updateData.proMonthlyPriceYen = proMonthlyPriceYen;
    if (proPromoPriceYen !== undefined) updateData.proPromoPriceYen = proPromoPriceYen;
    if (proStripePriceId !== undefined) updateData.proStripePriceId = proStripePriceId;
    if (proPromoStripePriceId !== undefined)
      updateData.proPromoStripePriceId = proPromoStripePriceId;
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
  }),
  'Pricing update error',
);

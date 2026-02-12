import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const pricingDoc = await adminDb.doc('config/pricing').get();
    const pricing = pricingDoc.exists ? pricingDoc.data() : null;

    const price = pricing?.proMonthlyPriceYen ?? 500;
    const promoPrice = pricing?.proPromoPriceYen ?? 300;
    const trialDays = pricing?.trialDays ?? 7;

    // プロモ期間中か判定
    let isPromo = false;
    if (pricing) {
      const now = new Date();
      const promoStart = pricing.promoStartDate?.toDate?.();
      const promoEnd = pricing.promoEndDate?.toDate?.();
      if (promoStart && promoEnd && now >= promoStart && now <= promoEnd) {
        isPromo = true;
      }
    }

    return NextResponse.json({ price, promoPrice, isPromo, trialDays });
  } catch (err) {
    console.error('Pricing fetch error:', err);
    return NextResponse.json({ price: 500, promoPrice: 300, isPromo: false, trialDays: 7 });
  }
}

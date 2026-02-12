import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getStripe } from '@/lib/stripe';
import { isPro } from '@/lib/permissions';
import { withAuth, withErrorHandler } from '@/lib/api-middleware';

export const POST = withErrorHandler(
  withAuth(async (_req, { userId, role, email }) => {
    if (isPro(role)) {
      return NextResponse.json({ error: '既にPROプランです' }, { status: 400 });
    }

    const stripe = getStripe();

    // config/pricing からプロモ判定
    const pricingDoc = await adminDb.doc('config/pricing').get();
    const pricing = pricingDoc.exists ? pricingDoc.data() : null;
    let priceId = process.env.STRIPE_PRO_PRICE_ID!;
    let trialDays = 7;

    if (pricing) {
      trialDays = pricing.trialDays ?? 7;
      // プロモ期間中か判定
      const now = new Date();
      const promoStart = pricing.promoStartDate?.toDate?.();
      const promoEnd = pricing.promoEndDate?.toDate?.();
      if (promoStart && promoEnd && now >= promoStart && now <= promoEnd) {
        const promoId = pricing.proPromoStripePriceId || process.env.STRIPE_PRO_PROMO_PRICE_ID;
        if (promoId) priceId = promoId;
      }
    }

    // Stripe Customer 取得 or 作成
    const userDoc = await adminDb.doc(`users/${userId}`).get();
    const userData = userDoc.data();
    let customerId = userData?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email || undefined,
        metadata: { firebaseUid: userId },
      });
      customerId = customer.id;
      await adminDb.doc(`users/${userId}`).update({
        stripeCustomerId: customerId,
      });
    }

    // Checkout Session 作成
    const origin = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: trialDays,
        metadata: { firebaseUid: userId },
      },
      success_url: `${origin}/profile/subscription?success=1`,
      cancel_url: `${origin}/pricing?canceled=1`,
      metadata: { firebaseUid: userId },
    });

    return NextResponse.json({ url: checkoutSession.url });
  }),
  'Stripe checkout error',
);

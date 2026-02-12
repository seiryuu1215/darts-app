import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { getStripe } from '@/lib/stripe';
import { isPro } from '@/lib/permissions';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未ログインです' }, { status: 401 });
  }
  if (isPro(session.user.role)) {
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
  const userDoc = await adminDb.doc(`users/${session.user.id}`).get();
  const userData = userDoc.data();
  let customerId = userData?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email || undefined,
      metadata: { firebaseUid: session.user.id },
    });
    customerId = customer.id;
    await adminDb.doc(`users/${session.user.id}`).update({
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
      metadata: { firebaseUid: session.user.id },
    },
    success_url: `${origin}/profile/subscription?success=1`,
    cancel_url: `${origin}/pricing?canceled=1`,
    metadata: { firebaseUid: session.user.id },
  });

  return NextResponse.json({ url: checkoutSession.url });
}

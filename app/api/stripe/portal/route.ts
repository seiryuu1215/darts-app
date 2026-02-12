import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getStripe } from '@/lib/stripe';
import { withAuth, withErrorHandler } from '@/lib/api-middleware';

export const POST = withErrorHandler(
  withAuth(async (_req, { userId }) => {
    const userDoc = await adminDb.doc(`users/${userId}`).get();
    const customerId = userDoc.data()?.stripeCustomerId;

    if (!customerId) {
      return NextResponse.json({ error: 'Stripeカスタマーが見つかりません' }, { status: 400 });
    }

    const stripe = getStripe();
    const origin = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/profile/subscription`,
    });

    return NextResponse.json({ url: portalSession.url });
  }),
  'Stripe portal error',
);

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { getStripe } from '@/lib/stripe';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未ログインです' }, { status: 401 });
  }

  const userDoc = await adminDb.doc(`users/${session.user.id}`).get();
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
}

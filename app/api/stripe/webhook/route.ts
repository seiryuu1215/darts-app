import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getStripe } from '@/lib/stripe';
import { Timestamp } from 'firebase-admin/firestore';
import type Stripe from 'stripe';

export const maxDuration = 30;

/** Stripe v20+: current_period_end is on SubscriptionItem, not Subscription */
function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const item = subscription.items?.data?.[0];
  if (item?.current_period_end) {
    return new Date(item.current_period_end * 1000);
  }
  return null;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature') || '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // イベントID重複チェック（リプレイ攻撃対策）
  const eventRef = adminDb.doc(`stripeEvents/${event.id}`);
  const eventDoc = await eventRef.get();
  if (eventDoc.exists) {
    return NextResponse.json({ received: true }); // 冪等: 処理済み
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }

    // 処理済みイベントを記録（TTL: 72時間後に手動削除可能）
    await eventRef.set({
      type: event.type,
      processedAt: Timestamp.now(),
    });
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function getFirebaseUidFromCustomer(customerId: string): Promise<string | null> {
  const snap = await adminDb
    .collection('users')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return snap.docs[0].id;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const firebaseUid = session.metadata?.firebaseUid;
  if (!firebaseUid) return;

  const stripe = getStripe();
  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id;

  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const periodEnd = getSubscriptionPeriodEnd(subscription);

  await adminDb.doc(`users/${firebaseUid}`).update({
    role: 'pro',
    subscriptionId: subscription.id,
    subscriptionStatus: subscription.status,
    subscriptionCurrentPeriodEnd: periodEnd ? Timestamp.fromDate(periodEnd) : null,
    subscriptionTrialEnd: subscription.trial_end
      ? Timestamp.fromDate(new Date(subscription.trial_end * 1000))
      : null,
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;
  const firebaseUid = await getFirebaseUidFromCustomer(customerId);
  if (!firebaseUid) return;

  const userDoc = await adminDb.doc(`users/${firebaseUid}`).get();
  const userData = userDoc.data();

  // 手動PRO設定ユーザー（subscriptionId=null）はスキップ
  if (!userData?.subscriptionId) return;

  const periodEnd = getSubscriptionPeriodEnd(subscription);

  const updateData: Record<string, unknown> = {
    subscriptionStatus: subscription.status,
    subscriptionCurrentPeriodEnd: periodEnd ? Timestamp.fromDate(periodEnd) : null,
    subscriptionTrialEnd: subscription.trial_end
      ? Timestamp.fromDate(new Date(subscription.trial_end * 1000))
      : null,
  };

  // active/trialing → role=pro維持, それ以外 → role=general
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    updateData.role = 'pro';
  }

  await adminDb.doc(`users/${firebaseUid}`).update(updateData);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;
  const firebaseUid = await getFirebaseUidFromCustomer(customerId);
  if (!firebaseUid) return;

  const userDoc = await adminDb.doc(`users/${firebaseUid}`).get();
  const userData = userDoc.data();

  // 手動PRO設定ユーザー（subscriptionId=null）はダウングレードしない
  if (!userData?.subscriptionId) return;

  await adminDb.doc(`users/${firebaseUid}`).update({
    role: 'general',
    subscriptionStatus: 'canceled',
    subscriptionId: null,
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id;
  if (!customerId) return;

  const firebaseUid = await getFirebaseUidFromCustomer(customerId);
  if (!firebaseUid) return;

  await adminDb.doc(`users/${firebaseUid}`).update({
    subscriptionStatus: 'past_due',
  });
}

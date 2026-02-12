import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// --- Mocks ---

const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockGetDoc = vi.fn();
const mockGetCollection = vi.fn();

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    doc: vi.fn((path: string) => ({
      get: () => mockGetDoc(path),
      update: (data: unknown) => mockUpdate(path, data),
      set: (data: unknown) => mockSet(path, data),
    })),
    collection: vi.fn(() => ({
      where: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: () => mockGetCollection(),
        })),
      })),
    })),
  },
}));

const mockConstructEvent = vi.fn();
const mockRetrieveSubscription = vi.fn();

vi.mock('@/lib/stripe', () => ({
  getStripe: () => ({
    webhooks: {
      constructEvent: mockConstructEvent,
    },
    subscriptions: {
      retrieve: mockRetrieveSubscription,
    },
  }),
}));

import { POST } from '@/app/api/stripe/webhook/route';

function makeWebhookRequest(body = 'raw-body', signature = 'sig_test'): NextRequest {
  return new NextRequest('http://localhost:3000/api/stripe/webhook', {
    method: 'POST',
    body,
    headers: {
      'stripe-signature': signature,
    },
  });
}

describe('Stripe webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  });

  it('returns 500 when STRIPE_WEBHOOK_SECRET is not set', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const res = await POST(makeWebhookRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Server configuration error');
  });

  it('returns 400 when signature verification fails', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });
    const res = await POST(makeWebhookRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid signature');
  });

  it('returns received:true for duplicate events (idempotency)', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_duplicate',
      type: 'checkout.session.completed',
      data: { object: {} },
    });
    // stripeEvents doc exists → duplicate
    mockGetDoc.mockImplementation((path: string) => {
      if (path.includes('stripeEvents')) {
        return Promise.resolve({ exists: true });
      }
      return Promise.resolve({ exists: false, data: () => null });
    });

    const res = await POST(makeWebhookRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
    // Should NOT call update (no processing)
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('handles checkout.session.completed → upgrades to pro', async () => {
    const eventId = 'evt_checkout_1';
    mockConstructEvent.mockReturnValue({
      id: eventId,
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { firebaseUid: 'user-123' },
          subscription: 'sub_123',
        },
      },
    });

    // stripeEvents doc does not exist
    mockGetDoc.mockImplementation((path: string) => {
      if (path.includes('stripeEvents')) {
        return Promise.resolve({ exists: false });
      }
      return Promise.resolve({ exists: false, data: () => null });
    });

    mockRetrieveSubscription.mockResolvedValue({
      id: 'sub_123',
      status: 'active',
      trial_end: null,
      items: {
        data: [{ current_period_end: Math.floor(Date.now() / 1000) + 86400 }],
      },
    });

    const res = await POST(makeWebhookRequest());
    expect(res.status).toBe(200);

    // Should update user role to pro
    expect(mockUpdate).toHaveBeenCalledWith(
      'users/user-123',
      expect.objectContaining({
        role: 'pro',
        subscriptionId: 'sub_123',
        subscriptionStatus: 'active',
      }),
    );

    // Should record processed event
    expect(mockSet).toHaveBeenCalledWith(
      `stripeEvents/${eventId}`,
      expect.objectContaining({
        type: 'checkout.session.completed',
      }),
    );
  });

  it('handles customer.subscription.deleted → downgrades to general', async () => {
    const eventId = 'evt_deleted_1';
    mockConstructEvent.mockReturnValue({
      id: eventId,
      type: 'customer.subscription.deleted',
      data: {
        object: {
          customer: 'cus_123',
          items: { data: [] },
        },
      },
    });

    // stripeEvents doc does not exist
    mockGetDoc.mockImplementation((path: string) => {
      if (path.includes('stripeEvents')) {
        return Promise.resolve({ exists: false });
      }
      // user doc with subscriptionId (not manual pro)
      return Promise.resolve({
        exists: true,
        data: () => ({ subscriptionId: 'sub_123', role: 'pro' }),
      });
    });

    // getFirebaseUidFromCustomer
    mockGetCollection.mockResolvedValue({
      empty: false,
      docs: [{ id: 'user-456' }],
    });

    const res = await POST(makeWebhookRequest());
    expect(res.status).toBe(200);

    // Should downgrade user
    expect(mockUpdate).toHaveBeenCalledWith(
      'users/user-456',
      expect.objectContaining({
        role: 'general',
        subscriptionStatus: 'canceled',
        subscriptionId: null,
      }),
    );
  });

  it('does not downgrade manual pro users on subscription.deleted', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_manual_pro',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          customer: 'cus_manual',
          items: { data: [] },
        },
      },
    });

    mockGetDoc.mockImplementation((path: string) => {
      if (path.includes('stripeEvents')) {
        return Promise.resolve({ exists: false });
      }
      // manual pro: subscriptionId is null
      return Promise.resolve({
        exists: true,
        data: () => ({ subscriptionId: null, role: 'pro' }),
      });
    });

    mockGetCollection.mockResolvedValue({
      empty: false,
      docs: [{ id: 'user-manual' }],
    });

    const res = await POST(makeWebhookRequest());
    expect(res.status).toBe(200);

    // Should NOT update user (manual pro protection)
    // Only the stripeEvents set should be called
    const userUpdateCalls = mockUpdate.mock.calls.filter(([path]: [string]) =>
      path.startsWith('users/'),
    );
    expect(userUpdateCalls).toHaveLength(0);
  });
});

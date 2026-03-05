import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetDoc = vi.fn();

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    doc: vi.fn(() => ({
      get: () => mockGetDoc(),
    })),
  },
}));

import { GET } from '@/app/api/pricing/route';

describe('GET /api/pricing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns default pricing when config/pricing does not exist', async () => {
    mockGetDoc.mockResolvedValue({ exists: false, data: () => null });

    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.price).toBe(500);
    expect(body.promoPrice).toBe(300);
    expect(body.isPromo).toBe(false);
    expect(body.trialDays).toBe(7);
  });

  it('returns custom pricing from Firestore', async () => {
    mockGetDoc.mockResolvedValue({
      exists: true,
      data: () => ({
        proMonthlyPriceYen: 800,
        proPromoPriceYen: 400,
        trialDays: 14,
        promoStartDate: null,
        promoEndDate: null,
      }),
    });

    const res = await GET();
    const body = await res.json();
    expect(body.price).toBe(800);
    expect(body.promoPrice).toBe(400);
    expect(body.trialDays).toBe(14);
    expect(body.isPromo).toBe(false);
  });
});

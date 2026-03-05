import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGet = vi.fn();

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      orderBy: vi.fn(() => ({
        where: vi.fn(function (this: unknown) {
          return {
            where: vi.fn(() => ({ get: () => mockGet() })),
          };
        }),
      })),
    })),
  },
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(() =>
    Promise.resolve({ user: { id: 'user-1', role: 'pro', email: 'test@test.com' } }),
  ),
}));

vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/rate-limit', () => ({
  checkRedisRateLimit: vi.fn(() => Promise.resolve({ success: true, reset: Date.now() + 60000 })),
}));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

import { GET } from '@/app/api/stats-calendar/route';

function makeRequest(params: Record<string, string>): NextRequest {
  const url = new URL('http://localhost:3000/api/stats-calendar');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url);
}

describe('GET /api/stats-calendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when year/month are missing', async () => {
    const res = await GET(makeRequest({}));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain('required');
  });

  it('returns 400 for invalid month', async () => {
    const res = await GET(makeRequest({ year: '2025', month: '13' }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid');
  });

  it('returns 400 for non-numeric values', async () => {
    const res = await GET(makeRequest({ year: 'abc', month: 'def' }));
    const body = await res.json();
    expect(res.status).toBe(400);
  });

  it('returns records for valid year/month', async () => {
    mockGet.mockResolvedValue({
      forEach: (fn: (doc: { id: string; data: () => Record<string, unknown> }) => void) => {
        fn({
          id: 'stat-1',
          data: () => ({
            date: { toDate: () => new Date('2025-01-15') },
            rating: 8.5,
            gamesPlayed: 5,
            zeroOneStats: { ppd: 55 },
            cricketStats: { mpr: 2.5 },
            condition: 4,
            memo: 'Good day',
            challenge: '',
            bullStats: { dBull: 100, sBull: 200 },
          }),
        });
      },
    });

    const res = await GET(makeRequest({ year: '2025', month: '1' }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.year).toBe(2025);
    expect(body.month).toBe(1);
    expect(body.records).toHaveLength(1);
    expect(body.records[0].rating).toBe(8.5);
    expect(body.records[0].ppd).toBe(55);
  });

  it('returns empty records when no data', async () => {
    mockGet.mockResolvedValue({
      forEach: () => {},
    });
    const res = await GET(makeRequest({ year: '2025', month: '6' }));
    const body = await res.json();
    expect(body.records).toEqual([]);
  });
});

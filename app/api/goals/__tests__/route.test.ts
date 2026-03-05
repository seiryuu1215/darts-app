import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockCollectionGet = vi.fn();
const mockCollectionAdd = vi.fn();
const mockDocGet = vi.fn();
const mockDocDelete = vi.fn();
const mockDocUpdate = vi.fn();

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      orderBy: vi.fn(() => ({
        get: () => mockCollectionGet(),
      })),
      where: vi.fn(() => ({
        get: () => mockCollectionGet(),
      })),
      add: (...args: unknown[]) => mockCollectionAdd(...args),
    })),
    doc: vi.fn(() => ({
      get: () => mockDocGet(),
      delete: () => mockDocDelete(),
      update: (...args: unknown[]) => mockDocUpdate(...args),
    })),
  },
}));

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: () => ({ _serverTimestamp: true }),
  },
  Timestamp: {
    fromDate: (d: Date) => ({ _date: d.toISOString() }),
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

import { GET, POST, DELETE } from '@/app/api/goals/route';

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, options);
}

describe('GET /api/goals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty goals when none exist', async () => {
    mockCollectionGet.mockResolvedValue({ empty: true, docs: [] });

    const res = await GET(makeRequest('/api/goals'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.goals).toEqual([]);
    expect(body.activeDaily).toBe(0);
    expect(body.activeMonthly).toBe(0);
    expect(body.activeYearly).toBe(0);
  });
});

describe('POST /api/goals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollectionAdd.mockResolvedValue({ id: 'goal-1' });
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await POST(
      makeRequest('/api/goals', {
        method: 'POST',
        body: JSON.stringify({ type: 'bulls' }),
      }),
    );
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain('必須フィールド');
  });

  it('creates goal with valid fields', async () => {
    mockCollectionGet.mockResolvedValue({ docs: [] });
    mockDocGet.mockResolvedValue({ exists: false, data: () => null });

    const res = await POST(
      makeRequest('/api/goals', {
        method: 'POST',
        body: JSON.stringify({
          type: 'rating',
          period: 'monthly',
          target: 10,
          startDate: '2025-01-01',
          endDate: '2025-01-31',
        }),
      }),
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.id).toBe('goal-1');
    expect(body.success).toBe(true);
  });

  it('returns 400 when daily goal limit is reached', async () => {
    const now = new Date();
    const futureEnd = new Date(now.getTime() + 86400000);
    mockCollectionGet.mockResolvedValue({
      docs: Array(3).fill({
        data: () => ({
          achievedAt: null,
          endDate: { toDate: () => futureEnd },
        }),
      }),
    });

    const res = await POST(
      makeRequest('/api/goals', {
        method: 'POST',
        body: JSON.stringify({
          type: 'bulls',
          period: 'daily',
          target: 50,
          startDate: now.toISOString(),
          endDate: futureEnd.toISOString(),
        }),
      }),
    );
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain('上限');
  });

  it('returns 400 when rating already achieved', async () => {
    mockCollectionGet.mockResolvedValue({ docs: [] });
    mockDocGet.mockResolvedValue({
      exists: true,
      data: () => ({ rating: 12 }),
    });

    const res = await POST(
      makeRequest('/api/goals', {
        method: 'POST',
        body: JSON.stringify({
          type: 'rating',
          period: 'yearly',
          target: 10,
          startDate: '2025-01-01',
          endDate: '2025-12-31',
        }),
      }),
    );
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain('既に目標値に達して');
  });
});

describe('DELETE /api/goals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDocDelete.mockResolvedValue(undefined);
  });

  it('returns 400 when id is missing', async () => {
    const res = await DELETE(makeRequest('/api/goals'));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain('ID');
  });

  it('deletes goal by id', async () => {
    const res = await DELETE(makeRequest('/api/goals?id=goal-1'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });
});

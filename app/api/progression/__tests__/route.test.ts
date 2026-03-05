import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockDocGet = vi.fn();
const mockDocSet = vi.fn();
const mockDocUpdate = vi.fn();
const mockCollectionGet = vi.fn();
const mockCollectionAdd = vi.fn();

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    doc: vi.fn(() => ({
      get: () => mockDocGet(),
      set: (...args: unknown[]) => mockDocSet(...args),
      update: (...args: unknown[]) => mockDocUpdate(...args),
    })),
    collection: vi.fn(() => ({
      orderBy: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: () => mockCollectionGet(),
        })),
      })),
      add: (...args: unknown[]) => mockCollectionAdd(...args),
    })),
  },
}));

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    increment: (n: number) => ({ _increment: n }),
    serverTimestamp: () => ({ _serverTimestamp: true }),
    arrayUnion: (id: string) => ({ _arrayUnion: id }),
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

import { GET, POST } from '@/app/api/progression/route';

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, options);
}

describe('GET /api/progression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns progression data for user', async () => {
    // First call: user doc, second call: cache doc
    let callCount = 0;
    mockDocGet.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          data: () => ({ xp: 500, achievements: [], milestones: [] }),
        });
      }
      // Cache doc
      return Promise.resolve({
        exists: false,
        data: () => null,
      });
    });

    mockCollectionGet.mockResolvedValue({ docs: [] });

    const res = await GET(makeRequest('/api/progression'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.xp).toBe(500);
    expect(body.level).toBeGreaterThanOrEqual(1);
    expect(body.history).toEqual([]);
  });

  it('returns default values for new user', async () => {
    mockDocGet.mockResolvedValue({ data: () => ({}), exists: false });
    mockCollectionGet.mockResolvedValue({ docs: [] });

    const res = await GET(makeRequest('/api/progression'));
    const body = await res.json();
    expect(body.xp).toBe(0);
    expect(body.level).toBe(1);
  });
});

describe('POST /api/progression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDocSet.mockResolvedValue(undefined);
    mockDocUpdate.mockResolvedValue(undefined);
    mockCollectionAdd.mockResolvedValue({ id: 'xp-1' });
  });

  it('returns 400 for unknown action', async () => {
    const res = await POST(
      makeRequest('/api/progression', {
        method: 'POST',
        body: JSON.stringify({ action: 'nonexistent' }),
      }),
    );
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain('不明なアクション');
  });

  it('grants XP for valid action', async () => {
    mockDocGet.mockResolvedValue({
      data: () => ({ xp: 50, level: 1, milestones: [] }),
    });

    const res = await POST(
      makeRequest('/api/progression', {
        method: 'POST',
        body: JSON.stringify({ action: 'stats_record' }),
      }),
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.xpGained).toBe(5);
    expect(body.totalXp).toBe(50);
  });

  it('multiplies XP when count is provided', async () => {
    mockDocGet.mockResolvedValue({
      data: () => ({ xp: 100, level: 2, milestones: [] }),
    });

    const res = await POST(
      makeRequest('/api/progression', {
        method: 'POST',
        body: JSON.stringify({ action: 'stats_record', count: 3 }),
      }),
    );
    const body = await res.json();
    expect(body.xpGained).toBe(15); // 5 * 3
  });

  it('records XP history', async () => {
    mockDocGet.mockResolvedValue({
      data: () => ({ xp: 50, level: 1, milestones: [] }),
    });

    await POST(
      makeRequest('/api/progression', {
        method: 'POST',
        body: JSON.stringify({ action: 'stats_record', detail: 'テスト記録' }),
      }),
    );

    expect(mockCollectionAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'stats_record',
        xp: 5,
      }),
    );
  });
});

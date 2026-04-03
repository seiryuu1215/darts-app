import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGet = vi.fn();
const mockBatchUpdate = vi.fn();
const mockBatchCommit = vi.fn();

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      where: vi.fn(() => ({
        orderBy: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: () => mockGet(),
          })),
        })),
      })),
    })),
    doc: vi.fn(() => ({})),
    batch: vi.fn(() => ({
      update: mockBatchUpdate,
      commit: mockBatchCommit,
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

import { GET, PATCH } from '@/app/api/notifications/route';

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, options);
}

describe('GET /api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty notifications when none exist', async () => {
    mockGet.mockResolvedValue({ docs: [] });
    const res = await GET(makeRequest('/api/notifications'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.notifications).toEqual([]);
  });

  it('returns unread notifications', async () => {
    mockGet.mockResolvedValue({
      docs: [
        {
          id: 'notif-1',
          data: () => ({
            type: 'xp',
            title: 'XP獲得',
            details: ['テスト'],
            totalXp: 10,
            read: false,
            createdAt: { toDate: () => new Date('2025-01-01') },
          }),
        },
      ],
    });
    const res = await GET(makeRequest('/api/notifications'));
    const body = await res.json();
    expect(body.notifications).toHaveLength(1);
    expect(body.notifications[0].id).toBe('notif-1');
    expect(body.notifications[0].totalXp).toBe(10);
  });
});

describe('PATCH /api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBatchCommit.mockResolvedValue(undefined);
  });

  it('returns 400 when ids are missing', async () => {
    const res = await PATCH(
      makeRequest('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({}),
      }),
    );
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe('IDが不正です');
  });

  it('marks notifications as read', async () => {
    const res = await PATCH(
      makeRequest('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ ids: ['notif-1', 'notif-2'] }),
      }),
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockBatchCommit).toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withAdmin, withErrorHandler, withPermission } from '@/lib/api-middleware';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock auth options
vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

// Mock firebase-admin
vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    doc: vi.fn(() => ({
      get: vi.fn(() => Promise.resolve({ exists: false, data: () => null })),
    })),
  },
}));

import { getServerSession } from 'next-auth';
import { adminDb } from '@/lib/firebase-admin';

const mockGetServerSession = vi.mocked(getServerSession);

function makeRequest(url = 'http://localhost:3000/api/test'): NextRequest {
  return new NextRequest(url);
}

describe('withErrorHandler', () => {
  it('returns handler response on success', async () => {
    const handler = withErrorHandler(
      async () => NextResponse.json({ ok: true }),
      'test error',
    );
    const res = await handler(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('returns 500 and logs error on throw', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const handler = withErrorHandler(
      async () => {
        throw new Error('boom');
      },
      'test label',
    );
    const res = await handler(makeRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal Server Error');
    expect(consoleSpy).toHaveBeenCalledWith('test label:', expect.any(Error));
    consoleSpy.mockRestore();
  });
});

describe('withAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no session', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const handler = withAuth(async (_req, ctx) => {
      return NextResponse.json({ userId: ctx.userId });
    });
    const res = await handler(makeRequest());
    expect(res.status).toBe(401);
  });

  it('returns 401 when session has no user id', async () => {
    mockGetServerSession.mockResolvedValue({ user: {} } as never);
    const handler = withAuth(async (_req, ctx) => {
      return NextResponse.json({ userId: ctx.userId });
    });
    const res = await handler(makeRequest());
    expect(res.status).toBe(401);
  });

  it('passes AuthContext on valid session', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', role: 'pro', email: 'test@example.com' },
    } as never);
    const handler = withAuth(async (_req, ctx) => {
      return NextResponse.json(ctx);
    });
    const res = await handler(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.userId).toBe('user-123');
    expect(body.role).toBe('pro');
    expect(body.email).toBe('test@example.com');
  });
});

describe('withAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no session', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const handler = withAdmin(async () => NextResponse.json({ ok: true }));
    const res = await handler(makeRequest());
    expect(res.status).toBe(401);
  });

  it('returns 403 when user is not admin in Firestore', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', role: 'pro', email: 'test@example.com' },
    } as never);
    vi.mocked(adminDb.doc).mockReturnValue({
      get: vi.fn(() => Promise.resolve({ exists: true, data: () => ({ role: 'pro' }) })),
    } as never);

    const handler = withAdmin(async () => NextResponse.json({ ok: true }));
    const res = await handler(makeRequest());
    expect(res.status).toBe(403);
  });

  it('passes through when user is admin in Firestore', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'admin-1', role: 'admin', email: 'admin@example.com' },
    } as never);
    vi.mocked(adminDb.doc).mockReturnValue({
      get: vi.fn(() => Promise.resolve({ exists: true, data: () => ({ role: 'admin' }) })),
    } as never);

    const handler = withAdmin(async (_req, ctx) => NextResponse.json({ role: ctx.role }));
    const res = await handler(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.role).toBe('admin');
  });
});

describe('withPermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 403 when permission check fails', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', role: 'general', email: 'test@example.com' },
    } as never);

    const handler = withPermission(
      (role) => role === 'pro' || role === 'admin',
      'PRO限定です',
      async () => NextResponse.json({ ok: true }),
    );
    const res = await handler(makeRequest());
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('PRO限定です');
  });

  it('passes through when permission check succeeds', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', role: 'pro', email: 'test@example.com' },
    } as never);

    const handler = withPermission(
      (role) => role === 'pro' || role === 'admin',
      'PRO限定です',
      async (_req, ctx) => NextResponse.json({ userId: ctx.userId }),
    );
    const res = await handler(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.userId).toBe('user-123');
  });
});

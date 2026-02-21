import { describe, it, expect, vi, beforeEach } from 'vitest';

// env未設定時のフォールバックテスト
describe('checkRedisRateLimit', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('returns null when env vars are not set', async () => {
    const { checkRedisRateLimit } = await import('@/lib/rate-limit');
    const result = await checkRedisRateLimit('test-key');
    expect(result).toBeNull();
  });
});

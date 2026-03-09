import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Redis } from '@upstash/redis';

interface ServiceStatus {
  status: 'ok' | 'error';
  latencyMs: number;
  error?: string;
}

async function checkFirestore(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    await adminDb.doc('_health/ping').get();
    return { status: 'ok', latencyMs: Date.now() - start };
  } catch (e) {
    return { status: 'error', latencyMs: Date.now() - start, error: String(e) };
  }
}

async function checkRedis(): Promise<ServiceStatus> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return { status: 'ok', latencyMs: 0 };
  }

  const start = Date.now();
  try {
    const redis = new Redis({ url, token });
    await redis.ping();
    return { status: 'ok', latencyMs: Date.now() - start };
  } catch (e) {
    return { status: 'error', latencyMs: Date.now() - start, error: String(e) };
  }
}

export async function GET() {
  const [firestore, redis] = await Promise.all([checkFirestore(), checkRedis()]);

  const status = firestore.status === 'ok' && redis.status === 'ok' ? 'ok' : 'degraded';

  return NextResponse.json({
    status,
    timestamp: new Date().toISOString(),
    services: { firestore, redis },
  });
}

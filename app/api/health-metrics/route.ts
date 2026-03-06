import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withErrorHandler, withAuth } from '@/lib/api-middleware';

export const GET = withErrorHandler(
  withAuth(async (req, { userId }) => {
    const days = Math.min(parseInt(req.nextUrl.searchParams.get('days') || '14', 10), 90);
    const sinceStr = new Date(Date.now() - days * 86_400_000).toISOString().split('T')[0];

    const snap = await adminDb
      .collection(`users/${userId}/healthMetrics`)
      .where('metricDate', '>=', sinceStr)
      .orderBy('metricDate', 'desc')
      .get();

    return NextResponse.json({
      metrics: snap.docs.map((d) => d.data()),
    });
  }),
  'Health metrics error',
);

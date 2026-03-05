import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, withAdmin } from '@/lib/api-middleware';
import { adminDb } from '@/lib/firebase-admin';

/**
 * アフィリエイトクリック集計（管理者専用）。
 * GET → ショップ別・日別のクリック数を返す
 */
async function handleGet(_req: NextRequest) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const snap = await adminDb
    .collection('affiliateClicks')
    .where('timestamp', '>=', thirtyDaysAgo)
    .orderBy('timestamp', 'desc')
    .limit(1000)
    .get();

  // ショップ別集計
  const byShop: Record<string, number> = {};
  // 日別集計
  const byDate: Record<string, number> = {};
  // ショップ×バレル集計（上位10）
  const byBarrel: Record<string, number> = {};

  for (const doc of snap.docs) {
    const d = doc.data();
    const shop = d.shop as string;
    byShop[shop] = (byShop[shop] || 0) + 1;

    if (d.timestamp) {
      const date = d.timestamp.toDate().toISOString().slice(0, 10);
      byDate[date] = (byDate[date] || 0) + 1;
    }

    if (d.barrelBrand && d.barrelName) {
      const key = `${d.barrelBrand} ${d.barrelName}`;
      byBarrel[key] = (byBarrel[key] || 0) + 1;
    }
  }

  // 上位バレルをソート
  const topBarrels = Object.entries(byBarrel)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  return NextResponse.json({
    total: snap.size,
    period: '30d',
    byShop,
    byDate,
    topBarrels,
  });
}

export const GET = withErrorHandler(withAdmin(handleGet), 'affiliate-stats:GET');

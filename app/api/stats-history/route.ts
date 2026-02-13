import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getStatsRetentionDays } from '@/lib/permissions';
import { withAuth, withErrorHandler } from '@/lib/api-middleware';

/** JST (UTC+9) の現在時刻を返す */
function nowJST(): Date {
  const now = new Date();
  return new Date(now.getTime() + 9 * 60 * 60 * 1000);
}

/** JST基準の日付範囲を計算 */
function getDateRange(period: string): { start: Date; end: Date } {
  const jst = nowJST();
  const year = jst.getUTCFullYear();
  const month = jst.getUTCMonth();
  const date = jst.getUTCDate();
  const day = jst.getUTCDay(); // 0=Sun

  // JSTの0:00:00をUTCに戻す（-9時間）
  const todayStartJST = new Date(Date.UTC(year, month, date, -9, 0, 0, 0));
  const tomorrowStartJST = new Date(todayStartJST.getTime() + 24 * 60 * 60 * 1000);

  switch (period) {
    case 'today':
      return { start: todayStartJST, end: tomorrowStartJST };
    case 'week': {
      // 月曜始まり: day=0(日)→6日前, day=1(月)→0日前, ...
      const daysToMonday = day === 0 ? 6 : day - 1;
      const weekStart = new Date(todayStartJST.getTime() - daysToMonday * 24 * 60 * 60 * 1000);
      return { start: weekStart, end: tomorrowStartJST };
    }
    case 'month': {
      const monthStart = new Date(Date.UTC(year, month, 1, -9, 0, 0, 0));
      return { start: monthStart, end: tomorrowStartJST };
    }
    case 'all':
    default:
      return { start: new Date(0), end: tomorrowStartJST };
  }
}

export const GET = withErrorHandler(
  withAuth(async (request: NextRequest, { userId, role }) => {
    const rawPeriod = request.nextUrl.searchParams.get('period') || 'all';
    const VALID_PERIODS = ['today', 'week', 'month', 'all'] as const;
    const period = VALID_PERIODS.includes(rawPeriod as (typeof VALID_PERIODS)[number])
      ? rawPeriod
      : 'all';
    let { start } = getDateRange(period);
    const { end } = getDateRange(period);

    // DARTSLIVE連携自体はPROのみだが、履歴参照はFreeでも可能（30日制限）
    const retentionDays = getStatsRetentionDays(role);
    if (retentionDays !== null) {
      const retentionStart = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      if (start < retentionStart) {
        start = retentionStart;
      }
    }

    const colRef = adminDb.collection(`users/${userId}/dartsLiveStats`);
    let query = colRef.orderBy('date', 'asc');

    if (period !== 'all' || retentionDays !== null) {
      query = query.where('date', '>=', start).where('date', '<', end);
    }

    const snapshot = await query.get();
    const records: Array<{
      id: string;
      date: string;
      rating: number | null;
      ppd: number | null;
      mpr: number | null;
      gamesPlayed: number;
      condition: number | null;
      memo: string;
      dBull: number | null;
      sBull: number | null;
    }> = [];

    snapshot.forEach((doc) => {
      const d = doc.data();
      const dateVal = d.date?.toDate?.() ?? (d.date ? new Date(d.date) : null);
      records.push({
        id: doc.id,
        date: dateVal ? dateVal.toISOString() : '',
        rating: d.rating ?? null,
        ppd: d.zeroOneStats?.ppd ?? null,
        mpr: d.cricketStats?.mpr ?? null,
        gamesPlayed: d.gamesPlayed ?? 0,
        condition: d.condition ?? null,
        memo: d.memo ?? '',
        dBull: d.bullStats?.dBull ?? null,
        sBull: d.bullStats?.sBull ?? null,
      });
    });

    // 集計
    const totalGames = records.reduce((sum, r) => sum + (r.gamesPlayed || 0), 0);
    const playDays = new Set(records.map((r) => r.date.slice(0, 10))).size;

    const validRatings = records.filter((r) => r.rating != null);
    const validPpd = records.filter((r) => r.ppd != null);
    const validMpr = records.filter((r) => r.mpr != null);
    const validCondition = records.filter((r) => r.condition != null);

    const avgRating =
      validRatings.length > 0
        ? validRatings.reduce((sum, r) => sum + r.rating!, 0) / validRatings.length
        : null;
    const avgPpd =
      validPpd.length > 0 ? validPpd.reduce((sum, r) => sum + r.ppd!, 0) / validPpd.length : null;
    const avgMpr =
      validMpr.length > 0 ? validMpr.reduce((sum, r) => sum + r.mpr!, 0) / validMpr.length : null;
    const avgCondition =
      validCondition.length > 0
        ? validCondition.reduce((sum, r) => sum + r.condition!, 0) / validCondition.length
        : null;

    // Rating変動（期間内最初→最後）
    const ratingChange =
      validRatings.length >= 2
        ? validRatings[validRatings.length - 1].rating! - validRatings[0].rating!
        : null;

    // 自己ベスト
    const bestRating =
      validRatings.length > 0 ? Math.max(...validRatings.map((r) => r.rating!)) : null;
    const bestPpd = validPpd.length > 0 ? Math.max(...validPpd.map((r) => r.ppd!)) : null;
    const bestMpr = validMpr.length > 0 ? Math.max(...validMpr.map((r) => r.mpr!)) : null;

    // 連続プレイ日数（ストリーク） — 全期間のみ計算
    let streak = 0;
    if (period === 'all' && records.length > 0) {
      const uniqueDates = [...new Set(records.map((r) => r.date.slice(0, 10)))].sort().reverse();
      const jst = nowJST();
      const todayStr = `${jst.getUTCFullYear()}-${String(jst.getUTCMonth() + 1).padStart(2, '0')}-${String(jst.getUTCDate()).padStart(2, '0')}`;
      const yesterdayJst = new Date(jst.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayStr = `${yesterdayJst.getUTCFullYear()}-${String(yesterdayJst.getUTCMonth() + 1).padStart(2, '0')}-${String(yesterdayJst.getUTCDate()).padStart(2, '0')}`;

      // 今日 or 昨日のデータがあればストリーク開始
      if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
        streak = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
          const prev = new Date(uniqueDates[i - 1] + 'T00:00:00Z');
          const curr = new Date(uniqueDates[i] + 'T00:00:00Z');
          const diffDays = (prev.getTime() - curr.getTime()) / (24 * 60 * 60 * 1000);
          if (diffDays === 1) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    return NextResponse.json({
      period,
      summary: {
        avgRating,
        avgPpd,
        avgMpr,
        avgCondition,
        totalGames,
        playDays,
        ratingChange,
        bestRating,
        bestPpd,
        bestMpr,
        streak,
      },
      records,
    });
  }),
  'Stats history error',
);

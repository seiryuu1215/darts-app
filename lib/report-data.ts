/**
 * 週次/月次レポートデータ集計
 */
import { adminDb } from '@/lib/firebase-admin';

export interface PeriodReportData {
  playDays: number;
  totalGames: number;
  ratingStart: number | null;
  ratingEnd: number | null;
  ratingChange: number | null;
  avgRating: number | null;
  avgPpd: number | null;
  avgMpr: number | null;
  bestDay: { date: string; rating: number } | null;
  worstDay: { date: string; rating: number } | null;
  awardsHighlights: { label: string; count: number }[];
  goalsAchieved: number;
  goalsActive: number;
  xpGained: number;
}

export async function gatherPeriodReport(
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<PeriodReportData> {
  // dartsLiveStats をdate範囲クエリ
  const statsSnap = await adminDb
    .collection(`users/${userId}/dartsLiveStats`)
    .where('date', '>=', startDate)
    .where('date', '<=', endDate)
    .orderBy('date', 'asc')
    .get();

  const records = statsSnap.docs.map((doc) => {
    const d = doc.data();
    const dateVal = d.date?.toDate?.() ?? (d.date ? new Date(d.date) : new Date());
    return {
      date: dateVal.toISOString().slice(0, 10),
      rating: (d.rating as number) ?? null,
      gamesPlayed: (d.gamesPlayed as number) ?? 0,
      ppd: (d.ppd as number) ?? null,
      mpr: (d.mpr as number) ?? null,
    };
  });

  const playDays = records.length;
  const totalGames = records.reduce((sum, r) => sum + r.gamesPlayed, 0);

  // Rating
  const ratingsWithDate = records.filter((r) => r.rating != null);
  const ratingStart = ratingsWithDate.length > 0 ? ratingsWithDate[0].rating : null;
  const ratingEnd =
    ratingsWithDate.length > 0 ? ratingsWithDate[ratingsWithDate.length - 1].rating : null;
  const ratingChange = ratingStart != null && ratingEnd != null ? ratingEnd - ratingStart : null;

  const ratings = records.map((r) => r.rating).filter((r): r is number => r != null);
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

  // PPD / MPR from cache
  const cacheRef = adminDb.doc(`users/${userId}/dartsliveCache/latest`);
  const cacheDoc = await cacheRef.get();
  const cacheData = cacheDoc.exists ? cacheDoc.data() : null;
  const avgPpd = cacheData?.stats01Avg ?? null;
  const avgMpr = cacheData?.statsCriAvg ?? null;

  // Best / Worst day
  let bestDay: { date: string; rating: number } | null = null;
  let worstDay: { date: string; rating: number } | null = null;
  for (const r of ratingsWithDate) {
    if (r.rating == null) continue;
    if (!bestDay || r.rating > bestDay.rating) {
      bestDay = { date: r.date, rating: r.rating };
    }
    if (!worstDay || r.rating < worstDay.rating) {
      worstDay = { date: r.date, rating: r.rating };
    }
  }

  // Awards highlights: 期間の最初と最後のキャッシュから差分計算
  const awardsHighlights: { label: string; count: number }[] = [];
  if (cacheData && playDays > 0) {
    const firstDoc = statsSnap.docs[0]?.data();
    const lastDoc = statsSnap.docs[statsSnap.docs.length - 1]?.data();

    const awardKeys: { field: string; label: string }[] = [
      { field: 'hatTricks', label: 'HAT TRICK' },
      { field: 'ton80', label: 'TON 80' },
      { field: 'lowTon', label: 'LOW TON' },
      { field: 'highTon', label: 'HIGH TON' },
      { field: 'threeInABed', label: '3 IN A BED' },
      { field: 'whiteHorse', label: 'WHITE HORSE' },
    ];

    for (const ak of awardKeys) {
      const firstVal = (firstDoc?.[ak.field] as number) ?? 0;
      const lastVal = (lastDoc?.[ak.field] as number) ?? firstVal;
      const diff = lastVal - firstVal;
      if (diff > 0) {
        awardsHighlights.push({ label: ak.label, count: diff });
      }
    }
  }
  // 上位5件に制限
  awardsHighlights.sort((a, b) => b.count - a.count);
  awardsHighlights.splice(5);

  // Goals
  const goalsSnap = await adminDb.collection(`users/${userId}/goals`).get();
  const goalsActive = goalsSnap.docs.filter((d) => !d.data().achievedAt).length;
  const goalsAchieved = goalsSnap.docs.filter((d) => {
    const achievedAt = d.data().achievedAt?.toDate?.();
    return achievedAt && achievedAt >= startDate && achievedAt <= endDate;
  }).length;

  // XP gained
  const xpSnap = await adminDb
    .collection(`users/${userId}/xpHistory`)
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .get();
  const xpGained = xpSnap.docs.reduce((sum, d) => sum + ((d.data().xp as number) ?? 0), 0);

  return {
    playDays,
    totalGames,
    ratingStart,
    ratingEnd,
    ratingChange,
    avgRating,
    avgPpd,
    avgMpr,
    bestDay,
    worstDay,
    awardsHighlights,
    goalsAchieved,
    goalsActive,
    xpGained,
  };
}

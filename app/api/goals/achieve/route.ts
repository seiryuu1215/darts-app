import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withAuth, withErrorHandler } from '@/lib/api-middleware';
import { FieldValue } from 'firebase-admin/firestore';
import { calculateGoalCurrent, calculateScaledGoalXp, type StatsRecord } from '@/lib/goals';
import type { GoalType } from '@/types';

/**
 * dartsLiveStats ドキュメントを StatsRecord に変換
 */
function toStatsRecord(d: FirebaseFirestore.DocumentData): StatsRecord {
  const dateVal = d.date?.toDate?.() ?? (d.date ? new Date(d.date) : null);
  return {
    date: dateVal ? dateVal.toISOString() : '',
    rating: d.rating ?? null,
    gamesPlayed: d.gamesPlayed ?? 0,
    dBull: d.bullStats?.dBull ?? null,
    sBull: d.bullStats?.sBull ?? null,
    hatTricks: d.hatTricks ?? null,
  };
}

/**
 * キャッシュから月間アワード値を取得
 */
function getMonthlyAwardsFromCache(cacheData: FirebaseFirestore.DocumentData | null): {
  monthlyBulls: number | null;
  monthlyHatTricks: number | null;
} {
  if (!cacheData) return { monthlyBulls: null, monthlyHatTricks: null };

  let monthlyBulls: number | null = null;
  let monthlyHatTricks: number | null = null;

  const dBullM = cacheData.bullStats?.dBullMonthly ?? null;
  const sBullM = cacheData.bullStats?.sBullMonthly ?? null;
  if (dBullM !== null || sBullM !== null) {
    monthlyBulls = (dBullM ?? 0) + (sBullM ?? 0);
  }
  monthlyHatTricks = cacheData.hatTricksMonthly ?? null;

  if (monthlyBulls === null && cacheData.fullData) {
    try {
      const full = JSON.parse(cacheData.fullData);
      const awards = full?.current?.awards ?? {};
      const dm = awards['D-BULL']?.monthly ?? null;
      const sm = awards['S-BULL']?.monthly ?? null;
      if (dm !== null || sm !== null) {
        monthlyBulls = (dm ?? 0) + (sm ?? 0);
      }
      if (monthlyHatTricks === null) {
        monthlyHatTricks = awards['HAT TRICK']?.monthly ?? awards['Hat Trick']?.monthly ?? null;
      }
    } catch {
      // ignore
    }
  }

  return { monthlyBulls, monthlyHatTricks };
}

/**
 * POST /api/goals/achieve — 目標を手動達成
 * Body: { goalId }
 */
export const POST = withErrorHandler(
  withAuth(async (req: NextRequest, { userId }) => {
    const body = await req.json();
    const { goalId } = body as { goalId: string };

    if (!goalId) {
      return NextResponse.json({ error: '目標IDが必要です' }, { status: 400 });
    }

    // 対象目標を取得
    const goalDoc = await adminDb.doc(`users/${userId}/goals/${goalId}`).get();
    if (!goalDoc.exists) {
      return NextResponse.json({ error: '目標が見つかりません' }, { status: 404 });
    }

    const goalData = goalDoc.data()!;
    const goal = {
      type: goalData.type as GoalType,
      period: goalData.period as string,
      target: goalData.target as number,
      startDate: (goalData.startDate?.toDate?.() ?? null) as Date | null,
      endDate: (goalData.endDate?.toDate?.() ?? null) as Date | null,
      baseline: (goalData.baseline ?? null) as number | null,
    };

    // current を計算（GET APIと同じロジック）
    const now = new Date();
    let allRecords: StatsRecord[] = [];
    if (goal.startDate) {
      const baselineStart = new Date(goal.startDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      const statsQuery = adminDb
        .collection(`users/${userId}/dartsLiveStats`)
        .where('date', '>=', baselineStart)
        .orderBy('date', 'asc');
      const statsSnap = await statsQuery.get();
      allRecords = statsSnap.docs.map((doc) => toStatsRecord(doc.data()));
    }

    const cacheDoc = await adminDb.doc(`users/${userId}/dartsliveCache/latest`).get();
    const cacheData = cacheDoc.exists ? cacheDoc.data()! : null;

    if (cacheData) {
      const cacheDate = cacheData.updatedAt?.toDate?.() ?? now;
      let dBull: number | null = cacheData.bullStats?.dBull ?? null;
      let sBull: number | null = cacheData.bullStats?.sBull ?? null;
      let hatTricks: number | null = cacheData.hatTricks ?? null;

      if (dBull === null && cacheData.fullData) {
        try {
          const full = JSON.parse(cacheData.fullData);
          const awards = full?.current?.awards ?? {};
          dBull = awards['D-BULL']?.total ?? null;
          sBull = awards['S-BULL']?.total ?? null;
          if (hatTricks === null) {
            hatTricks = awards['HAT TRICK']?.total ?? awards['Hat Trick']?.total ?? null;
          }
        } catch {
          // ignore
        }
      }

      const cacheRecord: StatsRecord = {
        date: cacheDate.toISOString(),
        rating: cacheData.rating ?? null,
        gamesPlayed: 0,
        dBull,
        sBull,
        hatTricks,
      };
      const lastRecordDate =
        allRecords.length > 0 ? new Date(allRecords[allRecords.length - 1].date).getTime() : 0;
      if (cacheDate.getTime() > lastRecordDate) {
        allRecords.push(cacheRecord);
      }
    }

    const { monthlyBulls: cachedMonthlyBulls, monthlyHatTricks: cachedMonthlyHatTricks } =
      getMonthlyAwardsFromCache(cacheData);

    let current = 0;

    // daily目標: baseline差分で計算
    if (goal.period === 'daily' && goal.baseline !== null && goal.baseline !== undefined) {
      if (goal.type === 'bulls') {
        let totalBulls = 0;
        if (cacheData) {
          let dBull: number | null = cacheData.bullStats?.dBull ?? null;
          let sBull: number | null = cacheData.bullStats?.sBull ?? null;
          if (dBull === null && cacheData.fullData) {
            try {
              const full = JSON.parse(cacheData.fullData);
              const awards = full?.current?.awards ?? {};
              dBull = awards['D-BULL']?.total ?? null;
              sBull = awards['S-BULL']?.total ?? null;
            } catch {
              /* ignore */
            }
          }
          totalBulls = (dBull ?? 0) + (sBull ?? 0);
        }
        current = Math.max(0, totalBulls - goal.baseline);
      } else if (goal.type === 'hat_tricks') {
        let totalHatTricks = 0;
        if (cacheData) {
          totalHatTricks = cacheData.hatTricks ?? 0;
          if (!totalHatTricks && cacheData.fullData) {
            try {
              const full = JSON.parse(cacheData.fullData);
              const awards = full?.current?.awards ?? {};
              totalHatTricks = awards['HAT TRICK']?.total ?? awards['Hat Trick']?.total ?? 0;
            } catch {
              /* ignore */
            }
          }
        }
        current = Math.max(0, totalHatTricks - goal.baseline);
      }
    }
    // 月間ブル・ハットトリック目標
    else if (goal.period === 'monthly' && goal.type === 'bulls' && cachedMonthlyBulls !== null) {
      current = cachedMonthlyBulls;
    } else if (
      goal.period === 'monthly' &&
      goal.type === 'hat_tricks' &&
      cachedMonthlyHatTricks !== null
    ) {
      current = cachedMonthlyHatTricks;
    } else if (
      goal.type !== 'cu_score' &&
      goal.startDate &&
      goal.endDate &&
      allRecords.length > 0
    ) {
      const startMs = goal.startDate.getTime();
      const endMs = goal.endDate.getTime() + 24 * 60 * 60 * 1000;

      const periodRecords = allRecords.filter((r) => {
        const t = new Date(r.date).getTime();
        return t >= startMs && t < endMs;
      });

      let baselineRecord: StatsRecord | undefined;
      if (goal.type === 'bulls' || goal.type === 'hat_tricks') {
        const beforeRecords = allRecords.filter((r) => new Date(r.date).getTime() < startMs);
        if (beforeRecords.length > 0) {
          baselineRecord = beforeRecords[beforeRecords.length - 1];
        }
      }

      current = calculateGoalCurrent(goal.type, periodRecords, baselineRecord);
    }

    // current >= target を検証
    if (current < goal.target) {
      return NextResponse.json({ error: 'まだ目標に到達していません' }, { status: 400 });
    }

    // XP付与（スケーリング: 目標値が高いほど多くのXP）
    const xpAmount = calculateScaledGoalXp(goal.type, goal.period, goal.target);
    const xpAction = goal.period === 'daily' ? 'daily_goal_achieved' : 'goal_achieved';
    try {
      const userRef = adminDb.doc(`users/${userId}`);
      await userRef.set({ xp: FieldValue.increment(xpAmount) }, { merge: true });
      await adminDb.collection(`users/${userId}/xpHistory`).add({
        action: xpAction,
        xp: xpAmount,
        detail: `目標達成: ${goal.type}`,
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (e) {
      console.error('Goal XP award error:', e);
    }

    // 達成した目標をFirestoreから削除
    await adminDb.doc(`users/${userId}/goals/${goalId}`).delete();

    return NextResponse.json({
      success: true,
      xpAwarded: xpAmount,
      goalType: goal.type,
      target: goal.target,
    });
  }),
  'Goals Achieve POST error',
);

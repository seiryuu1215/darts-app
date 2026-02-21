import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withAuth, withErrorHandler } from '@/lib/api-middleware';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { calculateGoalCurrent, getMonthlyRange, type StatsRecord } from '@/lib/goals';
import type { GoalType } from '@/types';

const DAILY_LIMIT = 3;
const MONTHLY_LIMIT = 3;
const YEARLY_LIMIT = 1;

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
 * アクティブ目標数を数える（未達成 & 期間内）
 */
function countActiveGoals(
  goals: { period: string; achievedAt: Date | null; endDate: Date | null }[],
  period: string,
): number {
  const now = new Date();
  return goals.filter(
    (g) =>
      g.period === period && !g.achievedAt && g.endDate && g.endDate.getTime() >= now.getTime(),
  ).length;
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

  // fullData JSONからもフォールバック
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
 * GET /api/goals — ユーザーの目標一覧を取得（dartsLiveStats から current をリアルタイム計算）
 */
export const GET = withErrorHandler(
  withAuth(async (_req: NextRequest, { userId }) => {
    const snapshot = await adminDb
      .collection(`users/${userId}/goals`)
      .orderBy('endDate', 'desc')
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ goals: [], activeDaily: 0, activeMonthly: 0, activeYearly: 0 });
    }

    const rawGoals = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        type: d.type as GoalType,
        period: d.period as string,
        target: d.target as number,
        startDate: (d.startDate?.toDate?.() ?? null) as Date | null,
        endDate: (d.endDate?.toDate?.() ?? null) as Date | null,
        achievedAt: (d.achievedAt?.toDate?.() ?? null) as Date | null,
        xpAwarded: (d.xpAwarded ?? false) as boolean,
        carryOver: (d.carryOver ?? false) as boolean,
        baseline: (d.baseline ?? null) as number | null,
      };
    });

    // 期限切れ未達成monthly目標の自動引き継ぎ
    const now = new Date();
    for (const goal of rawGoals) {
      if (
        goal.period === 'monthly' &&
        !goal.achievedAt &&
        goal.endDate &&
        goal.endDate.getTime() < now.getTime()
      ) {
        const { startDate: newStart, endDate: newEnd } = getMonthlyRange();
        const alreadyCarried = rawGoals.some(
          (g) =>
            g.type === goal.type &&
            g.startDate &&
            g.startDate.getTime() >= newStart.getTime() &&
            g.endDate &&
            g.endDate.getTime() <= newEnd.getTime() + 24 * 60 * 60 * 1000,
        );

        if (!alreadyCarried) {
          const newGoalRef = await adminDb.collection(`users/${userId}/goals`).add({
            type: goal.type,
            period: goal.period,
            target: goal.target,
            current: 0,
            startDate: Timestamp.fromDate(newStart),
            endDate: Timestamp.fromDate(newEnd),
            achievedAt: null,
            xpAwarded: false,
            carryOver: true,
            createdAt: FieldValue.serverTimestamp(),
          });

          rawGoals.push({
            id: newGoalRef.id,
            type: goal.type,
            period: goal.period,
            target: goal.target,
            startDate: newStart,
            endDate: newEnd,
            achievedAt: null,
            xpAwarded: false,
            carryOver: true,
            baseline: null,
          });
        }
      }
    }

    // 期限切れdaily目標の自動削除（引き継ぎなし）
    for (const goal of rawGoals) {
      if (
        goal.period === 'daily' &&
        !goal.achievedAt &&
        goal.endDate &&
        goal.endDate.getTime() < now.getTime()
      ) {
        await adminDb.doc(`users/${userId}/goals/${goal.id}`).delete();
      }
    }
    // 削除済みdailyを除外
    const activeRawGoals = rawGoals.filter(
      (g) =>
        !(
          g.period === 'daily' &&
          !g.achievedAt &&
          g.endDate &&
          g.endDate.getTime() < now.getTime()
        ),
    );

    // 全目標の期間をカバーする最小日付を求める
    const startDates = activeRawGoals.map((g) => g.startDate).filter((d): d is Date => d !== null);
    const earliestStart =
      startDates.length > 0 ? new Date(Math.min(...startDates.map((d) => d.getTime()))) : null;

    // dartsLiveStats レコードをまとめて取得
    let allRecords: StatsRecord[] = [];
    if (earliestStart) {
      const baselineStart = new Date(earliestStart.getTime() - 30 * 24 * 60 * 60 * 1000);
      const statsQuery = adminDb
        .collection(`users/${userId}/dartsLiveStats`)
        .where('date', '>=', baselineStart)
        .orderBy('date', 'asc');
      const statsSnap = await statsQuery.get();
      allRecords = statsSnap.docs.map((doc) => toStatsRecord(doc.data()));
    }

    // dartsliveCache/latest を取得
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

    // 各目標の current を計算
    const responseGoals: {
      id: string;
      type: string;
      period: string;
      target: number;
      current: number;
      startDate: string;
      endDate: string;
      achievedAt: string | null;
      xpAwarded: boolean;
      carryOver: boolean;
      achievable: boolean;
    }[] = [];

    for (const goal of activeRawGoals) {
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
      // 月間ブル・ハットトリック目標: DARTSLIVEの「今月」値を直接使用
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

      // 誤達成の修正: achievedAt が設定されているが current < target なら解除
      if (goal.achievedAt && current < goal.target) {
        await adminDb.doc(`users/${userId}/goals/${goal.id}`).update({
          achievedAt: null,
          xpAwarded: false,
        });
        goal.achievedAt = null;
        goal.xpAwarded = false;
      }

      // 既に達成済み（過去の達成）はレスポンスに含めない
      if (goal.achievedAt) {
        continue;
      }

      // 期限切れ目標も除外（引き継ぎ済みの場合）
      if (goal.endDate && goal.endDate.getTime() < now.getTime()) {
        continue;
      }

      // 達成可能フラグ: current >= target かつ未達成
      const achievable = current >= goal.target && goal.target > 0 && !goal.achievedAt;

      responseGoals.push({
        id: goal.id,
        type: goal.type,
        period: goal.period,
        target: goal.target,
        current,
        startDate: goal.startDate?.toISOString() ?? '',
        endDate: goal.endDate?.toISOString() ?? '',
        achievedAt: null,
        xpAwarded: goal.xpAwarded,
        carryOver: goal.carryOver,
        achievable,
      });
    }

    // アクティブ数を算出
    const activeDaily = countActiveGoals(activeRawGoals, 'daily');
    const activeMonthly = countActiveGoals(activeRawGoals, 'monthly');
    const activeYearly = countActiveGoals(activeRawGoals, 'yearly');

    return NextResponse.json({ goals: responseGoals, activeDaily, activeMonthly, activeYearly });
  }),
  'Goals GET error',
);

/**
 * POST /api/goals — 目標を作成
 * Body: { type, period, target, startDate, endDate }
 */
export const POST = withErrorHandler(
  withAuth(async (req: NextRequest, { userId }) => {
    const body = await req.json();
    const { type, period, target, startDate, endDate } = body as {
      type: string;
      period: string;
      target: number;
      startDate: string;
      endDate: string;
    };

    if (!type || !period || !target || !startDate || !endDate) {
      return NextResponse.json({ error: '必須フィールドが不足しています' }, { status: 400 });
    }

    // アクティブ目標数の上限チェック
    const now = new Date();
    const existingSnap = await adminDb
      .collection(`users/${userId}/goals`)
      .where('period', '==', period)
      .get();

    const activeCount = existingSnap.docs.filter((doc) => {
      const d = doc.data();
      const endD = d.endDate?.toDate?.();
      return !d.achievedAt && endD && endD.getTime() >= now.getTime();
    }).length;

    const limit =
      period === 'daily' ? DAILY_LIMIT : period === 'monthly' ? MONTHLY_LIMIT : YEARLY_LIMIT;
    const periodLabel = period === 'daily' ? '日間' : period === 'monthly' ? '月間' : '年間';
    if (activeCount >= limit) {
      return NextResponse.json(
        { error: `${periodLabel}目標の上限（${limit}つ）に達しています` },
        { status: 400 },
      );
    }

    // 既達成チェック: 現在値が既にtarget以上なら設定させない
    const cacheDoc = await adminDb.doc(`users/${userId}/dartsliveCache/latest`).get();
    const cacheData = cacheDoc.exists ? cacheDoc.data()! : null;

    if (period === 'monthly') {
      const { monthlyBulls, monthlyHatTricks } = getMonthlyAwardsFromCache(cacheData);

      if (type === 'bulls' && monthlyBulls !== null && monthlyBulls >= target) {
        return NextResponse.json(
          { error: '今月のブル数が既に目標値に達しています。より高い目標を設定してください。' },
          { status: 400 },
        );
      }
      if (type === 'hat_tricks' && monthlyHatTricks !== null && monthlyHatTricks >= target) {
        return NextResponse.json(
          {
            error: '今月のHAT TRICK数が既に目標値に達しています。より高い目標を設定してください。',
          },
          { status: 400 },
        );
      }
    }

    if (type === 'rating' && cacheData?.rating != null && cacheData.rating >= target) {
      return NextResponse.json(
        { error: '現在のRatingが既に目標値に達しています。より高い目標を設定してください。' },
        { status: 400 },
      );
    }

    // daily目標の場合はbaseline（現在の累計値スナップショット）を保存
    let baseline: number | null = null;
    if (period === 'daily') {
      if (type === 'bulls' || type === 'hat_tricks') {
        if (type === 'bulls') {
          let dBull: number | null = cacheData?.bullStats?.dBull ?? null;
          let sBull: number | null = cacheData?.bullStats?.sBull ?? null;
          if (dBull === null && cacheData?.fullData) {
            try {
              const full = JSON.parse(cacheData.fullData);
              const awards = full?.current?.awards ?? {};
              dBull = awards['D-BULL']?.total ?? null;
              sBull = awards['S-BULL']?.total ?? null;
            } catch {
              /* ignore */
            }
          }
          baseline = (dBull ?? 0) + (sBull ?? 0);
        } else {
          let hatTricks: number | null = cacheData?.hatTricks ?? null;
          if (hatTricks === null && cacheData?.fullData) {
            try {
              const full = JSON.parse(cacheData.fullData);
              const awards = full?.current?.awards ?? {};
              hatTricks = awards['HAT TRICK']?.total ?? awards['Hat Trick']?.total ?? null;
            } catch {
              /* ignore */
            }
          }
          baseline = hatTricks ?? 0;
        }
      }
    }

    const docRef = await adminDb.collection(`users/${userId}/goals`).add({
      type,
      period,
      target,
      current: 0,
      startDate: Timestamp.fromDate(new Date(startDate)),
      endDate: Timestamp.fromDate(new Date(endDate)),
      achievedAt: null,
      xpAwarded: false,
      carryOver: false,
      ...(baseline !== null ? { baseline } : {}),
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: docRef.id, success: true });
  }),
  'Goals POST error',
);

/**
 * DELETE /api/goals?id=xxx — 目標を削除
 */
export const DELETE = withErrorHandler(
  withAuth(async (req: NextRequest, { userId }) => {
    const goalId = req.nextUrl.searchParams.get('id');
    if (!goalId) {
      return NextResponse.json({ error: 'IDが必要です' }, { status: 400 });
    }

    await adminDb.doc(`users/${userId}/goals/${goalId}`).delete();

    return NextResponse.json({ success: true });
  }),
  'Goals DELETE error',
);

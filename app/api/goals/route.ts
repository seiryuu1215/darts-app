import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withAuth, withErrorHandler } from '@/lib/api-middleware';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { calculateGoalCurrent, type StatsRecord } from '@/lib/goals';
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
 * GET /api/goals — ユーザーの目標一覧を取得（dartsLiveStats から current をリアルタイム計算）
 */
export const GET = withErrorHandler(
  withAuth(async (_req: NextRequest, { userId }) => {
    const snapshot = await adminDb
      .collection(`users/${userId}/goals`)
      .orderBy('endDate', 'desc')
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ goals: [] });
    }

    const rawGoals = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        type: d.type as GoalType,
        period: d.period,
        target: d.target,
        startDate: (d.startDate?.toDate?.() ?? null) as Date | null,
        endDate: (d.endDate?.toDate?.() ?? null) as Date | null,
        achievedAt: (d.achievedAt?.toDate?.() ?? null) as Date | null,
        xpAwarded: d.xpAwarded ?? false,
      };
    });

    // 全目標の期間をカバーする最小日付を求める
    const startDates = rawGoals.map((g) => g.startDate).filter((d): d is Date => d !== null);
    const earliestStart =
      startDates.length > 0 ? new Date(Math.min(...startDates.map((d) => d.getTime()))) : null;

    // dartsLiveStats レコードをまとめて取得（ベースラインも含め少し前から）
    let allRecords: StatsRecord[] = [];
    if (earliestStart) {
      // ベースライン用に期間開始の30日前から取得
      const baselineStart = new Date(earliestStart.getTime() - 30 * 24 * 60 * 60 * 1000);
      const statsQuery = adminDb
        .collection(`users/${userId}/dartsLiveStats`)
        .where('date', '>=', baselineStart)
        .orderBy('date', 'asc');
      const statsSnap = await statsQuery.get();
      allRecords = statsSnap.docs.map((doc) => toStatsRecord(doc.data()));
    }

    // 各目標の current を計算
    const goals = await Promise.all(
      rawGoals.map(async (goal) => {
        let current = 0;

        if (goal.type !== 'cu_score' && goal.startDate && goal.endDate && allRecords.length > 0) {
          const startMs = goal.startDate.getTime();
          const endMs = goal.endDate.getTime() + 24 * 60 * 60 * 1000; // endDate の翌日まで含める

          // 期間内レコード
          const periodRecords = allRecords.filter((r) => {
            const t = new Date(r.date).getTime();
            return t >= startMs && t < endMs;
          });

          // ベースライン: 期間開始前の最新レコード（累計値差分用）
          let baselineRecord: StatsRecord | undefined;
          if (goal.type === 'bulls' || goal.type === 'hat_tricks') {
            const beforeRecords = allRecords.filter((r) => new Date(r.date).getTime() < startMs);
            if (beforeRecords.length > 0) {
              baselineRecord = beforeRecords[beforeRecords.length - 1];
            }
          }

          current = calculateGoalCurrent(goal.type, periodRecords, baselineRecord);
        }

        // 達成判定: current >= target かつ未達成
        if (current >= goal.target && goal.target > 0 && !goal.achievedAt) {
          const now = new Date();
          const goalRef = adminDb.doc(`users/${userId}/goals/${goal.id}`);
          await goalRef.update({ achievedAt: Timestamp.fromDate(now) });
          goal.achievedAt = now;

          // XP 付与
          if (!goal.xpAwarded) {
            try {
              const userRef = adminDb.doc(`users/${userId}`);
              await userRef.set({ xp: FieldValue.increment(50) }, { merge: true });
              await adminDb.collection(`users/${userId}/xpHistory`).add({
                action: 'goal_achieved',
                xp: 50,
                detail: `目標達成: ${goal.type}`,
                createdAt: FieldValue.serverTimestamp(),
              });
              await goalRef.update({ xpAwarded: true });
              goal.xpAwarded = true;
            } catch (e) {
              console.error('Goal XP award error:', e);
            }
          }
        }

        return {
          id: goal.id,
          type: goal.type,
          period: goal.period,
          target: goal.target,
          current,
          startDate: goal.startDate?.toISOString() ?? '',
          endDate: goal.endDate?.toISOString() ?? '',
          achievedAt: goal.achievedAt?.toISOString?.() ?? null,
          xpAwarded: goal.xpAwarded,
        };
      }),
    );

    return NextResponse.json({ goals });
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

    const docRef = await adminDb.collection(`users/${userId}/goals`).add({
      type,
      period,
      target,
      current: 0,
      startDate: Timestamp.fromDate(new Date(startDate)),
      endDate: Timestamp.fromDate(new Date(endDate)),
      achievedAt: null,
      xpAwarded: false,
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

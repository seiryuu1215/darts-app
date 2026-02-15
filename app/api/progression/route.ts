import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withAuth, withErrorHandler } from '@/lib/api-middleware';
import { XP_RULES } from '@/lib/progression/xp-rules';
import { calculateLevel } from '@/lib/progression/xp-engine';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * GET /api/progression — 現在のXP・レベル・ランク・実績・履歴を返す
 */
export const GET = withErrorHandler(
  withAuth(async (_req: NextRequest, { userId }) => {
    const userDoc = await adminDb.doc(`users/${userId}`).get();
    const userData = userDoc.data() || {};

    const xp = userData.xp ?? 0;
    const achievements = userData.achievements ?? [];
    const levelInfo = calculateLevel(xp);

    // 直近20件のXP履歴
    const historySnap = await adminDb
      .collection(`users/${userId}/xpHistory`)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const history = historySnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        action: d.action,
        xp: d.xp,
        detail: d.detail,
        createdAt: d.createdAt?.toDate?.()?.toISOString() ?? '',
      };
    });

    return NextResponse.json({
      xp,
      level: levelInfo.level,
      rank: levelInfo.rank,
      currentLevelXp: levelInfo.currentLevelXp,
      nextLevelXp: levelInfo.nextLevelXp,
      achievements,
      history,
    });
  }),
  'Progression GET error',
);

/**
 * POST /api/progression — XP付与
 * Body: { action: string, detail?: string, count?: number }
 */
export const POST = withErrorHandler(
  withAuth(async (req: NextRequest, { userId }) => {
    const body = await req.json();
    const { action, detail, count } = body as {
      action: string;
      detail?: string;
      count?: number;
    };

    const rule = XP_RULES[action];
    if (!rule) {
      return NextResponse.json({ error: '不明なアクションです' }, { status: 400 });
    }

    const multiplier = count && count > 0 ? count : 1;
    const xpGained = rule.xp * multiplier;

    const userRef = adminDb.doc(`users/${userId}`);

    // XPを加算
    await userRef.set({ xp: FieldValue.increment(xpGained) }, { merge: true });

    // 更新後のユーザーデータを取得
    const updatedUser = await userRef.get();
    const userData = updatedUser.data() || {};
    const newXp = userData.xp ?? 0;
    const oldLevel = userData.level ?? 1;
    const levelInfo = calculateLevel(newXp);

    // レベル・ランクを更新
    await userRef.update({
      level: levelInfo.level,
      rank: levelInfo.rank,
    });

    // XP履歴を記録
    await adminDb.collection(`users/${userId}/xpHistory`).add({
      action,
      xp: xpGained,
      detail: detail || rule.label,
      createdAt: FieldValue.serverTimestamp(),
    });

    const leveledUp = levelInfo.level > oldLevel;

    return NextResponse.json({
      xpGained,
      totalXp: newXp,
      level: levelInfo.level,
      rank: levelInfo.rank,
      currentLevelXp: levelInfo.currentLevelXp,
      nextLevelXp: levelInfo.nextLevelXp,
      leveledUp,
    });
  }),
  'Progression POST error',
);

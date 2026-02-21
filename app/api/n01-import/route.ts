import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withAuth, withErrorHandler } from '@/lib/api-middleware';
import { FieldValue } from 'firebase-admin/firestore';
import { parseN01Csv } from '@/lib/n01-parser';
import { calculateLevel } from '@/lib/progression/xp-engine';

/**
 * POST /api/n01-import — n01 CSVデータをインポート
 * Body: { csvText: string }
 */
export const POST = withErrorHandler(
  withAuth(async (req: NextRequest, { userId }) => {
    const body = await req.json();
    const { csvText } = body as { csvText: string };

    if (!csvText || typeof csvText !== 'string') {
      return NextResponse.json({ error: 'CSVデータが必要です' }, { status: 400 });
    }

    if (csvText.length > 1_000_000) {
      return NextResponse.json(
        { error: 'ファイルサイズが大きすぎます（1MB上限）' },
        { status: 400 },
      );
    }

    const result = parseN01Csv(csvText);

    if (result.sessions.length === 0) {
      return NextResponse.json(
        { error: 'インポート可能なセッションがありません', errors: result.errors },
        { status: 400 },
      );
    }

    // n01Sessions サブコレクションに保存
    const batch = adminDb.batch();
    const collectionRef = adminDb.collection(`users/${userId}/n01Sessions`);

    for (const session of result.sessions) {
      const docRef = collectionRef.doc();
      batch.set(docRef, {
        date: session.date,
        gameType: session.gameType,
        rounds: session.rounds,
        totalScore: session.totalScore,
        avgPerRound: session.avgPerRound,
        importedAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    // XP付与: n01_import (5 XP)
    try {
      const userRef = adminDb.doc(`users/${userId}`);
      await userRef.set({ xp: FieldValue.increment(5) }, { merge: true });

      const updatedUser = await userRef.get();
      const updatedXp = updatedUser.data()?.xp ?? 0;
      const levelInfo = calculateLevel(updatedXp);
      await userRef.update({ level: levelInfo.level, rank: levelInfo.rank });

      await adminDb.collection(`users/${userId}/xpHistory`).add({
        action: 'n01_import',
        xp: 5,
        detail: `n01データ取り込み (${result.sessions.length}セッション)`,
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (e) {
      console.error('n01 import XP error:', e);
    }

    return NextResponse.json({
      success: true,
      imported: result.sessions.length,
      errors: result.errors,
      totalRows: result.totalRows,
    });
  }),
  'n01 Import POST error',
);

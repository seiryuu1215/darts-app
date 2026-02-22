import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { decrypt } from '@/lib/crypto';
import { withAdmin, withErrorHandler } from '@/lib/api-middleware';
import { dlApiFullSync } from '@/lib/dartslive-api';

export const maxDuration = 60;

export const POST = withErrorHandler(
  withAdmin(async (_req: NextRequest, ctx) => {
    const userId = ctx.userId;

    // DL認証情報を取得・復号
    const userDoc = await adminDb.doc(`users/${userId}`).get();
    const userData = userDoc.data();
    if (!userData?.dlCredentialsEncrypted?.email || !userData?.dlCredentialsEncrypted?.password) {
      return NextResponse.json({ error: 'DARTSLIVE認証情報が保存されていません' }, { status: 400 });
    }

    const dlEmail = decrypt(userData.dlCredentialsEncrypted.email);
    const dlPassword = decrypt(userData.dlCredentialsEncrypted.password);

    // API フル同期
    const result = await dlApiFullSync(dlEmail, dlPassword);

    // 1. dartsliveApiCache/latest に保存
    await adminDb.doc(`users/${userId}/dartsliveApiCache/latest`).set({
      bundle: JSON.stringify(result.bundle),
      dailyHistoryCount: result.dailyHistory.length,
      monthlyHistory: JSON.stringify(result.monthlyHistory),
      recentPlays: JSON.stringify(result.recentPlays.slice(0, 100)),
      lastSyncAt: FieldValue.serverTimestamp(),
    });

    // 2. dartsLiveStats/{YYYY-MM-DD} にバッチ書き込み (500件チャンク)
    const chunkSize = 500;
    for (let i = 0; i < result.dailyHistory.length; i += chunkSize) {
      const chunk = result.dailyHistory.slice(i, i + chunkSize);
      const batch = adminDb.batch();

      for (const day of chunk) {
        if (!day.date) continue;
        const dateStr = day.date.replace(/\//g, '-');
        const docRef = adminDb.doc(`users/${userId}/dartsLiveStats/${dateStr}`);
        batch.set(
          docRef,
          {
            date: new Date(dateStr + 'T00:00:00+09:00'),
            rating: day.rating,
            stats01Avg: day.stats01Avg,
            statsCriAvg: day.statsCriAvg,
            stats01Avg100: day.stats01Avg100,
            statsCriAvg100: day.statsCriAvg100,
            source: 'api',
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }

      await batch.commit();
    }

    // 3. dartsliveCache/latest に enriched データを merge
    const {
      userData: apiUserData,
      totalAward,
      bestRecords,
      gameAverages,
      myDartsInfo,
    } = result.bundle;

    await adminDb.doc(`users/${userId}/dartsliveCache/latest`).set(
      {
        maxRating: apiUserData.maxRating,
        maxRatingDate: apiUserData.maxRatingDate,
        stats01Detailed: {
          avg: apiUserData.stats01Avg,
          best: apiUserData.stats01Best,
          winRate: apiUserData.stats01WinRate,
          bullRate: apiUserData.stats01BullRate,
          arrangeRate: apiUserData.stats01ArrangeRate,
          avgBust: apiUserData.stats01AvgBust,
          avg100: apiUserData.stats01Avg100,
        },
        statsCricketDetailed: {
          avg: apiUserData.statsCriAvg,
          best: apiUserData.statsCriBest,
          winRate: apiUserData.statsCriWinRate,
          tripleRate: apiUserData.statsCriTripleRate,
          openCloseRate: apiUserData.statsCriOpenCloseRate,
          avg100: apiUserData.statsCriAvg100,
        },
        bestRecords: JSON.stringify(bestRecords),
        gameAverages: JSON.stringify(gameAverages),
        myDartsInfo: myDartsInfo ? JSON.stringify(myDartsInfo) : null,
        totalAward: JSON.stringify(totalAward),
        apiSyncAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return NextResponse.json({
      success: true,
      dailyHistoryImported: result.dailyHistory.length,
      recentPlaysCount: result.recentPlays.length,
    });
  }),
  'DARTSLIVE API同期エラー',
);

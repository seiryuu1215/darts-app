import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { decrypt } from '@/lib/crypto';
import { dlApiDiffSync, dlApiFullSync, mapApiToScrapedStats } from '@/lib/dartslive-api';

export const maxDuration = 300;

/**
 * DARTSLIVE API 差分同期 cron (6時間ごと)
 * admin + DL認証保存済みユーザーを対象に差分同期を実行
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: { userId: string; status: string; error?: string }[] = [];

  try {
    // admin + DL認証保存済みユーザーを取得
    const usersSnap = await adminDb.collection('users').where('role', '==', 'admin').get();

    const eligibleUsers = usersSnap.docs.filter((doc) => {
      const data = doc.data();
      return data.dlCredentialsEncrypted?.email && data.dlCredentialsEncrypted?.password;
    });

    if (eligibleUsers.length === 0) {
      return NextResponse.json({ message: 'No eligible users', results });
    }

    for (const userDoc of eligibleUsers) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      try {
        const dlEmail = decrypt(userData.dlCredentialsEncrypted.email);
        const dlPassword = decrypt(userData.dlCredentialsEncrypted.password);

        // lastSyncAt を取得
        const apiCacheDoc = await adminDb.doc(`users/${userId}/dartsliveApiCache/latest`).get();
        const lastSyncAt = apiCacheDoc.exists
          ? (apiCacheDoc.data()?.lastSyncAt?.toDate?.()?.toISOString() ?? null)
          : null;

        // 差分 or フル同期を判定
        let result;
        if (lastSyncAt) {
          console.log(`[DL-DIFF-SYNC] ${userId}: 差分同期 (since ${lastSyncAt})`);
          result = await dlApiDiffSync(dlEmail, dlPassword, lastSyncAt);
        } else {
          console.log(`[DL-DIFF-SYNC] ${userId}: フル同期 (初回)`);
          result = await dlApiFullSync(dlEmail, dlPassword);
        }

        // Firestore マージ書き込み
        const coreWrites: Promise<unknown>[] = [];

        // 1. dartsliveApiCache/latest — bundle 上書き
        coreWrites.push(
          adminDb.doc(`users/${userId}/dartsliveApiCache/latest`).set({
            bundle: JSON.stringify(result.bundle),
            dailyHistoryCount: result.dailyHistory.length,
            monthlyHistory: JSON.stringify(result.monthlyHistory),
            recentPlays: JSON.stringify(result.recentPlays.slice(0, 100)),
            lastSyncAt: FieldValue.serverTimestamp(),
          }),
        );

        // 2. COUNT-UPプレイデータをマージ
        if (result.countupPlays.length > 0) {
          const countupRef = adminDb.doc(`users/${userId}/dartsliveApiCache/countupPlays`);
          const existingDoc = await countupRef.get();
          let mergedPlays = result.countupPlays;

          if (existingDoc.exists) {
            try {
              const existingPlays = JSON.parse(existingDoc.data()?.plays ?? '[]');
              const existingTimes = new Set(existingPlays.map((p: { time: string }) => p.time));
              const newPlays = result.countupPlays.filter((p) => !existingTimes.has(p.time));
              mergedPlays = [...existingPlays, ...newPlays];
            } catch {
              // パースエラー時は新規データで上書き
            }
          }

          coreWrites.push(
            countupRef.set({
              plays: JSON.stringify(mergedPlays),
              count: mergedPlays.length,
              lastSyncAt: FieldValue.serverTimestamp(),
            }),
          );
        }

        // 3. dartsliveCache/latest — enriched データ更新
        const {
          userData: apiUser,
          bestRecords,
          gameAverages,
          myDartsInfo,
          totalAward,
        } = result.bundle;
        const stats = mapApiToScrapedStats(result);

        coreWrites.push(
          adminDb.doc(`users/${userId}/dartsliveCache/latest`).set(
            {
              rating: stats.rating,
              ratingInt: stats.ratingInt,
              stats01Avg: stats.stats01Avg,
              statsCriAvg: stats.statsCriAvg,
              maxRating: apiUser.maxRating,
              maxRatingDate: apiUser.maxRatingDate,
              stats01Detailed: {
                avg: apiUser.stats01Avg,
                best: apiUser.stats01Best,
                winRate: apiUser.stats01WinRate,
                bullRate: apiUser.stats01BullRate,
                arrangeRate: apiUser.stats01ArrangeRate,
                avgBust: apiUser.stats01AvgBust,
                avg100: apiUser.stats01Avg100,
              },
              statsCricketDetailed: {
                avg: apiUser.statsCriAvg,
                best: apiUser.statsCriBest,
                winRate: apiUser.statsCriWinRate,
                tripleRate: apiUser.statsCriTripleRate,
                openCloseRate: apiUser.statsCriOpenCloseRate,
                avg100: apiUser.statsCriAvg100,
              },
              bestRecords: JSON.stringify(bestRecords),
              gameAverages: JSON.stringify(gameAverages),
              myDartsInfo: myDartsInfo ? JSON.stringify(myDartsInfo) : null,
              totalAward: JSON.stringify(totalAward),
              apiSyncAt: FieldValue.serverTimestamp(),
            },
            { merge: true },
          ),
        );

        await Promise.all(coreWrites);

        // 4. dartsLiveStats/{date} — 新規日付のみ追加
        if (result.dailyHistory.length > 0) {
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
        }

        results.push({
          userId,
          status: lastSyncAt ? 'diff_sync' : 'full_sync',
        });
        console.log(
          `[DL-DIFF-SYNC] ${userId}: 完了 daily=${result.dailyHistory.length}, plays=${result.recentPlays.length}, countup=${result.countupPlays.length}`,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[DL-DIFF-SYNC] ${userId}: エラー —`, msg);
        results.push({ userId, status: 'error', error: msg });
      }
    }
  } catch (err) {
    console.error('[DL-DIFF-SYNC] cron job error:', err);
    return NextResponse.json(
      { error: 'Cron job failed', details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }

  return NextResponse.json({
    message: `Processed ${results.length} users`,
    results,
  });
}

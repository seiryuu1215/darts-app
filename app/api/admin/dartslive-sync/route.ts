import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { decrypt } from '@/lib/crypto';
import { withAdmin, withErrorHandler } from '@/lib/api-middleware';
import { dlApiFullSync, dlApiDiffSync } from '@/lib/dartslive-api';

export const maxDuration = 60;

export const POST = withErrorHandler(
  withAdmin(async (req: NextRequest, ctx) => {
    const userId = ctx.userId;

    // forceFullSync フラグを取得
    let forceFullSync = false;
    try {
      const body = await req.json();
      forceFullSync = body.forceFullSync === true;
    } catch {
      /* ボディなしの場合は無視 */
    }

    // DL認証情報を取得・復号
    const userDoc = await adminDb.doc(`users/${userId}`).get();
    const userData = userDoc.data();
    if (!userData?.dlCredentialsEncrypted?.email || !userData?.dlCredentialsEncrypted?.password) {
      return NextResponse.json({ error: 'DARTSLIVE認証情報が保存されていません' }, { status: 400 });
    }

    const dlEmail = decrypt(userData.dlCredentialsEncrypted.email);
    const dlPassword = decrypt(userData.dlCredentialsEncrypted.password);

    // 保存済みプレイの最新日時を取得し、差分同期の起点にする
    let latestPlayTime: string | null = null;
    if (!forceFullSync) {
      const countupDoc = await adminDb.doc(`users/${userId}/dartsliveApiCache/countupPlays`).get();
      if (countupDoc.exists) {
        try {
          const existingPlays = JSON.parse(countupDoc.data()?.plays ?? '[]') as {
            time: string;
          }[];
          if (existingPlays.length > 0) {
            latestPlayTime = existingPlays
              .map((p) => p.time)
              .sort()
              .pop()!;
          }
        } catch {
          // パースエラー時はフル同期にフォールバック
        }
      }
    }

    let result;
    try {
      if (latestPlayTime && !forceFullSync) {
        // 保存済みの最新プレイ日時(JST)を正しくUTCへ変換して差分取得
        const syncFrom = new Date(latestPlayTime.replace(/ |_/, 'T') + '+09:00').toISOString();
        console.log(
          `[DL-SYNC] 差分同期開始 (since ${syncFrom}, latest play: ${latestPlayTime})...`,
        );
        result = await dlApiDiffSync(dlEmail, dlPassword, syncFrom);
      } else {
        console.log(`[DL-SYNC] フル同期開始 (${forceFullSync ? '強制' : '初回'})...`);
        result = await dlApiFullSync(dlEmail, dlPassword);
      }
      console.log(
        `[DL-SYNC] API取得完了: daily=${result.dailyHistory.length}, plays=${result.recentPlays.length}, countup=${result.countupPlays.length}`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[DL-SYNC] API取得エラー:', msg);
      if (msg.includes('500')) {
        return NextResponse.json(
          {
            error:
              'DARTSLIVEサーバーが一時的に利用できません。しばらく待ってから再試行してください。',
          },
          { status: 502 },
        );
      }
      if (msg.includes('LOGIN_FAILED')) {
        return NextResponse.json(
          { error: `DARTSLIVEログインに失敗しました。認証情報を確認してください。(${msg})` },
          { status: 401 },
        );
      }
      throw err;
    }

    // Firestore書き込み — 重要データを先に保存（タイムアウト対策）
    try {
      // Phase 1: 最重要データ（キャッシュ + countup + enriched）
      console.log('[DL-SYNC] Phase 1: コアデータ書き込み...');
      const coreWrites: Promise<unknown>[] = [];

      // 1. dartsliveApiCache/latest
      coreWrites.push(
        adminDb.doc(`users/${userId}/dartsliveApiCache/latest`).set({
          bundle: JSON.stringify(result.bundle),
          dailyHistoryCount: result.dailyHistory.length,
          monthlyHistory: JSON.stringify(result.monthlyHistory),
          recentPlays: JSON.stringify(result.recentPlays.slice(0, 100)),
          lastSyncAt: FieldValue.serverTimestamp(),
        }),
      );

      // 2. COUNT-UPプレイデータをマージ（フル同期時は上書き）
      if (result.countupPlays.length > 0) {
        const countupRef = adminDb.doc(`users/${userId}/dartsliveApiCache/countupPlays`);
        let mergedPlays = result.countupPlays;

        if (!forceFullSync) {
          const existingDoc = await countupRef.get();
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
        }

        coreWrites.push(
          countupRef.set({
            plays: JSON.stringify(mergedPlays),
            count: mergedPlays.length,
            lastSyncAt: FieldValue.serverTimestamp(),
          }),
        );
      }

      // 3. dartsliveCache/latest enriched データ
      const {
        userData: apiUserData,
        totalAward,
        bestRecords,
        gameAverages,
        myDartsInfo,
      } = result.bundle;
      coreWrites.push(
        adminDb.doc(`users/${userId}/dartsliveCache/latest`).set(
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
        ),
      );

      await Promise.all(coreWrites);
      console.log('[DL-SYNC] Phase 1 完了');

      // Phase 2: 日別履歴（バッチ書き込み）
      if (result.dailyHistory.length > 0) {
        console.log(`[DL-SYNC] Phase 2: 日別履歴 ${result.dailyHistory.length}件...`);
        const chunkSize = 500;
        const batchWrites: Promise<unknown>[] = [];
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
          batchWrites.push(batch.commit());
        }
        await Promise.all(batchWrites);
        console.log('[DL-SYNC] Phase 2 完了');
      }
    } catch (writeErr) {
      console.error('[DL-SYNC] Firestore書き込みエラー:', writeErr);
      // コアデータは保存済みかもしれないので partial success を返す
      return NextResponse.json({
        success: true,
        partial: true,
        error: 'データは取得できましたが、一部の書き込みに失敗しました',
        dailyHistoryImported: result.dailyHistory.length,
        recentPlaysCount: result.recentPlays.length,
        countupPlaysCount: result.countupPlays.length,
      });
    }

    return NextResponse.json({
      success: true,
      dailyHistoryImported: result.dailyHistory.length,
      recentPlaysCount: result.recentPlays.length,
      countupPlaysCount: result.countupPlays.length,
    });
  }),
  'DARTSLIVE API同期エラー',
);

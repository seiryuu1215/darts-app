import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { decrypt } from '@/lib/crypto';
import {
  sendLinePushMessage,
  buildStatsFlexMessage,
  buildAchievementFlexMessage,
} from '@/lib/line';
import {
  calculateCronXp,
  calculateLevel,
  checkAchievements,
  type CronStatsSnapshot,
  type AchievementSnapshot,
} from '@/lib/progression/xp-engine';
import { ACHIEVEMENT_MAP } from '@/lib/progression/achievements';
import { calculateGoalCurrent, calculateScaledGoalXp, getDailyRange, type StatsRecord } from '@/lib/goals';
import type { GoalType } from '@/types';
import { launchBrowser, createPage, login, scrapeStats } from '@/lib/dartslive-scraper';

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  // Vercel Cron 認証
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: { userId: string; status: string; error?: string }[] = [];

  try {
    // LINE連携 + DL認証保存済みユーザーを取得
    const usersSnap = await adminDb.collection('users').where('lineUserId', '!=', null).get();

    const eligibleUsers = usersSnap.docs.filter((doc) => {
      const data = doc.data();
      return (
        data.lineNotifyEnabled !== false &&
        data.dlCredentialsEncrypted?.email &&
        data.dlCredentialsEncrypted?.password
      );
    });

    if (eligibleUsers.length === 0) {
      return NextResponse.json({ message: 'No eligible users', results });
    }

    // ブラウザ起動（全ユーザーで共有）
    const browser = await launchBrowser();

    try {
      for (const userDoc of eligibleUsers) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        const lineUserId = userData.lineUserId;

        try {
          // DL認証情報を復号
          const dlEmail = decrypt(userData.dlCredentialsEncrypted.email);
          const dlPassword = decrypt(userData.dlCredentialsEncrypted.password);

          // 新しいページでスタッツ取得
          const page = await createPage(browser);

          try {
            const loginSuccess = await login(page, dlEmail, dlPassword);
            if (!loginSuccess) {
              throw new Error('LOGIN_FAILED');
            }
            const stats = await scrapeStats(page);

            // 前回キャッシュと比較
            const cacheRef = adminDb.doc(`users/${userId}/dartsliveCache/latest`);
            const prevDoc = await cacheRef.get();
            const prevData = prevDoc.exists ? prevDoc.data() : null;

            const hasChange =
              !prevData ||
              prevData.rating !== stats.rating ||
              prevData.stats01Avg !== stats.stats01Avg ||
              prevData.statsCriAvg !== stats.statsCriAvg;

            // ゲーム数合計を算出 (dartsLiveStatsのgamesPlayed合計)
            const gamesSnap = await adminDb
              .collection(`users/${userId}/dartsLiveStats`)
              .select('gamesPlayed')
              .get();
            const totalGames = gamesSnap.docs.reduce(
              (sum, d) => sum + (d.data().gamesPlayed ?? 0),
              0,
            );

            // 連続プレイ日数（streak）計算
            const todayJST = new Date();
            todayJST.setHours(todayJST.getHours() + 9);
            const todayStr = `${todayJST.getFullYear()}-${String(todayJST.getMonth() + 1).padStart(2, '0')}-${String(todayJST.getDate()).padStart(2, '0')}`;
            const prevLastPlayDate = prevData?.lastPlayDate ?? null;
            const prevStreak = prevData?.currentStreak ?? 0;

            let currentStreak: number;
            if (hasChange) {
              // データ変化あり = 今日プレイした
              if (prevLastPlayDate) {
                const prevDate = new Date(prevLastPlayDate + 'T00:00:00+09:00');
                const todayDate = new Date(todayStr + 'T00:00:00+09:00');
                const diffDays = Math.round((todayDate.getTime() - prevDate.getTime()) / 86400000);
                if (diffDays === 1) {
                  currentStreak = prevStreak + 1;
                } else if (diffDays === 0) {
                  currentStreak = prevStreak; // 同日
                } else {
                  currentStreak = 1; // 途切れた
                }
              } else {
                currentStreak = 1;
              }
            } else {
              currentStreak = prevStreak;
            }

            if (hasChange) {
              // dartsLiveStats ドキュメント自動作成（既存なら上書きしない）
              const statsDocRef = adminDb.doc(`users/${userId}/dartsLiveStats/${todayStr}`);
              const existingStatsDoc = await statsDocRef.get();
              if (!existingStatsDoc.exists) {
                await statsDocRef.set({
                  date: new Date(todayStr + 'T00:00:00+09:00'),
                  rating: stats.rating,
                  gamesPlayed: 0,
                  bullStats: {
                    dBull: stats.dBullTotal,
                    sBull: stats.sBullTotal,
                    dBullMonthly: stats.dBullMonthly,
                    sBullMonthly: stats.sBullMonthly,
                  },
                  hatTricks: stats.hatTricksTotal,
                  hatTricksMonthly: stats.hatTricksMonthly,
                  source: 'cron',
                  createdAt: FieldValue.serverTimestamp(),
                });
              }

              // ドキュメント追加後に再集計して正確な値を取得
              const freshGamesSnap = await adminDb
                .collection(`users/${userId}/dartsLiveStats`)
                .select('gamesPlayed')
                .get();
              const freshTotalGames = freshGamesSnap.docs.reduce(
                (sum, d) => sum + (d.data().gamesPlayed ?? 0),
                0,
              );
              const freshTotalPlayDays = freshGamesSnap.size;

              // キャッシュ更新
              await cacheRef.set(
                {
                  rating: stats.rating,
                  ratingInt: stats.ratingInt,
                  stats01Avg: stats.stats01Avg,
                  statsCriAvg: stats.statsCriAvg,
                  bullStats: {
                    dBull: stats.dBullTotal,
                    sBull: stats.sBullTotal,
                    dBullMonthly: stats.dBullMonthly,
                    sBullMonthly: stats.sBullMonthly,
                  },
                  hatTricks: stats.hatTricksTotal,
                  hatTricksMonthly: stats.hatTricksMonthly,
                  ton80: stats.ton80,
                  lowTon: stats.lowTon,
                  highTon: stats.highTon,
                  threeInABed: stats.threeInABed,
                  threeInABlack: stats.threeInABlack,
                  whiteHorse: stats.whiteHorse,
                  totalGames: freshTotalGames,
                  totalPlayDays: freshTotalPlayDays,
                  lastPlayDate: todayStr,
                  currentStreak,
                  prevRating: prevData?.rating ?? null,
                  prevStats01Avg: prevData?.stats01Avg ?? null,
                  prevStatsCriAvg: prevData?.statsCriAvg ?? null,
                  updatedAt: FieldValue.serverTimestamp(),
                },
                { merge: true },
              );

              // 昨日の日付文字列 (JST)
              const yesterday = new Date();
              yesterday.setHours(yesterday.getHours() + 9); // UTC→JST
              yesterday.setDate(yesterday.getDate() - 1);
              const dateStr = `${yesterday.getFullYear()}/${String(yesterday.getMonth() + 1).padStart(2, '0')}/${String(yesterday.getDate()).padStart(2, '0')}`;

              // LINE通知送信（前回キャッシュとの差分表示）
              const flexMsg = buildStatsFlexMessage({
                date: dateStr,
                rating: stats.rating,
                ppd: stats.stats01Avg,
                mpr: stats.statsCriAvg,
                prevRating: prevData?.rating ?? null,
                awards: {
                  dBull: stats.dBullTotal,
                  sBull: stats.sBullTotal,
                  hatTricks: stats.hatTricksTotal,
                  ton80: stats.ton80,
                  lowTon: stats.lowTon,
                  highTon: stats.highTon,
                  threeInABed: stats.threeInABed,
                  threeInABlack: stats.threeInABlack,
                  whiteHorse: stats.whiteHorse,
                },
                prevAwards: prevData
                  ? {
                      dBull: prevData.bullStats?.dBull ?? 0,
                      sBull: prevData.bullStats?.sBull ?? 0,
                      hatTricks: prevData.hatTricks ?? 0,
                      ton80: prevData.ton80 ?? 0,
                      lowTon: prevData.lowTon ?? 0,
                      highTon: prevData.highTon ?? 0,
                      threeInABed: prevData.threeInABed ?? 0,
                      threeInABlack: prevData.threeInABlack ?? 0,
                      whiteHorse: prevData.whiteHorse ?? 0,
                    }
                  : undefined,
              });
              await sendLinePushMessage(lineUserId, [flexMsg]);

              // 会話状態を waiting_condition にセット
              await adminDb.doc(`lineConversations/${lineUserId}`).set({
                state: 'waiting_condition',
                pendingStats: {
                  date: dateStr,
                  rating: stats.rating,
                  ppd: stats.stats01Avg,
                  mpr: stats.statsCriAvg,
                  avg01: stats.stats01Avg,
                  dBullTotal: stats.dBullTotal,
                  sBullTotal: stats.sBullTotal,
                  ton80: stats.ton80,
                  lowTon: stats.lowTon,
                  highTon: stats.highTon,
                  threeInABed: stats.threeInABed,
                  threeInABlack: stats.threeInABlack,
                  whiteHorse: stats.whiteHorse,
                  hatTricksTotal: stats.hatTricksTotal,
                },
                condition: null,
                memo: null,
                updatedAt: FieldValue.serverTimestamp(),
              });

              results.push({ userId, status: 'notified' });
            }

            // XP自動付与: 前回/今回スタッツ差分からXPを算出
            try {
              // 累計プレイ日数 = dartsLiveStats のドキュメント数
              const totalPlayDays = gamesSnap.size;

              const prevSnapshot: CronStatsSnapshot = {
                totalGames: prevData?.totalGames ?? 0,
                streak: prevData?.streak ?? 0,
                totalPlayDays: prevData?.totalPlayDays ?? Math.max(0, totalPlayDays - 1),
                rating: prevData?.rating ?? null,
                hatTricks: prevData?.hatTricks ?? 0,
                ton80: prevData?.ton80 ?? 0,
                threeInABlack: prevData?.threeInABlack ?? 0,
                nineMark: prevData?.nineMark ?? 0,
                lowTon: prevData?.lowTon ?? 0,
                highTon: prevData?.highTon ?? 0,
                threeInABed: prevData?.threeInABed ?? 0,
                whiteHorse: prevData?.whiteHorse ?? 0,
              };
              const currentSnapshot: CronStatsSnapshot = {
                totalGames,
                streak: prevData?.streak ?? 0,
                totalPlayDays,
                rating: stats.rating,
                hatTricks: stats.hatTricksTotal,
                ton80: stats.ton80,
                threeInABlack: stats.threeInABlack,
                nineMark: prevData?.nineMark ?? 0,
                lowTon: stats.lowTon,
                highTon: stats.highTon,
                threeInABed: stats.threeInABed,
                whiteHorse: stats.whiteHorse,
              };

              const xpActions = calculateCronXp(prevData ? prevSnapshot : null, currentSnapshot);

              if (xpActions.length > 0) {
                const totalXpGained = xpActions.reduce((sum, a) => sum + a.xp, 0);
                const userRef = adminDb.doc(`users/${userId}`);

                // XP加算
                await userRef.set({ xp: FieldValue.increment(totalXpGained) }, { merge: true });

                // レベル更新
                const updatedUser = await userRef.get();
                const updatedXp = updatedUser.data()?.xp ?? 0;
                const levelInfo = calculateLevel(updatedXp);
                await userRef.update({ level: levelInfo.level, rank: levelInfo.rank });

                // XP履歴記録
                for (const action of xpActions) {
                  await adminDb.collection(`users/${userId}/xpHistory`).add({
                    action: action.action,
                    xp: action.xp,
                    detail: `${action.label} x${action.count}`,
                    createdAt: FieldValue.serverTimestamp(),
                  });
                }

                // 通知をFirestoreに保存
                await adminDb.collection(`users/${userId}/notifications`).add({
                  type: 'xp_gained',
                  title: 'デイリーXP獲得!',
                  details: xpActions.map((a) => ({
                    action: a.action,
                    xp: a.xp,
                    label: a.label,
                  })),
                  totalXp: totalXpGained,
                  read: false,
                  createdAt: FieldValue.serverTimestamp(),
                });
              }
            } catch (xpErr) {
              console.error(`XP grant error for user ${userId}:`, xpErr);
            }

            // 実績判定
            try {
              const freshUserDoc = await adminDb.doc(`users/${userId}`).get();
              const freshUserData = freshUserDoc.data() || {};
              const existingAchievements: string[] = freshUserData.achievements ?? [];
              const prevHighestRating: number | null = freshUserData.highestRating ?? null;
              const userLevel: number = freshUserData.level ?? 1;

              // highestRating 更新（不可逆: 最高到達のみ記録）
              let highestRating = prevHighestRating;
              if (stats.rating != null) {
                if (highestRating == null || stats.rating > highestRating) {
                  highestRating = stats.rating;
                  await adminDb.doc(`users/${userId}`).update({ highestRating });
                }
              }

              // AchievementSnapshot 構築
              const achievementSnapshot: AchievementSnapshot = {
                totalGames,
                currentStreak,
                totalPlayDays: gamesSnap.size,
                highestRating,
                hatTricksTotal: stats.hatTricksTotal,
                ton80: stats.ton80,
                dBullTotal: stats.dBullTotal,
                sBullTotal: stats.sBullTotal,
                lowTon: stats.lowTon,
                highTon: stats.highTon,
                threeInABed: stats.threeInABed,
                whiteHorse: stats.whiteHorse,
                level: userLevel,
              };

              const newAchievementIds = checkAchievements(
                achievementSnapshot,
                existingAchievements,
              );

              if (newAchievementIds.length > 0) {
                const userRef = adminDb.doc(`users/${userId}`);
                // achievements 配列に追加
                await userRef.update({
                  achievements: FieldValue.arrayUnion(...newAchievementIds),
                });

                // 各実績10XP付与
                const achievementXp = newAchievementIds.length * 10;
                await userRef.set({ xp: FieldValue.increment(achievementXp) }, { merge: true });

                // レベル更新
                const afterUser = await userRef.get();
                const afterXp = afterUser.data()?.xp ?? 0;
                const afterLevel = calculateLevel(afterXp);
                await userRef.update({ level: afterLevel.level, rank: afterLevel.rank });

                // XP履歴
                for (const achId of newAchievementIds) {
                  const def = ACHIEVEMENT_MAP[achId];
                  await adminDb.collection(`users/${userId}/xpHistory`).add({
                    action: 'achievement_unlocked',
                    xp: 10,
                    detail: `実績解除: ${def?.name ?? achId}`,
                    createdAt: FieldValue.serverTimestamp(),
                  });
                }

                // LINE通知
                if (lineUserId) {
                  const achievementDefs = newAchievementIds
                    .map((id) => ACHIEVEMENT_MAP[id])
                    .filter(Boolean);
                  if (achievementDefs.length > 0) {
                    const flexMsg = buildAchievementFlexMessage(achievementDefs);
                    await sendLinePushMessage(lineUserId, [flexMsg]);
                  }
                }

                // notifications subcollection に保存
                await adminDb.collection(`users/${userId}/notifications`).add({
                  type: 'achievement_unlocked',
                  title: '実績解除!',
                  details: newAchievementIds.map((id) => ({
                    id,
                    name: ACHIEVEMENT_MAP[id]?.name ?? id,
                  })),
                  totalXp: achievementXp,
                  read: false,
                  createdAt: FieldValue.serverTimestamp(),
                });
              }
            } catch (achErr) {
              console.error(`Achievement check error for user ${userId}:`, achErr);
            }

            // 自動達成チェック: 未達成目標で current >= target のものを自動達成
            try {
              const goalsSnap = await adminDb
                .collection(`users/${userId}/goals`)
                .where('achievedAt', '==', null)
                .get();

              if (!goalsSnap.empty) {
                // dartsLiveStats レコードを取得
                const goalDocs = goalsSnap.docs.map((d) => ({
                  id: d.id,
                  ...d.data(),
                }));

                const startDates = goalDocs
                  .map((g) => (g as Record<string, unknown>).startDate)
                  .filter((d): d is FirebaseFirestore.Timestamp => d != null)
                  .map((d) => d.toDate());

                const earliestGoalStart =
                  startDates.length > 0
                    ? new Date(Math.min(...startDates.map((d) => d.getTime())))
                    : null;

                let goalRecords: StatsRecord[] = [];
                if (earliestGoalStart) {
                  const baselineStart = new Date(
                    earliestGoalStart.getTime() - 30 * 24 * 60 * 60 * 1000,
                  );
                  const goalStatsSnap = await adminDb
                    .collection(`users/${userId}/dartsLiveStats`)
                    .where('date', '>=', baselineStart)
                    .orderBy('date', 'asc')
                    .get();
                  goalRecords = goalStatsSnap.docs.map((doc) => {
                    const dd = doc.data();
                    const dateVal = dd.date?.toDate?.() ?? (dd.date ? new Date(dd.date) : null);
                    return {
                      date: dateVal ? dateVal.toISOString() : '',
                      rating: dd.rating ?? null,
                      gamesPlayed: dd.gamesPlayed ?? 0,
                      dBull: dd.bullStats?.dBull ?? null,
                      sBull: dd.bullStats?.sBull ?? null,
                      hatTricks: dd.hatTricks ?? null,
                    } as StatsRecord;
                  });
                }

                // キャッシュレコードを追加
                const cacheRefForGoals = adminDb.doc(`users/${userId}/dartsliveCache/latest`);
                const goalCacheDoc = await cacheRefForGoals.get();
                const goalCacheData = goalCacheDoc.exists ? goalCacheDoc.data()! : null;

                if (goalCacheData) {
                  const cacheDate = goalCacheData.updatedAt?.toDate?.() ?? new Date();
                  let gcDBull: number | null = goalCacheData.bullStats?.dBull ?? null;
                  let gcSBull: number | null = goalCacheData.bullStats?.sBull ?? null;
                  let gcHatTricks: number | null = goalCacheData.hatTricks ?? null;

                  if (gcDBull === null && goalCacheData.fullData) {
                    try {
                      const full = JSON.parse(goalCacheData.fullData);
                      const awards = full?.current?.awards ?? {};
                      gcDBull = awards['D-BULL']?.total ?? null;
                      gcSBull = awards['S-BULL']?.total ?? null;
                      if (gcHatTricks === null) {
                        gcHatTricks =
                          awards['HAT TRICK']?.total ?? awards['Hat Trick']?.total ?? null;
                      }
                    } catch {
                      /* ignore */
                    }
                  }

                  const lastDate =
                    goalRecords.length > 0
                      ? new Date(goalRecords[goalRecords.length - 1].date).getTime()
                      : 0;
                  if (cacheDate.getTime() > lastDate) {
                    goalRecords.push({
                      date: cacheDate.toISOString(),
                      rating: goalCacheData.rating ?? null,
                      gamesPlayed: 0,
                      dBull: gcDBull,
                      sBull: gcSBull,
                      hatTricks: gcHatTricks,
                    });
                  }
                }

                // 月間アワード値
                let cronMonthlyBulls: number | null = null;
                let cronMonthlyHatTricks: number | null = null;
                if (goalCacheData) {
                  const dBullM = goalCacheData.bullStats?.dBullMonthly ?? null;
                  const sBullM = goalCacheData.bullStats?.sBullMonthly ?? null;
                  if (dBullM !== null || sBullM !== null) {
                    cronMonthlyBulls = (dBullM ?? 0) + (sBullM ?? 0);
                  }
                  cronMonthlyHatTricks = goalCacheData.hatTricksMonthly ?? null;
                }

                for (const goalDoc of goalDocs) {
                  const g = goalDoc as Record<string, unknown>;
                  const goalType = g.type as GoalType;
                  const goalPeriod = g.period as string;
                  const goalTarget = g.target as number;
                  const goalBaseline = (g.baseline ?? null) as number | null;
                  const goalStartDate =
                    (g.startDate as FirebaseFirestore.Timestamp | null)?.toDate?.() ?? null;
                  const goalEndDate =
                    (g.endDate as FirebaseFirestore.Timestamp | null)?.toDate?.() ?? null;

                  // 期限切れは無視
                  if (goalEndDate && goalEndDate.getTime() < new Date().getTime()) continue;

                  let current = 0;

                  if (goalPeriod === 'daily' && goalBaseline !== null) {
                    if (goalType === 'bulls' && goalCacheData) {
                      let dB: number | null = goalCacheData.bullStats?.dBull ?? null;
                      let sB: number | null = goalCacheData.bullStats?.sBull ?? null;
                      if (dB === null && goalCacheData.fullData) {
                        try {
                          const full = JSON.parse(goalCacheData.fullData);
                          const awards = full?.current?.awards ?? {};
                          dB = awards['D-BULL']?.total ?? null;
                          sB = awards['S-BULL']?.total ?? null;
                        } catch {
                          /* ignore */
                        }
                      }
                      current = Math.max(0, (dB ?? 0) + (sB ?? 0) - goalBaseline);
                    } else if (goalType === 'hat_tricks' && goalCacheData) {
                      let ht = goalCacheData.hatTricks ?? 0;
                      if (!ht && goalCacheData.fullData) {
                        try {
                          const full = JSON.parse(goalCacheData.fullData);
                          const awards = full?.current?.awards ?? {};
                          ht = awards['HAT TRICK']?.total ?? awards['Hat Trick']?.total ?? 0;
                        } catch {
                          /* ignore */
                        }
                      }
                      current = Math.max(0, ht - goalBaseline);
                    } else if (goalType === 'games') {
                      const { startDate: dStart, endDate: dEnd } = getDailyRange();
                      const dRecords = goalRecords.filter((r) => {
                        const t = new Date(r.date).getTime();
                        return t >= dStart.getTime() && t <= dEnd.getTime();
                      });
                      const todayGames = dRecords.reduce((sum, r) => sum + (r.gamesPlayed || 0), 0);
                      current = Math.max(0, todayGames - goalBaseline);
                    }
                  } else if (
                    goalPeriod === 'monthly' &&
                    goalType === 'bulls' &&
                    cronMonthlyBulls !== null
                  ) {
                    current = cronMonthlyBulls;
                  } else if (
                    goalPeriod === 'monthly' &&
                    goalType === 'hat_tricks' &&
                    cronMonthlyHatTricks !== null
                  ) {
                    current = cronMonthlyHatTricks;
                  } else if (
                    goalType !== 'cu_score' &&
                    goalStartDate &&
                    goalEndDate &&
                    goalRecords.length > 0
                  ) {
                    const startMs = goalStartDate.getTime();
                    const endMs = goalEndDate.getTime() + 24 * 60 * 60 * 1000;
                    const periodRecs = goalRecords.filter((r) => {
                      const t = new Date(r.date).getTime();
                      return t >= startMs && t < endMs;
                    });
                    let baselineRec: StatsRecord | undefined;
                    if (goalType === 'bulls' || goalType === 'hat_tricks') {
                      const beforeRecs = goalRecords.filter(
                        (r) => new Date(r.date).getTime() < startMs,
                      );
                      if (beforeRecs.length > 0) baselineRec = beforeRecs[beforeRecs.length - 1];
                    }
                    current = calculateGoalCurrent(goalType, periodRecs, baselineRec);
                  }

                  if (current >= goalTarget && goalTarget > 0) {
                    // 自動達成: XP付与（スケーリング） + 削除
                    const xpAmt = calculateScaledGoalXp(goalType, goalPeriod, goalTarget);
                    const xpAct = goalPeriod === 'daily' ? 'daily_goal_achieved' : 'goal_achieved';
                    const userRef = adminDb.doc(`users/${userId}`);
                    await userRef.set({ xp: FieldValue.increment(xpAmt) }, { merge: true });
                    await adminDb.collection(`users/${userId}/xpHistory`).add({
                      action: xpAct,
                      xp: xpAmt,
                      detail: `目標自動達成: ${goalType}`,
                      createdAt: FieldValue.serverTimestamp(),
                    });
                    await adminDb.doc(`users/${userId}/goals/${goalDoc.id}`).delete();

                    // 達成通知をFirestoreに保存
                    await adminDb.collection(`users/${userId}/notifications`).add({
                      type: 'goal_achieved',
                      title: '目標達成!',
                      details: [{ action: xpAct, xp: xpAmt, label: `${goalType} 目標達成` }],
                      totalXp: xpAmt,
                      read: false,
                      createdAt: FieldValue.serverTimestamp(),
                    });
                  }
                }
              }
            } catch (goalErr) {
              console.error(`Goal auto-achieve error for user ${userId}:`, goalErr);
            }

            // 週間/月間アクティブボーナス
            try {
              const dayOfWeek = todayJST.getDay(); // 0=日曜
              const dayOfMonth = todayJST.getDate();
              const lastDay = new Date(todayJST.getFullYear(), todayJST.getMonth() + 1, 0).getDate();

              // 日曜日: 週間アクティブチェック（週5日以上プレイ）
              if (dayOfWeek === 0) {
                const weekStart = new Date(todayJST);
                weekStart.setDate(weekStart.getDate() - 6);
                const weekStartStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;

                const weekStatsSnap = await adminDb
                  .collection(`users/${userId}/dartsLiveStats`)
                  .where('date', '>=', new Date(weekStartStr + 'T00:00:00+09:00'))
                  .where('date', '<=', new Date(todayStr + 'T23:59:59+09:00'))
                  .get();

                if (weekStatsSnap.size >= 5) {
                  const userRef = adminDb.doc(`users/${userId}`);
                  await userRef.set({ xp: FieldValue.increment(25) }, { merge: true });
                  await adminDb.collection(`users/${userId}/xpHistory`).add({
                    action: 'weekly_active',
                    xp: 25,
                    detail: '週間アクティブボーナス',
                    createdAt: FieldValue.serverTimestamp(),
                  });
                }
              }

              // 月末: 月間アクティブチェック（月20日以上プレイ）
              if (dayOfMonth === lastDay) {
                const monthStart = new Date(todayJST.getFullYear(), todayJST.getMonth(), 1);
                const monthStatsSnap = await adminDb
                  .collection(`users/${userId}/dartsLiveStats`)
                  .where('date', '>=', monthStart)
                  .where('date', '<=', new Date(todayStr + 'T23:59:59+09:00'))
                  .get();

                if (monthStatsSnap.size >= 20) {
                  const userRef = adminDb.doc(`users/${userId}`);
                  await userRef.set({ xp: FieldValue.increment(100) }, { merge: true });
                  await adminDb.collection(`users/${userId}/xpHistory`).add({
                    action: 'monthly_active',
                    xp: 100,
                    detail: '月間アクティブボーナス',
                    createdAt: FieldValue.serverTimestamp(),
                  });
                }
              }
            } catch (activeErr) {
              console.error(`Active bonus error for user ${userId}:`, activeErr);
            }

            if (!hasChange) {
              results.push({ userId, status: 'no_change' });
            }
          } finally {
            await page.close();
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`Cron error for user ${userId}:`, msg);
          results.push({ userId, status: 'error', error: msg });
        }
      }
    } finally {
      await browser.close();
    }
  } catch (err) {
    console.error('Cron job error:', err);
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

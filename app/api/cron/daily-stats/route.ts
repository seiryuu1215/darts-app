import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { decrypt } from '@/lib/crypto';
import { sendLinePushMessage, buildStatsFlexMessage } from '@/lib/line';
import { calculateCronXp, calculateLevel, type CronStatsSnapshot } from '@/lib/progression/xp-engine';

export const maxDuration = 300;

/** DARTSLIVE ログイン */
async function login(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof puppeteer.launch>>['newPage']>>,
  email: string,
  password: string,
) {
  await page.goto('https://card.dartslive.com/account/login.jsp', {
    waitUntil: 'networkidle2',
    timeout: 15000,
  });
  await page.type('#text', email);
  await page.type('#password', password);
  await page.click('input[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });

  if (page.url().includes('login.jsp')) {
    throw new Error('LOGIN_FAILED');
  }
}

/** play/index.jsp からスタッツサマリーを取得 */
async function scrapeStats(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof puppeteer.launch>>['newPage']>>,
) {
  await page.goto('https://card.dartslive.com/t/play/index.jsp', {
    waitUntil: 'networkidle2',
    timeout: 15000,
  });

  return page.evaluate(() => {
    const getNum = (sel: string) => {
      const t = document.querySelector(sel)?.textContent?.trim() || '';
      const n = parseFloat(t.replace(/[+]/g, ''));
      return isNaN(n) ? null : n;
    };

    const ratingInt = getNum('#statusRtValue');
    const ratingRef = getNum('#refValue');

    let stats01Avg: number | null = null;
    let statsCriAvg: number | null = null;

    const statsRows = document.querySelectorAll('table tr');
    statsRows.forEach((row) => {
      const kind = row.querySelector('.statsKind')?.textContent?.trim();
      if (kind === '平均') {
        const v01 = row.querySelector('.stats01')?.textContent?.trim();
        const vCri = row.querySelector('.statsCri')?.textContent?.trim();
        if (v01) stats01Avg = parseFloat(v01);
        if (vCri) statsCriAvg = parseFloat(vCri);
      }
    });

    // Awards (D-BULL / S-BULL / HAT TRICK) — 今月 & 累計
    let dBullTotal = 0;
    let sBullTotal = 0;
    let dBullMonthly = 0;
    let sBullMonthly = 0;
    let hatTricksTotal = 0;
    let hatTricksMonthly = 0;
    document.querySelectorAll('table tr').forEach((row) => {
      const th = row.querySelector('th')?.textContent?.trim();
      const totalTd = row.querySelector('td.total');
      const tds = Array.from(row.querySelectorAll('td'));
      if (th && totalTd && tds.length >= 2) {
        const monthlyVal = parseInt(tds[0]?.textContent?.trim()?.replace(/,/g, '') || '0', 10);
        const totalVal = parseInt(totalTd.textContent?.trim()?.replace(/,/g, '') || '0', 10);
        if (th === 'D-BULL' && !isNaN(totalVal)) {
          dBullTotal = totalVal;
          dBullMonthly = isNaN(monthlyVal) ? 0 : monthlyVal;
        }
        if (th === 'S-BULL' && !isNaN(totalVal)) {
          sBullTotal = totalVal;
          sBullMonthly = isNaN(monthlyVal) ? 0 : monthlyVal;
        }
        if (th === 'HAT TRICK' && !isNaN(totalVal)) {
          hatTricksTotal = totalVal;
          hatTricksMonthly = isNaN(monthlyVal) ? 0 : monthlyVal;
        }
      }
    });

    return {
      rating: ratingRef ?? ratingInt,
      ratingInt,
      stats01Avg: stats01Avg === null || isNaN(stats01Avg) ? null : stats01Avg,
      statsCriAvg: statsCriAvg === null || isNaN(statsCriAvg) ? null : statsCriAvg,
      dBullTotal,
      sBullTotal,
      dBullMonthly,
      sBullMonthly,
      hatTricksTotal,
      hatTricksMonthly,
    };
  });
}

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
    const isVercel = process.env.VERCEL === '1';
    const browser = await puppeteer.launch({
      args: isVercel ? chromium.args : ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 720 },
      executablePath: isVercel
        ? await chromium.executablePath()
        : process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: true,
    });

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
          const page = await browser.newPage();
          await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          );

          try {
            await login(page, dlEmail, dlPassword);
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

            if (hasChange) {
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

              // LINE通知送信
              const flexMsg = buildStatsFlexMessage({
                date: dateStr,
                rating: stats.rating,
                ppd: stats.stats01Avg,
                mpr: stats.statsCriAvg,
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
                },
                condition: null,
                updatedAt: FieldValue.serverTimestamp(),
              });

              results.push({ userId, status: 'notified' });
            }

            // XP自動付与: 前回/今回スタッツ差分からXPを算出
            try {
              const prevSnapshot: CronStatsSnapshot = {
                totalGames: prevData?.totalGames ?? 0,
                streak: prevData?.streak ?? 0,
                rating: prevData?.rating ?? null,
                hatTricks: prevData?.hatTricks ?? 0,
                ton80: prevData?.ton80 ?? 0,
                threeInABlack: prevData?.threeInABlack ?? 0,
                nineMark: prevData?.nineMark ?? 0,
                lowTon: prevData?.lowTon ?? 0,
                highTon: prevData?.highTon ?? 0,
              };
              const currentSnapshot: CronStatsSnapshot = {
                totalGames: stats.dBullTotal > 0 ? (prevData?.totalGames ?? 0) : 0, // ゲーム数はキャッシュから
                streak: prevData?.streak ?? 0,
                rating: stats.rating,
                hatTricks: prevData?.hatTricks ?? 0,
                ton80: prevData?.ton80 ?? 0,
                threeInABlack: prevData?.threeInABlack ?? 0,
                nineMark: prevData?.nineMark ?? 0,
                lowTon: prevData?.lowTon ?? 0,
                highTon: prevData?.highTon ?? 0,
              };

              const xpActions = calculateCronXp(
                prevData ? prevSnapshot : null,
                currentSnapshot,
              );

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

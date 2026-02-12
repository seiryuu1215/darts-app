import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { canUseDartslive } from '@/lib/permissions';
import { z } from 'zod';
import { withPermission, withErrorHandler } from '@/lib/api-middleware';

const dartsliveLoginSchema = z.object({
  email: z.string().email().max(256),
  password: z.string().min(1).max(256),
});

export const maxDuration = 60;

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

/** top.jsp からプレイヤープロフィール（通り名・カードアイコン）を取得 */
async function scrapeProfile(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof puppeteer.launch>>['newPage']>>,
) {
  await page.goto('https://card.dartslive.com/t/top.jsp', {
    waitUntil: 'networkidle2',
    timeout: 15000,
  });

  return page.evaluate(() => {
    // 通り名（プレイヤータイトル/ニックネーム）
    const toorina =
      document.querySelector('.toorina, .player-nickname, [class*="title"]')?.textContent?.trim() ||
      '';
    // カードアイコン/テーマ画像
    const iconEl = document.querySelector('.card-icon img, .player-icon img, [class*="icon"] img');
    const rawUrl = iconEl?.getAttribute('src') || '';
    const cardImageUrl = rawUrl.startsWith('http')
      ? rawUrl
      : rawUrl
        ? `https://card.dartslive.com${rawUrl}`
        : '';
    return { toorina, cardImageUrl };
  });
}

/** play/index.jsp から現在スタッツ + Awards を取得 */
async function scrapeCurrentStats(
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
    const flightEl = document.querySelector('#statusFlTitle');
    const flight = flightEl?.nextElementSibling?.textContent?.trim() || '';

    // STATS テーブル
    let stats01Avg: number | null = null;
    let statsCriAvg: number | null = null;
    let statsPraAvg: number | null = null;
    let stats01Best: number | null = null;
    let statsCriBest: number | null = null;
    let statsPraBest: number | null = null;

    const statsRows = document.querySelectorAll('table tr');
    statsRows.forEach((row) => {
      const kind = row.querySelector('.statsKind')?.textContent?.trim();
      const v01 = row.querySelector('.stats01')?.textContent?.trim();
      const vCri = row.querySelector('.statsCri')?.textContent?.trim();
      const vPra = row.querySelector('.statsPra')?.textContent?.trim();
      if (kind === '平均') {
        if (v01) stats01Avg = parseFloat(v01);
        if (vCri) statsCriAvg = parseFloat(vCri);
        if (vPra) statsPraAvg = parseFloat(vPra);
      }
      if (kind === '最高') {
        if (v01 && v01 !== '--') stats01Best = parseFloat(v01);
        if (vCri && vCri !== '--') statsCriBest = parseFloat(vCri);
        if (vPra && vPra !== '--') statsPraBest = parseFloat(vPra);
      }
    });

    // Fallback
    if (stats01Avg === null) {
      const cells = document.querySelectorAll('td.stats01');
      if (cells[0]) stats01Avg = parseFloat(cells[0].textContent?.trim() || '');
    }
    if (statsCriAvg === null) {
      const cells = document.querySelectorAll('td.statsCri');
      if (cells[0]) statsCriAvg = parseFloat(cells[0].textContent?.trim() || '');
    }

    // Awards
    const awards: Record<string, { monthly: number; total: number }> = {};
    document.querySelectorAll('table tr').forEach((row) => {
      const th = row.querySelector('th')?.textContent?.trim();
      const totalTd = row.querySelector('td.total');
      const tds = Array.from(row.querySelectorAll('td'));
      if (th && totalTd && tds.length >= 2) {
        // 今月 | 先月 | 累計
        const monthlyVal = parseInt(tds[0]?.textContent?.trim()?.replace(/,/g, '') || '0', 10);
        const totalVal = parseInt(totalTd.textContent?.trim()?.replace(/,/g, '') || '0', 10);
        if (!isNaN(totalVal)) {
          awards[th] = { monthly: monthlyVal, total: totalVal };
        }
      }
    });

    const cardName = document.querySelector('h1')?.textContent?.trim() || '';

    return {
      cardName,
      rating: ratingRef ?? ratingInt,
      ratingInt,
      flight,
      stats01Avg: stats01Avg === null || isNaN(stats01Avg) ? null : stats01Avg,
      statsCriAvg: statsCriAvg === null || isNaN(statsCriAvg) ? null : statsCriAvg,
      statsPraAvg: statsPraAvg === null || isNaN(statsPraAvg) ? null : statsPraAvg,
      stats01Best: stats01Best === null || isNaN(stats01Best) ? null : stats01Best,
      statsCriBest: statsCriBest === null || isNaN(statsCriBest) ? null : statsCriBest,
      statsPraBest: statsPraBest === null || isNaN(statsPraBest) ? null : statsPraBest,
      awards,
    };
  });
}

/** monthly.jsp から月間推移データ（Rating/01/Cricket/COUNT-UP）を取得 */
async function scrapeMonthlyData(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof puppeteer.launch>>['newPage']>>,
) {
  const tabs = [
    { key: 'rating', param: '' },
    { key: 'zeroOne', param: '?t=1' },
    { key: 'cricket', param: '?t=2' },
    { key: 'countUp', param: '?t=3' },
  ];

  const monthly: Record<string, { month: string; value: number }[]> = {};

  for (const tab of tabs) {
    await page.goto(`https://card.dartslive.com/t/play/monthly.jsp${tab.param}`, {
      waitUntil: 'networkidle2',
      timeout: 15000,
    });

    const data = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table.basic tr'));
      const entries: { month: string; value: number }[] = [];
      rows.forEach((row) => {
        const th = row.querySelector('th')?.textContent?.trim();
        const td = row.querySelector('td.scoreAvg, td')?.textContent?.trim();
        if (th && td && th !== '' && !th.includes('※')) {
          const val = parseFloat(td);
          if (!isNaN(val)) {
            entries.push({ month: th, value: val });
          }
        }
      });
      return entries;
    });

    monthly[tab.key] = data;
  }

  return monthly;
}

/** playdata.jsp から直近の個別ゲーム結果を取得 */
async function scrapeRecentGames(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof puppeteer.launch>>['newPage']>>,
) {
  await page.goto('https://card.dartslive.com/t/playdata.jsp', {
    waitUntil: 'networkidle2',
    timeout: 15000,
  });

  return page.evaluate(() => {
    // 昨日のスタッツ（BEST/AVG）
    const dayStats = {
      best01: null as number | null,
      bestCri: null as number | null,
      bestCountUp: null as number | null,
      avg01: null as number | null,
      avgCri: null as number | null,
      avgCountUp: null as number | null,
    };

    const scoreRows = document.querySelectorAll('table tr');
    scoreRows.forEach((row) => {
      const label = row.querySelector('span.red, td:first-child')?.textContent?.trim();
      const s01 = row.querySelector('td.score_01')?.textContent?.trim();
      const sCri = row.querySelector('td.score_cri')?.textContent?.trim();
      const sPra = row.querySelector('td.score_pra')?.textContent?.trim();
      if (label === 'BEST') {
        if (s01) dayStats.best01 = parseFloat(s01);
        if (sCri) dayStats.bestCri = parseFloat(sCri);
        if (sPra) dayStats.bestCountUp = parseFloat(sPra);
      }
      if (label === 'AVG' || label?.includes('AVG')) {
        if (s01) dayStats.avg01 = parseFloat(s01);
        if (sCri) dayStats.avgCri = parseFloat(sCri);
        if (sPra) dayStats.avgCountUp = parseFloat(sPra);
      }
    });

    // 個別ゲーム結果
    const games: { category: string; scores: number[] }[] = [];
    const resultTitles = document.querySelectorAll('h3.resultTitle');

    resultTitles.forEach((h3) => {
      const category = h3.textContent?.trim() || '';
      const scores: number[] = [];
      let el = h3.nextElementSibling;
      while (el && !el.matches('h3')) {
        const nameEl = el.querySelector('.name');
        const pointEl = el.querySelector('.point');
        if (nameEl && pointEl) {
          const score = parseFloat(pointEl.textContent?.trim() || '');
          if (!isNaN(score)) scores.push(score);
        }
        el = el.nextElementSibling;
      }
      if (scores.length > 0) {
        games.push({ category, scores });
      }
    });

    // ショップ
    const shops = Array.from(document.querySelectorAll('.homeshop'))
      .map((el) => el.textContent?.trim() || '')
      .filter(Boolean);

    return { dayStats, games, shops };
  });
}

const DARTSLIVE_PERMISSION_MSG = 'DARTSLIVE連携はPROプラン以上で利用できます';

/** キャッシュ済みスタッツを返す */
export const GET = withErrorHandler(
  withPermission(canUseDartslive, DARTSLIVE_PERMISSION_MSG, async (_req, { userId }) => {
    const cacheRef = adminDb.doc(`users/${userId}/dartsliveCache/latest`);
    const cacheDoc = await cacheRef.get();
    if (!cacheDoc.exists) {
      return NextResponse.json({ data: null });
    }
    const data = cacheDoc.data();

    const updatedAt = data?.updatedAt?.toDate?.()?.toISOString() || null;

    // フルデータがあればパースして返す
    if (data?.fullData) {
      return NextResponse.json({ data: JSON.parse(data.fullData), cached: true, updatedAt });
    }

    // フルデータがない場合はサマリーのみ返す
    return NextResponse.json({
      data: {
        current: {
          cardName: data?.cardName || '',
          toorina: data?.toorina || '',
          cardImageUrl: data?.cardImageUrl || '',
          rating: data?.rating ?? null,
          ratingInt: data?.ratingInt ?? null,
          flight: data?.flight || '',
          stats01Avg: data?.stats01Avg ?? null,
          statsCriAvg: data?.statsCriAvg ?? null,
          statsPraAvg: data?.statsPraAvg ?? null,
          stats01Best: null,
          statsCriBest: null,
          statsPraBest: null,
          awards: {},
        },
        monthly: {},
        recentGames: { dayStats: {}, games: [], shops: [] },
        prev:
          data?.prevRating != null
            ? {
                rating: data.prevRating,
                stats01Avg: data.prevStats01Avg,
                statsCriAvg: data.prevStatsCriAvg,
                statsPraAvg: data.prevStatsPraAvg,
              }
            : null,
      },
      cached: true,
      summaryOnly: true,
      updatedAt,
    });
  }),
  'Stats cache read error',
);

export const POST = withErrorHandler(
  withPermission(
    canUseDartslive,
    DARTSLIVE_PERMISSION_MSG,
    async (request: NextRequest, { userId }) => {
      const body = await request.json();
      const parsed = dartsliveLoginSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'メールアドレスとパスワードを正しく入力してください' },
          { status: 400 },
        );
      }
      const { email, password } = parsed.data;

      let browser;
      try {
        const isVercel = process.env.VERCEL === '1';
        browser = await puppeteer.launch({
          args: isVercel ? chromium.args : ['--no-sandbox', '--disable-setuid-sandbox'],
          defaultViewport: { width: 1280, height: 720 },
          executablePath: isVercel
            ? await chromium.executablePath()
            : process.env.CHROME_PATH ||
              '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          headless: true,
        });
        const page = await browser.newPage();
        await page.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        );

        // ログイン
        try {
          await login(page, email, password);
        } catch (e) {
          if (e instanceof Error && e.message === 'LOGIN_FAILED') {
            return NextResponse.json(
              { error: 'ログインに失敗しました。メールアドレスとパスワードを確認してください。' },
              { status: 401 },
            );
          }
          throw e;
        }

        // 順次取得（同一ページインスタンスなので）
        const profile = await scrapeProfile(page);
        const currentStats = await scrapeCurrentStats(page);
        const monthly = await scrapeMonthlyData(page);
        const recentGames = await scrapeRecentGames(page);

        // Firestoreに最新スタッツを保存
        const cacheRef = adminDb.doc(`users/${userId}/dartsliveCache/latest`);
        const prevDoc = await cacheRef.get();
        const prevData = prevDoc.exists ? prevDoc.data() : null;

        const responseData = {
          current: {
            ...currentStats,
            toorina: profile.toorina,
            cardImageUrl: profile.cardImageUrl,
          },
          monthly,
          recentGames,
          prev: prevData
            ? {
                rating: prevData.rating ?? prevData.current?.rating ?? null,
                stats01Avg: prevData.stats01Avg ?? prevData.current?.stats01Avg ?? null,
                statsCriAvg: prevData.statsCriAvg ?? prevData.current?.statsCriAvg ?? null,
                statsPraAvg: prevData.statsPraAvg ?? prevData.current?.statsPraAvg ?? null,
              }
            : null,
        };

        // フルデータ + サマリーを保存
        const cacheData = {
          // サマリー（トップページ表示用）
          rating: currentStats.rating,
          ratingInt: currentStats.ratingInt,
          flight: currentStats.flight,
          cardName: currentStats.cardName,
          toorina: profile.toorina,
          cardImageUrl: profile.cardImageUrl,
          stats01Avg: currentStats.stats01Avg,
          statsCriAvg: currentStats.statsCriAvg,
          statsPraAvg: currentStats.statsPraAvg,
          // 前回との差分
          prevRating: responseData.prev?.rating ?? null,
          prevStats01Avg: responseData.prev?.stats01Avg ?? null,
          prevStatsCriAvg: responseData.prev?.statsCriAvg ?? null,
          prevStatsPraAvg: responseData.prev?.statsPraAvg ?? null,
          // フルデータ（スタッツページ用）
          fullData: JSON.stringify(responseData),
          updatedAt: FieldValue.serverTimestamp(),
        };
        await cacheRef.set(cacheData);

        return NextResponse.json({ success: true, data: responseData });
      } finally {
        if (browser) await browser.close();
      }
    },
  ),
  'DARTSLIVE scraping error',
);

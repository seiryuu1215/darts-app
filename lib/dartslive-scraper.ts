import puppeteer, { type Browser, type Page } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export interface ScrapedStats {
  rating: number | null;
  ratingInt: number | null;
  stats01Avg: number | null;
  statsCriAvg: number | null;
  dBullTotal: number;
  sBullTotal: number;
  dBullMonthly: number;
  sBullMonthly: number;
  hatTricksTotal: number;
  hatTricksMonthly: number;
  ton80: number;
  lowTon: number;
  highTon: number;
  threeInABed: number;
  threeInABlack: number;
  whiteHorse: number;
}

/** Puppeteer ブラウザ起動 */
export async function launchBrowser(): Promise<Browser> {
  const isVercel = process.env.VERCEL === '1';
  return puppeteer.launch({
    args: isVercel ? chromium.args : ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 720 },
    executablePath: isVercel
      ? await chromium.executablePath()
      : process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
}

/** 新しいページ作成（UA設定済み） */
export async function createPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  );
  return page;
}

/** DARTSLIVE ログイン */
export async function login(page: Page, email: string, password: string): Promise<boolean> {
  await page.goto('https://card.dartslive.com/account/login.jsp', {
    waitUntil: 'networkidle2',
    timeout: 15000,
  });
  await page.type('#text', email);
  await page.type('#password', password);
  await page.click('input[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });

  if (page.url().includes('login.jsp')) {
    return false;
  }
  return true;
}

/** play/index.jsp からスタッツサマリーを取得 */
export async function scrapeStats(page: Page): Promise<ScrapedStats> {
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

    // Awards — 今月 & 累計
    let dBullTotal = 0;
    let sBullTotal = 0;
    let dBullMonthly = 0;
    let sBullMonthly = 0;
    let hatTricksTotal = 0;
    let hatTricksMonthly = 0;
    let ton80 = 0;
    let lowTon = 0;
    let highTon = 0;
    let threeInABed = 0;
    let threeInABlack = 0;
    let whiteHorse = 0;

    const awardMap: Record<string, (monthly: number, total: number) => void> = {
      'D-BULL': (m, t) => { dBullMonthly = m; dBullTotal = t; },
      'S-BULL': (m, t) => { sBullMonthly = m; sBullTotal = t; },
      'HAT TRICK': (m, t) => { hatTricksMonthly = m; hatTricksTotal = t; },
      'TON 80': (_m, t) => { ton80 = t; },
      'LOW TON': (_m, t) => { lowTon = t; },
      'HIGH TON': (_m, t) => { highTon = t; },
      '3 IN A BED': (_m, t) => { threeInABed = t; },
      '3 - BLACK': (_m, t) => { threeInABlack = t; },
      'WHITE HRS': (_m, t) => { whiteHorse = t; },
    };

    document.querySelectorAll('table tr').forEach((row) => {
      const th = row.querySelector('th')?.textContent?.trim();
      const totalTd = row.querySelector('td.total');
      const tds = Array.from(row.querySelectorAll('td'));
      if (th && totalTd && tds.length >= 2) {
        const monthlyVal = parseInt(tds[0]?.textContent?.trim()?.replace(/,/g, '') || '0', 10);
        const totalVal = parseInt(totalTd.textContent?.trim()?.replace(/,/g, '') || '0', 10);
        const handler = awardMap[th];
        if (handler && !isNaN(totalVal)) {
          handler(isNaN(monthlyVal) ? 0 : monthlyVal, totalVal);
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
      ton80,
      lowTon,
      highTon,
      threeInABed,
      threeInABlack,
      whiteHorse,
    };
  });
}

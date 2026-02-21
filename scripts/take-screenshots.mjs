#!/usr/bin/env node
/**
 * README 用スクリーンショット撮影スクリプト
 * Usage: node scripts/take-screenshots.mjs
 *
 * ホームのみ撮り直す場合: node scripts/take-screenshots.mjs home
 */
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');
const BASE_URL = 'https://darts-app-lime.vercel.app';

// 環境変数 or 引数で指定: SCREENSHOT_EMAIL=xxx SCREENSHOT_PASSWORD=yyy node scripts/take-screenshots.mjs
const TEST_EMAIL = process.env.SCREENSHOT_EMAIL || '';
const TEST_PASSWORD = process.env.SCREENSHOT_PASSWORD || '';

const VIEWPORT = { width: 1280, height: 800 };

// コマンドライン引数で撮影対象を絞れる（例: home barrels）
const targetPages = process.argv.slice(2);
const shouldCapture = (name) => targetPages.length === 0 || targetPages.includes(name);

async function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForContent(page, timeout = 15000) {
  try {
    await page.waitForNetworkIdle({ timeout, idleTime: 1000 });
  } catch {
    // timeout OK
  }
  await delay(1500);
}

async function clickButtonByText(page, ...texts) {
  try {
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await btn.evaluate((el) => el.textContent?.trim());
      if (texts.some((t) => text === t || text?.includes(t))) {
        await btn.click();
        await delay(800);
        return true;
      }
    }
  } catch {
    // ignore
  }
  return false;
}

async function dismissAllDialogs(page) {
  // MUI Dialog の backdrop をクリックして閉じる or ボタンクリック
  for (let i = 0; i < 5; i++) {
    const dismissed = await clickButtonByText(
      page,
      'あとで見る',
      'スキップ',
      'OK',
      'やったー!',
      '閉じる',
    );
    if (!dismissed) break;
    await delay(500);
  }
}

async function main() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);

  // --- ログイン ---
  console.log('Logging in...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000);

  const emailInput = await page.$('input[type="email"], input[name="email"]');
  if (emailInput) {
    await emailInput.click({ clickCount: 3 });
    await emailInput.type(TEST_EMAIL, { delay: 30 });
  }

  const passwordInput = await page.$('input[type="password"], input[name="password"]');
  if (passwordInput) {
    await passwordInput.click({ clickCount: 3 });
    await passwordInput.type(TEST_PASSWORD, { delay: 30 });
  }

  const loginButton = await page.evaluateHandle(() => {
    const buttons = [...document.querySelectorAll('button')];
    return (
      buttons.find((b) => b.textContent?.includes('ログイン') && b.type !== 'button') ||
      buttons.find((b) => b.textContent?.includes('ログイン'))
    );
  });

  if (loginButton) {
    await loginButton.click();
    console.log('  Login button clicked, waiting...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    await delay(3000);
  }

  // オンボーディング等を閉じる
  await dismissAllDialogs(page);
  await delay(1000);
  await dismissAllDialogs(page);

  // --- ホーム ---
  if (shouldCapture('home')) {
    console.log('Taking screenshot: home');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await waitForContent(page);
    // ダイアログが出ていたら繰り返し閉じる
    await dismissAllDialogs(page);
    await delay(1500);
    await dismissAllDialogs(page);
    await delay(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'home.png'), fullPage: false });
    console.log('  -> home.png saved');
  }

  // --- バレル検索 ---
  if (shouldCapture('barrels')) {
    console.log('Taking screenshot: barrels');
    await page.goto(`${BASE_URL}/barrels`, { waitUntil: 'networkidle2', timeout: 30000 });
    await waitForContent(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'barrels.png'), fullPage: false });
    console.log('  -> barrels.png saved');
  }

  // --- スタッツ（テストアカウントはPROでないためスキップ推奨） ---
  if (shouldCapture('stats')) {
    console.log('Taking screenshot: stats');
    await page.goto(`${BASE_URL}/stats`, { waitUntil: 'networkidle2', timeout: 30000 });
    await waitForContent(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'stats.png'), fullPage: false });
    console.log('  -> stats.png saved');
  }

  // --- セッティング登録 ---
  if (shouldCapture('setup')) {
    console.log('Taking screenshot: setup');
    await page.goto(`${BASE_URL}/darts/new`, { waitUntil: 'networkidle2', timeout: 30000 });
    await waitForContent(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'setup.png'), fullPage: false });
    console.log('  -> setup.png saved');
  }

  // --- シミュレーター ---
  if (shouldCapture('simulator')) {
    console.log('Taking screenshot: simulator');
    await page.goto(`${BASE_URL}/barrels/simulator`, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await waitForContent(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'simulator.png'), fullPage: false });
    console.log('  -> simulator.png saved');
  }

  // --- 診断クイズ ---
  if (shouldCapture('quiz')) {
    console.log('Taking screenshot: quiz');
    await page.goto(`${BASE_URL}/barrels/quiz`, { waitUntil: 'networkidle2', timeout: 30000 });
    await waitForContent(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'quiz.png'), fullPage: false });
    console.log('  -> quiz.png saved');
  }

  // --- マイショップ ---
  if (shouldCapture('shops')) {
    console.log('Taking screenshot: shops');
    await page.goto(`${BASE_URL}/shops`, { waitUntil: 'networkidle2', timeout: 30000 });
    await waitForContent(page);
    await dismissAllDialogs(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'shops.png'), fullPage: false });
    console.log('  -> shops.png saved');
  }

  // --- ディスカッション ---
  if (shouldCapture('discussions')) {
    console.log('Taking screenshot: discussions');
    await page.goto(`${BASE_URL}/discussions`, { waitUntil: 'networkidle2', timeout: 30000 });
    await waitForContent(page);
    await dismissAllDialogs(page);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'discussions.png'),
      fullPage: false,
    });
    console.log('  -> discussions.png saved');
  }

  // --- 週次/月次レポート ---
  if (shouldCapture('reports')) {
    console.log('Taking screenshot: reports');
    await page.goto(`${BASE_URL}/reports`, { waitUntil: 'networkidle2', timeout: 30000 });
    await waitForContent(page);
    await dismissAllDialogs(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'reports.png'), fullPage: false });
    console.log('  -> reports.png saved');
  }

  // --- カレンダービュー ---
  if (shouldCapture('calendar')) {
    console.log('Taking screenshot: calendar');
    await page.goto(`${BASE_URL}/stats/calendar`, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await waitForContent(page);
    await dismissAllDialogs(page);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'calendar.png'),
      fullPage: false,
    });
    console.log('  -> calendar.png saved');
  }

  // --- セッティング比較 ---
  if (shouldCapture('compare')) {
    console.log('Taking screenshot: compare');
    await page.goto(`${BASE_URL}/darts/compare`, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await waitForContent(page);
    await dismissAllDialogs(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'compare.png'), fullPage: false });
    console.log('  -> compare.png saved');
  }

  // --- おすすめバレル ---
  if (shouldCapture('recommend')) {
    console.log('Taking screenshot: recommend');
    await page.goto(`${BASE_URL}/barrels/recommend`, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await waitForContent(page);
    await dismissAllDialogs(page);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'recommend.png'),
      fullPage: false,
    });
    console.log('  -> recommend.png saved');
  }

  await browser.close();
  console.log('\nDone!');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

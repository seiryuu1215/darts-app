/**
 * 全画面スクリーンショット自動取得スクリプト
 *
 * 本番サイトにdemo-adminでログインし、主要画面のスクリーンショットを取得する。
 * 取得した画像は docs/screenshots/ に保存される。
 *
 * Usage: npx tsx scripts/capture-screenshots.ts
 *        npx tsx scripts/capture-screenshots.ts --local  (localhost:3000を使用)
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = process.argv.includes('--local')
  ? 'http://localhost:3000'
  : 'https://darts-app-lime.vercel.app';

const SCREENSHOT_DIR = path.join(process.cwd(), 'docs/screenshots');

const DEMO_ADMIN = {
  email: 'demo-admin@darts-lab.example',
  password: 'demo1234',
};

const MAX_RETRIES = 2;

interface ScreenshotDef {
  name: string;
  path: string;
  /** ログイン不要の公開ページ */
  public?: boolean;
  /** スクショ前に実行する追加アクション */
  actions?: (page: import('playwright').Page) => Promise<void>;
  /** フルページスクロール */
  fullPage?: boolean;
  /** 撮影前の追加待機時間 (ms) */
  waitMs?: number;
  /** コンテンツが読み込まれたか確認するセレクター */
  waitForSelector?: string;
}

const PAGES: ScreenshotDef[] = [
  // --- 公開ページ ---
  { name: 'login', path: '/login', public: true, waitForSelector: 'button[type="submit"]' },
  { name: 'pricing', path: '/pricing', public: true, waitMs: 2000 },
  {
    name: 'barrels',
    path: '/barrels',
    public: true,
    waitMs: 4000,
    waitForSelector: '.MuiCard-root',
  },

  // --- 認証必須ページ ---
  { name: 'home', path: '/', waitMs: 3000 },
  { name: 'stats', path: '/stats', waitMs: 6000, waitForSelector: '.MuiCard-root' },
  {
    name: 'stats-scroll',
    path: '/stats',
    waitMs: 6000,
    waitForSelector: '.MuiCard-root',
    actions: async (page) => {
      await page.evaluate(() => window.scrollBy(0, 900));
      await page.waitForTimeout(1000);
    },
  },
  { name: 'calendar', path: '/stats/calendar', waitMs: 3000 },
  { name: 'setup', path: '/darts', waitMs: 4000 },
  { name: 'compare', path: '/darts/compare', waitMs: 4000 },
  { name: 'shops', path: '/shops', waitMs: 4000 },
  { name: 'discussions', path: '/discussions', waitMs: 3000 },
  { name: 'profile', path: '/profile/edit', waitMs: 3000 },
  { name: 'articles', path: '/articles', waitMs: 3000 },
  { name: 'reference', path: '/reference', waitMs: 3000 },
];

async function main() {
  console.log(`\n📸 スクリーンショット取得開始`);
  console.log(`   URL: ${BASE_URL}`);
  console.log(`   保存先: ${SCREENSHOT_DIR}\n`);

  // 保存先ディレクトリを確保
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    colorScheme: 'dark',
    locale: 'ja-JP',
  });
  const page = await context.newPage();

  let successCount = 0;
  let failCount = 0;

  // --- 公開ページを先に撮影 ---
  const publicPages = PAGES.filter((p) => p.public);
  for (const def of publicPages) {
    const ok = await captureWithRetry(page, def);
    if (ok) successCount++;
    else failCount++;
  }

  // --- ログイン ---
  console.log('\n🔐 demo-admin でログイン中...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', DEMO_ADMIN.email);
  await page.fill('input[type="password"]', DEMO_ADMIN.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
  console.log('✅ ログイン成功\n');

  // --- 認証ページを撮影 ---
  const authPages = PAGES.filter((p) => !p.public);
  for (const def of authPages) {
    const ok = await captureWithRetry(page, def);
    if (ok) successCount++;
    else failCount++;
  }

  await browser.close();
  console.log(`\n🎉 完了！ ${successCount}/${PAGES.length} 成功, ${failCount} 失敗`);

  if (failCount > 0) {
    process.exitCode = 1;
  }
}

async function captureWithRetry(
  page: import('playwright').Page,
  def: ScreenshotDef,
): Promise<boolean> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const ok = await captureScreen(page, def, attempt);
    if (ok) return true;
    if (attempt < MAX_RETRIES) {
      console.log(`     ↻ リトライ ${attempt + 1}/${MAX_RETRIES}...`);
      await page.waitForTimeout(2000);
    }
  }
  return false;
}

async function captureScreen(
  page: import('playwright').Page,
  def: ScreenshotDef,
  attempt: number,
): Promise<boolean> {
  const label = `${def.name}.png`;
  try {
    await page.goto(`${BASE_URL}${def.path}`, { waitUntil: 'load', timeout: 30000 });

    // セレクターでコンテンツ読み込み確認
    if (def.waitForSelector) {
      try {
        await page.waitForSelector(def.waitForSelector, { timeout: 8000 });
      } catch {
        // セレクターが見つからなくてもスクショは試みる
      }
    }

    if (def.waitMs) await page.waitForTimeout(def.waitMs);

    // ローディングスピナーの消滅を待つ
    try {
      await page.waitForSelector('.MuiCircularProgress-root', {
        state: 'hidden',
        timeout: 5000,
      });
    } catch {
      // スピナーが最初から無い場合は無視
    }

    if (def.actions) await def.actions(page);

    const filePath = path.join(SCREENSHOT_DIR, `${def.name}.png`);
    await page.screenshot({ path: filePath, fullPage: def.fullPage });

    if (attempt === 1) {
      console.log(`  ✅ ${label}`);
    } else {
      console.log(`  ✅ ${label} (リトライ ${attempt}回目で成功)`);
    }
    return true;
  } catch (e) {
    console.log(`  ❌ ${label} — ${(e as Error).message.slice(0, 100)}`);
    return false;
  }
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});

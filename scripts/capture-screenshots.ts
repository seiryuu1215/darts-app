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

const BASE_URL = process.argv.includes('--local')
  ? 'http://localhost:3000'
  : 'https://darts-app-lime.vercel.app';

const SCREENSHOT_DIR = path.join(process.cwd(), 'docs/screenshots');

const DEMO_ADMIN = {
  email: 'demo-admin@darts-lab.example',
  password: 'demo1234',
};

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
}

const PAGES: ScreenshotDef[] = [
  // --- 公開ページ ---
  { name: 'login', path: '/login', public: true },
  { name: 'pricing', path: '/pricing', public: true },
  { name: 'barrels', path: '/barrels', public: true, waitMs: 3000 },

  // --- 認証必須ページ ---
  { name: 'home', path: '/', waitMs: 2000 },
  { name: 'stats', path: '/stats', waitMs: 5000 },
  {
    name: 'stats-scroll',
    path: '/stats',
    waitMs: 5000,
    actions: async (page) => {
      await page.evaluate(() => window.scrollBy(0, 900));
      await page.waitForTimeout(500);
    },
  },
  { name: 'calendar', path: '/stats/calendar', waitMs: 2000 },
  { name: 'phoenix', path: '/stats/phoenix', waitMs: 1500 },
  { name: 'setup', path: '/darts', waitMs: 3000 },
  { name: 'compare', path: '/darts/compare', waitMs: 3000 },
  { name: 'simulator', path: '/barrels?tab=simulator', waitMs: 3000 },
  { name: 'quiz', path: '/barrels?tab=quiz', waitMs: 3000 },
  { name: 'recommend', path: '/barrels?tab=recommend', waitMs: 3000 },
  { name: 'shops', path: '/shops', waitMs: 3000 },
  { name: 'discussions', path: '/discussions', waitMs: 3000 },
  { name: 'profile', path: '/profile', waitMs: 3000 },
  { name: 'health', path: '/health', waitMs: 3000 },
  { name: 'articles', path: '/articles', waitMs: 3000 },
  { name: 'bookmarks', path: '/bookmarks', waitMs: 3000 },
];

async function main() {
  console.log(`\n📸 スクリーンショット取得開始`);
  console.log(`   URL: ${BASE_URL}`);
  console.log(`   保存先: ${SCREENSHOT_DIR}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    colorScheme: 'dark',
    locale: 'ja-JP',
  });
  const page = await context.newPage();

  // --- 公開ページを先に撮影 ---
  const publicPages = PAGES.filter((p) => p.public);
  for (const def of publicPages) {
    await captureScreen(page, def);
  }

  // --- ログイン ---
  console.log('🔐 demo-admin でログイン中...');
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', DEMO_ADMIN.email);
  await page.fill('input[type="password"]', DEMO_ADMIN.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
  console.log('✅ ログイン成功\n');

  // --- 認証ページを撮影 ---
  const authPages = PAGES.filter((p) => !p.public);
  for (const def of authPages) {
    await captureScreen(page, def);
  }

  await browser.close();
  console.log(`\n🎉 完了！ ${PAGES.length} 画面のスクリーンショットを取得しました`);
}

async function captureScreen(page: import('playwright').Page, def: ScreenshotDef) {
  const label = `${def.name}.png`;
  try {
    await page.goto(`${BASE_URL}${def.path}`, { waitUntil: 'load', timeout: 30000 });
    if (def.waitMs) await page.waitForTimeout(def.waitMs);
    if (def.actions) await def.actions(page);

    const filePath = path.join(SCREENSHOT_DIR, `${def.name}.png`);
    await page.screenshot({ path: filePath, fullPage: def.fullPage });
    console.log(`  ✅ ${label}`);
  } catch (e) {
    console.log(`  ❌ ${label} — ${(e as Error).message.slice(0, 80)}`);
  }
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});

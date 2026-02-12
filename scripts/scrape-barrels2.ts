/**
 * バレルスクレイピング v3
 * - 並列処理 (5ワーカー)
 * - URL重複排除（visited.json永続化）
 * - スリープ後も再開可能（progress.txt）
 * - 必須フィールド: weight, maxDiameter, length, imageUrl
 * - カット: BARREL_CUTSからテキストマッチ、カンマ区切りで保存
 * - --nuke フラグで全消し＋再取得
 *
 * 使い方:
 *   npx tsx scripts/scrape-barrels2.ts           # 差分取得（現行品・在庫ありのみ）
 *   npx tsx scripts/scrape-barrels2.ts --all     # 廃盤・在庫なし含む全商品
 *   npx tsx scripts/scrape-barrels2.ts --nuke    # 全消し＋再取得
 *   npx tsx scripts/scrape-barrels2.ts --nuke --all  # 全消し＋全商品取得
 *
 * PCスリープ防止（Mac）:
 *   caffeinate -i nohup npx tsx scripts/scrape-barrels2.ts --nuke --all > scrape-log.txt 2>&1 &
 */

import 'dotenv/config';
import { config } from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import puppeteer from 'puppeteer';
import type { Browser, Page } from 'puppeteer';
import fs from 'fs';
import { BARREL_CUTS } from '../lib/darts-parts';

config({ path: '.env.local' });

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error('NEXT_PUBLIC_FIREBASE_PROJECT_ID missing');
  process.exit(1);
}

const app = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS) })
  : initializeApp({ projectId });

const db = getFirestore(app);

const CONCURRENCY = 5;
const VISITED_FILE = 'visited.json';
const PROGRESS_FILE = 'progress.txt';
const nukeMode = process.argv.includes('--nuke');

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

// ---------------- visited 永続 ----------------

let visited = new Set<string>();

if (fs.existsSync(VISITED_FILE) && !nukeMode) {
  visited = new Set(JSON.parse(fs.readFileSync(VISITED_FILE, 'utf-8')));
  console.log(`visited loaded: ${visited.size}`);
}

function saveVisited() {
  fs.writeFileSync(VISITED_FILE, JSON.stringify([...visited]));
}

// ---------------- Firestore ----------------

interface BarrelData {
  name: string;
  brand: string;
  weight: number;
  maxDiameter: number;
  length: number;
  cut: string;
  imageUrl: string;
  productUrl: string;
  isDiscontinued?: boolean;
}

async function save(barrel: BarrelData) {
  const id = Buffer.from(barrel.productUrl).toString('base64url');
  await db.collection('barrels').doc(id).set({
    ...barrel,
    source: 'dartshive',
    scrapedAt: Timestamp.now(),
    ...(barrel.isDiscontinued !== undefined && { isDiscontinued: barrel.isDiscontinued }),
  }, { merge: true });
}

async function nukeBarrels() {
  console.log('NUKE MODE: 全バレルデータを削除中...');
  const snapshot = await db.collection('barrels').get();
  const total = snapshot.size;
  let deleted = 0;

  // Firestoreバッチは500件制限
  const batchSize = 500;
  const docs = snapshot.docs;
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = db.batch();
    docs.slice(i, i + batchSize).forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    deleted += Math.min(batchSize, docs.length - i);
    console.log(`  削除: ${deleted}/${total}`);
  }

  // 進捗ファイルもリセット
  if (fs.existsSync(VISITED_FILE)) fs.unlinkSync(VISITED_FILE);
  if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);
  visited = new Set();
  console.log(`削除完了: ${total}件`);
}

// ---------------- detail ----------------

async function scrapeDetail(page: Page, url: string): Promise<BarrelData | null> {
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });

    const data = await page.evaluate((cutKeywords: string[]) => {
      const name = document.querySelector('.itemName')?.textContent?.trim() || '';
      if (!name.includes('バレル')) return null;

      let weight: number | null = null;
      let maxDiameter: number | null = null;
      let length: number | null = null;
      let brand = '';

      document.querySelectorAll('table tr').forEach(tr => {
        const tds = tr.querySelectorAll('td,th');
        if (tds.length < 2) return;
        const label = (tds[0].textContent || '').trim();
        const value = (tds[1].textContent || '').trim();

        if (label.includes('単体重量') || label.includes('重量') || label.includes('重さ')) {
          const n = parseFloat(value.replace(/[^0-9.]/g, ''));
          if (!isNaN(n) && n > 0 && n < 100) weight = n;
        }
        if (label.includes('最大径') || (label.includes('径') && !label.includes('内径'))) {
          const n = parseFloat(value.replace(/[^0-9.]/g, ''));
          if (!isNaN(n) && n > 0) maxDiameter = n;
        }
        if (label === '全長' || label.includes('バレル全長') || label.includes('長さ')) {
          const n = parseFloat(value.replace(/[^0-9.]/g, ''));
          if (!isNaN(n) && n > 0) length = n;
        }
        if (label.includes('ブランド') || label.includes('メーカー')) {
          brand = value;
        }
      });

      // 画像取得
      const imgEl = document.querySelector('.bxslider img, img[src*="shopimages"]');
      const imageUrl = imgEl ? imgEl.getAttribute('src') : null;

      // 必須フィールドチェック
      if (!weight || !maxDiameter || !length || !imageUrl) return null;

      // ページ全文からカット抽出
      const fullText = document.body.innerText.replace(/\s+/g, '');
      const found = cutKeywords.filter((kw: string) => fullText.includes(kw));
      const cut = found.join(',');

      return {
        name,
        brand,
        weight,
        maxDiameter,
        length,
        cut,
        imageUrl,
        productUrl: location.href,
      };
    }, BARREL_CUTS);

    return data as BarrelData | null;
  } catch {
    console.log('  detail fail:', url);
    return null;
  }
}

// ---------------- list ----------------

async function scrapeList(page: Page, url: string): Promise<string[]> {
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

  return page.evaluate((origin: string) => {
    return Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href*="shopdetail"]'))
      .map(a => {
        const href = a.getAttribute('href');
        if (!href) return '';
        return href.startsWith('http') ? href : `${origin}${href.startsWith('/') ? '' : '/'}${href}`;
      })
      .filter(Boolean);
  }, new URL(url).origin);
}

// ---------------- worker ----------------

async function worker(browser: Browser, queue: string[], id: number, stats: { saved: number; skipped: number }) {
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

  while (true) {
    const url = queue.shift();
    if (!url) break;

    const data = await scrapeDetail(page, url);

    if (data) {
      await save(data);
      stats.saved++;
      const cuts = data.cut ? ` [${data.cut}]` : '';
      console.log(`  [w${id}] saved: ${data.name} (${data.weight}g)${cuts}`);
    } else {
      stats.skipped++;
    }

    await sleep(300);
  }

  await page.close();
}

// ---------------- main ----------------

/** 1フェーズ分のスクレイプを実行し、保存したURLセットを返す */
async function scrapePhase(
  browser: Browser,
  baseUrl: string,
  phaseLabel: string,
  stats: { saved: number; skipped: number },
  isDiscontinued?: boolean,
): Promise<Set<string>> {
  const listPage = await browser.newPage();
  await listPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

  const savedUrls = new Set<string>();
  let emptyStreak = 0;

  const startPage = fs.existsSync(PROGRESS_FILE)
    ? Number(fs.readFileSync(PROGRESS_FILE, 'utf-8'))
    : 1;

  console.log(`\n[${phaseLabel}] スクレイピング開始 (ページ${startPage}〜)`);

  for (let p = startPage; p < 9999; p++) {
    console.log(`\n--- [${phaseLabel}] ページ ${p} ---`);

    const url = `${baseUrl}&page=${p}`;
    const links = await scrapeList(listPage, url);

    if (links.length === 0) {
      console.log('商品がないため終了');
      break;
    }

    const queue = links.filter(u => {
      if (visited.has(u)) return false;
      visited.add(u);
      return true;
    });

    // URLを記録（visited とは別に、フェーズ判定用）
    links.forEach(u => savedUrls.add(u));

    console.log(`リンク数: ${links.length}, 新規: ${queue.length}`);

    if (queue.length > 0) {
      emptyStreak = 0;
      // isDiscontinued フラグを付与
      const taggedQueue = queue.map(u => ({ url: u, isDiscontinued }));
      const workers = Array.from({ length: CONCURRENCY }, (_, i) =>
        workerWithFlag(browser, taggedQueue, i + 1, stats)
      );
      await Promise.all(workers);
    } else {
      emptyStreak++;
      if (emptyStreak >= 3) {
        console.log('新規商品が3ページ連続で0件のため終了');
        break;
      }
    }

    fs.writeFileSync(PROGRESS_FILE, String(p + 1));
    saveVisited();
    console.log(`累計: 保存${stats.saved}件 / スキップ${stats.skipped}件`);
  }

  await listPage.close();
  // フェーズ終了時に進捗リセット
  if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);

  return savedUrls;
}

/** isDiscontinuedフラグ付きワーカー */
async function workerWithFlag(
  browser: Browser,
  queue: { url: string; isDiscontinued?: boolean }[],
  id: number,
  stats: { saved: number; skipped: number },
) {
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

  while (true) {
    const item = queue.shift();
    if (!item) break;

    const data = await scrapeDetail(page, item.url);

    if (data) {
      if (item.isDiscontinued !== undefined) {
        data.isDiscontinued = item.isDiscontinued;
      }
      await save(data);
      stats.saved++;
      const cuts = data.cut ? ` [${data.cut}]` : '';
      const disc = data.isDiscontinued ? ' [廃盤]' : '';
      console.log(`  [w${id}] saved: ${data.name} (${data.weight}g)${cuts}${disc}`);
    } else {
      stats.skipped++;
    }

    await sleep(300);
  }

  await page.close();
}

async function main() {
  if (nukeMode) {
    await nukeBarrels();
  }

  const allMode = process.argv.includes('--all');
  const BASE_CURRENT = 'https://www.dartshive.jp/shopbrand/010?sort=publish_start_date%20desc&fq.category=010&fq.status=0&fq.discontinued=0';
  const BASE_ALL = 'https://www.dartshive.jp/shopbrand/010?sort=publish_start_date%20desc&fq.category=010';

  const browser = await puppeteer.launch({ headless: true });
  const stats = { saved: 0, skipped: 0 };

  if (allMode) {
    // --all: 2フェーズで廃盤判定
    // フェーズ1: 現行品のみスクレイプ → URLをSetで保持
    const currentUrls = await scrapePhase(browser, BASE_CURRENT, 'フェーズ1: 現行品', stats, false);
    console.log(`\nフェーズ1完了: 現行品URL ${currentUrls.size}件`);

    // visited をリセットしてフェーズ2へ（全商品を再スキャン）
    visited = new Set();
    if (fs.existsSync(VISITED_FILE)) fs.unlinkSync(VISITED_FILE);

    // フェーズ2: 全商品スクレイプ → フェーズ1に含まれないものは廃盤
    const allListPage = await browser.newPage();
    await allListPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    let emptyStreak = 0;
    for (let p = 1; p < 9999; p++) {
      console.log(`\n--- [フェーズ2: 全商品] ページ ${p} ---`);

      const url = `${BASE_ALL}&page=${p}`;
      const links = await scrapeList(allListPage, url);

      if (links.length === 0) {
        console.log('商品がないため終了');
        break;
      }

      const queue = links.filter(u => {
        if (visited.has(u)) return false;
        visited.add(u);
        return true;
      });

      console.log(`リンク数: ${links.length}, 新規: ${queue.length}`);

      if (queue.length > 0) {
        emptyStreak = 0;
        // フェーズ1のSetに含まれないURL → 廃盤
        const taggedQueue = queue.map(u => ({
          url: u,
          isDiscontinued: !currentUrls.has(u),
        }));
        const workers = Array.from({ length: CONCURRENCY }, (_, i) =>
          workerWithFlag(browser, taggedQueue, i + 1, stats)
        );
        await Promise.all(workers);
      } else {
        emptyStreak++;
        if (emptyStreak >= 3) {
          console.log('新規商品が3ページ連続で0件のため終了');
          break;
        }
      }

      saveVisited();
      console.log(`累計: 保存${stats.saved}件 / スキップ${stats.skipped}件`);
    }

    await allListPage.close();
  } else {
    // デフォルト: 現行品のみ差分取得（既存動作）
    await scrapePhase(browser, BASE_CURRENT, '現行品', stats, false);
  }

  await browser.close();

  console.log(`\n完了！合計 ${stats.saved} 件保存、${stats.skipped} 件スキップ`);
}

main().catch(e => {
  console.error('エラー:', e);
  saveVisited();
  process.exit(1);
});

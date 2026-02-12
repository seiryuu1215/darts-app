/**
 * バレルスクレイピング v4 — ブランド別全量取得
 * - ブランド一覧を自動取得し、ブランドごとにページネーション
 * - これにより全商品(7,000+件)を取得可能
 * - 並列処理 (5ワーカー)
 * - URL重複排除（visited.json永続化）
 * - スリープ後も再開可能（progress-full.json永続化）
 * - 必須フィールド: weight, maxDiameter, length, imageUrl
 * - カット: BARREL_CUTSからテキストマッチ、カンマ区切りで保存
 * - --nuke フラグで全消し＋再取得
 *
 * 使い方:
 *   npx tsx scripts/scrape-barrels-full.ts           # 差分取得
 *   npx tsx scripts/scrape-barrels-full.ts --nuke    # 全消し＋再取得
 *
 * PCスリープ防止（Mac）:
 *   caffeinate -i nohup npx tsx scripts/scrape-barrels-full.ts --nuke > scrape-full-log.txt 2>&1 &
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
const VISITED_FILE = 'visited-full.json';
const PROGRESS_FILE = 'progress-full.json';
const nukeMode = process.argv.includes('--nuke');

const BASE_URL = 'https://www.dartshive.jp';
const CATEGORY = '010'; // バレルカテゴリ

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
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

// ---------------- progress 永続 ----------------

interface Progress {
  completedBrands: string[]; // 完了済みブランドID
  currentBrand: string | null; // 処理中ブランドID
  currentPage: number; // 処理中ブランドのページ番号
}

function loadProgress(): Progress {
  if (fs.existsSync(PROGRESS_FILE) && !nukeMode) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  }
  return { completedBrands: [], currentBrand: null, currentPage: 1 };
}

function saveProgress(progress: Progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
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
}

async function save(barrel: BarrelData) {
  const id = Buffer.from(barrel.productUrl).toString('base64url');
  await db
    .collection('barrels')
    .doc(id)
    .set(
      {
        ...barrel,
        source: 'dartshive',
        scrapedAt: Timestamp.now(),
      },
      { merge: true },
    );
}

async function nukeBarrels() {
  console.log('NUKE MODE: 全バレルデータを削除中...');
  const snapshot = await db.collection('barrels').get();
  const total = snapshot.size;
  let deleted = 0;

  const batchSize = 500;
  const docs = snapshot.docs;
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = db.batch();
    docs.slice(i, i + batchSize).forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += Math.min(batchSize, docs.length - i);
    console.log(`  削除: ${deleted}/${total}`);
  }

  if (fs.existsSync(VISITED_FILE)) fs.unlinkSync(VISITED_FILE);
  if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);
  visited = new Set();
  console.log(`削除完了: ${total}件`);
}

// ---------------- ブランド一覧取得 ----------------

interface BrandInfo {
  id: string; // e.g. "b00001"
  name: string; // e.g. "ダイナスティー"
  count: number; // 商品数
}

async function scrapeBrands(page: Page): Promise<BrandInfo[]> {
  console.log('ブランド一覧を取得中...');

  // カテゴリページにアクセスしてブランド絞り込みリンクを取得
  await page.goto(`${BASE_URL}/shopbrand/${CATEGORY}`, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });

  const brands = await page.evaluate(() => {
    const results: { id: string; name: string; count: number }[] = [];

    // ブランド絞り込みのリンクを探す
    document.querySelectorAll('a[href*="fq.brand="]').forEach((a) => {
      const href = a.getAttribute('href') || '';
      const match = href.match(/fq\.brand=(b\d+)/);
      if (!match) return;

      const id = match[1];
      const text = a.textContent?.trim() || '';
      // "ブランド名(123)" のパターンから名前と件数を抽出
      const countMatch = text.match(/^(.+?)\((\d+)\)$/);
      if (countMatch) {
        results.push({
          id,
          name: countMatch[1].trim(),
          count: parseInt(countMatch[2], 10),
        });
      } else {
        results.push({ id, name: text, count: 0 });
      }
    });

    return results;
  });

  // 重複排除
  const seen = new Set<string>();
  const unique = brands.filter((b) => {
    if (seen.has(b.id)) return false;
    seen.add(b.id);
    return true;
  });

  console.log(
    `ブランド数: ${unique.length}, 合計商品数: ${unique.reduce((s, b) => s + b.count, 0)}`,
  );
  return unique;
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

      document.querySelectorAll('table tr').forEach((tr) => {
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

      const imgEl = document.querySelector('.bxslider img, img[src*="shopimages"]');
      const imageUrl = imgEl ? imgEl.getAttribute('src') : null;

      if (!weight || !maxDiameter || !length || !imageUrl) return null;

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
      .map((a) => {
        const href = a.getAttribute('href');
        if (!href) return '';
        return href.startsWith('http')
          ? href
          : `${origin}${href.startsWith('/') ? '' : '/'}${href}`;
      })
      .filter(Boolean);
  }, new URL(url).origin);
}

// ---------------- worker ----------------

async function worker(
  browser: Browser,
  queue: string[],
  id: number,
  stats: { saved: number; skipped: number },
) {
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

async function main() {
  if (nukeMode) {
    await nukeBarrels();
  }

  const progress = loadProgress();
  const completedSet = new Set(progress.completedBrands);

  console.log(`\nスクレイピング開始（ブランド別全量取得）`);
  if (completedSet.size > 0) {
    console.log(`完了済みブランド: ${completedSet.size}件`);
  }

  const browser = await puppeteer.launch({ headless: true });
  const listPage = await browser.newPage();
  await listPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

  // ブランド一覧取得
  const brands = await scrapeBrands(listPage);

  if (brands.length === 0) {
    console.log('ブランドが見つかりませんでした');
    await browser.close();
    return;
  }

  const stats = { saved: 0, skipped: 0 };
  let brandsDone = 0;

  for (const brand of brands) {
    // 完了済みブランドはスキップ
    if (completedSet.has(brand.id)) {
      brandsDone++;
      console.log(
        `\n[${brandsDone}/${brands.length}] ${brand.name} (${brand.id}) — スキップ（完了済み）`,
      );
      continue;
    }

    brandsDone++;
    console.log(`\n========================================`);
    console.log(`[${brandsDone}/${brands.length}] ${brand.name} (${brand.id}) — ${brand.count}件`);
    console.log(`========================================`);

    // 再開ポイント: 処理中ブランドの途中ページから再開
    const startPage = progress.currentBrand === brand.id ? progress.currentPage : 1;

    let emptyStreak = 0;

    for (let p = startPage; p < 9999; p++) {
      const url = `${BASE_URL}/shopbrand/${CATEGORY}?sort=publish_start_date%20desc&fq.category=${CATEGORY}&fq.brand=${brand.id}&page=${p}`;
      const links = await scrapeList(listPage, url);

      if (links.length === 0) {
        console.log(`  ページ${p}: 商品なし — 次のブランドへ`);
        break;
      }

      const queue = links.filter((u) => {
        if (visited.has(u)) return false;
        visited.add(u);
        return true;
      });

      console.log(`  ページ${p}: リンク${links.length}件, 新規${queue.length}件`);

      if (queue.length > 0) {
        emptyStreak = 0;
        const workers = Array.from({ length: CONCURRENCY }, (_, i) =>
          worker(browser, queue, i + 1, stats),
        );
        await Promise.all(workers);
      } else {
        emptyStreak++;
        if (emptyStreak >= 2) {
          console.log(`  新規0が${emptyStreak}ページ連続 — 次のブランドへ`);
          break;
        }
      }

      // 進捗保存
      progress.currentBrand = brand.id;
      progress.currentPage = p + 1;
      saveProgress(progress);
      saveVisited();

      console.log(`  累計: 保存${stats.saved}件 / スキップ${stats.skipped}件`);

      await sleep(500); // ブランド内ページ間の待機
    }

    // ブランド完了
    progress.completedBrands.push(brand.id);
    progress.currentBrand = null;
    progress.currentPage = 1;
    saveProgress(progress);
    saveVisited();

    await sleep(1000); // ブランド間の待機
  }

  await listPage.close();
  await browser.close();

  // 完了時にプログレスファイルをクリーンアップ
  if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);

  console.log(`\n完了！合計 ${stats.saved} 件保存、${stats.skipped} 件スキップ`);
  console.log(`処理ブランド数: ${brands.length}`);
}

main().catch((e) => {
  console.error('エラー:', e);
  saveVisited();
  process.exit(1);
});

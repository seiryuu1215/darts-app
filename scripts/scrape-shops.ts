/**
 * ダーツライブサーチ ショップスクレイパー
 *
 * ダーツライブサーチからショップ一覧を取得してFirestoreに保存する。
 * 月1回手動実行想定（cronではない）。
 *
 * 使い方:
 *   npx tsx scripts/scrape-shops.ts
 *
 * PCスリープ防止（Mac）:
 *   caffeinate -i npx tsx scripts/scrape-shops.ts > scrape-shops-log.txt 2>&1
 */

import 'dotenv/config';
import { config } from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import puppeteer from 'puppeteer';
import type { Page } from 'puppeteer';
import fs from 'fs';

config({ path: '.env.local' });

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error('NEXT_PUBLIC_FIREBASE_PROJECT_ID missing');
  process.exit(1);
}

const app = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS) })
  : initializeApp({ projectId });

const firestoreDb = getFirestore(app);

const PROGRESS_FILE = 'progress-shops.txt';
const BASE_URL = 'https://search.dartslive.com/jp/';

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function writeProgress(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(PROGRESS_FILE, line + '\n');
}

interface ShopData {
  name: string;
  address: string;
  nearestStation: string;
  area: string;
}

// 都道府県リスト
const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
  '岐阜県', '静岡県', '愛知県', '三重県',
  '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
  '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県',
  '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
];

async function scrapeShopList(page: Page): Promise<ShopData[]> {
  const shops: ShopData[] = [];

  // ショップ一覧ページを開く
  await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(2000);

  // ページ内の店舗一覧を取得
  const shopElements = await page.$$('.shop-list .shop-item, .shopList .shopItem, table.shop-table tr, .shop-card, .result-item, li.shop');

  if (shopElements.length > 0) {
    for (const el of shopElements) {
      try {
        const data = await el.evaluate((node) => {
          const nameEl = node.querySelector('.shop-name, .name, h3, h4, .title, td:first-child');
          const addressEl = node.querySelector('.shop-address, .address, .addr, td:nth-child(2)');
          const stationEl = node.querySelector('.shop-station, .station, .nearest, td:nth-child(3)');

          return {
            name: nameEl?.textContent?.trim() || '',
            address: addressEl?.textContent?.trim() || '',
            nearestStation: stationEl?.textContent?.trim() || '',
          };
        });

        if (data.name) {
          // 都道府県を住所から推定
          const area = PREFECTURES.find((p) => data.address.includes(p)) || '';
          shops.push({ ...data, area });
        }
      } catch {
        // skip individual item errors
      }
    }
  } else {
    // alternative: try to find shops from search API
    writeProgress('No shop elements found with standard selectors, trying alternative approach...');

    // Try area-based search
    for (const prefecture of PREFECTURES) {
      try {
        const searchUrl = `${BASE_URL}?keyword=${encodeURIComponent(prefecture)}`;
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        await sleep(1500);

        const items = await page.evaluate(() => {
          const results: { name: string; address: string; nearestStation: string }[] = [];
          // Try various selectors that dartslive search might use
          const elements = document.querySelectorAll('[class*="shop"], [class*="store"], [class*="result"], tr, li');
          elements.forEach((el) => {
            const text = el.textContent?.trim() || '';
            if (text.length > 5 && text.length < 500) {
              const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
              if (lines.length >= 2) {
                results.push({
                  name: lines[0] || '',
                  address: lines[1] || '',
                  nearestStation: lines[2] || '',
                });
              }
            }
          });
          return results;
        });

        for (const item of items) {
          if (item.name && !shops.some((s) => s.name === item.name)) {
            shops.push({ ...item, area: prefecture });
          }
        }

        writeProgress(`${prefecture}: ${items.length} shops found (total: ${shops.length})`);
      } catch (err) {
        writeProgress(`Error scraping ${prefecture}: ${err}`);
      }
    }
  }

  return shops;
}

async function saveShop(shop: ShopData) {
  const id = Buffer.from(shop.name + shop.address).toString('base64url').slice(0, 128);
  await firestoreDb.doc(`shops/${id}`).set({
    name: shop.name,
    address: shop.address,
    nearestStation: shop.nearestStation,
    area: shop.area,
    source: 'dartslive_search',
    scrapedAt: Timestamp.now(),
  }, { merge: true });
}

async function main() {
  writeProgress('Starting shop scraper...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    );

    const shops = await scrapeShopList(page);
    writeProgress(`Total shops scraped: ${shops.length}`);

    let saved = 0;
    for (const shop of shops) {
      try {
        await saveShop(shop);
        saved++;
        if (saved % 50 === 0) {
          writeProgress(`Saved ${saved}/${shops.length} shops`);
        }
      } catch (err) {
        writeProgress(`Error saving shop "${shop.name}": ${err}`);
      }
    }

    writeProgress(`Done. Saved ${saved} shops to Firestore.`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

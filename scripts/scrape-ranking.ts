/**
 * ダーツハイブ バレル売上ランキング取得
 * Firestoreの barrelRanking コレクションに保存
 *
 * 使い方: npx tsx scripts/scrape-ranking.ts
 */

import 'dotenv/config';
import { config } from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import puppeteer from 'puppeteer';

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

interface RankedBarrel {
  rank: number;
  name: string;
  imageUrl: string | null;
  productUrl: string;
  price: string;
}

type RankingPeriod = 'weekly' | 'monthly' | 'all';

/** 期間別のダーツハイブURL */
const PERIOD_URLS: Record<RankingPeriod, string> = {
  weekly:
    'https://www.dartshive.jp/shopbrand/010/?sort=salescount%20desc&salesperiod=7&fq.category=010&fq.status=0&fq.discontinued=0',
  monthly:
    'https://www.dartshive.jp/shopbrand/010/?sort=salescount%20desc&salesperiod=30&fq.category=010&fq.status=0&fq.discontinued=0',
  all: 'https://www.dartshive.jp/shopbrand/010/?sort=salescount%20desc&fq.category=010&fq.status=0&fq.discontinued=0',
};

/** 1ページからランキングデータをスクレイプ */
async function scrapePeriod(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof puppeteer.launch>>['newPage']>>,
  period: RankingPeriod,
): Promise<RankedBarrel[]> {
  const url = PERIOD_URLS[period];
  console.log(`\n[${period}] スクレイプ中... ${url}`);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

  const items = await page.evaluate(() => {
    const results: { name: string; imageUrl: string | null; productUrl: string; price: string }[] =
      [];
    const seen = new Set<string>();

    document.querySelectorAll('a[href*="shopdetail"]').forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || href.includes('12076')) return;
      const cleanHref = href.replace(/#.*$/, '').replace(/\/$/, '');
      if (seen.has(cleanHref)) return;
      seen.add(cleanHref);

      const img = a.querySelector('img');
      const nameEl = a
        .closest('.item, .itemBox, li, [class*="product"]')
        ?.querySelector('[class*="name"], [class*="title"], p, h3');
      const priceEl = a
        .closest('.item, .itemBox, li, [class*="product"]')
        ?.querySelector('[class*="price"], .price');

      results.push({
        name: nameEl?.textContent?.trim() || img?.getAttribute('alt')?.trim() || '',
        imageUrl: img?.getAttribute('src') || null,
        productUrl: cleanHref.startsWith('http')
          ? cleanHref
          : `https://www.dartshive.jp${cleanHref}`,
        price: priceEl?.textContent?.trim() || '',
      });
    });

    return results;
  });

  console.log(`[${period}] ${items.length}件の商品を取得`);
  return items.slice(0, 20).map((item, i) => ({ rank: i + 1, ...item }));
}

async function main() {
  console.log('ダーツハイブ バレルランキング取得中...');

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

  const periods: RankingPeriod[] = ['weekly', 'monthly', 'all'];
  const allRankings: { period: RankingPeriod; items: RankedBarrel[] }[] = [];

  for (const period of periods) {
    const items = await scrapePeriod(page, period);
    allRankings.push({ period, items });
  }

  // 既存ランキングを削除して新しいものに置換
  const snapshot = await db.collection('barrelRanking').get();
  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));

  for (const { period, items } of allRankings) {
    items.forEach((item) => {
      const docRef = db.collection('barrelRanking').doc(`${period}_rank_${item.rank}`);
      batch.set(docRef, {
        ...item,
        period,
        source: 'dartshive',
        updatedAt: Timestamp.now(),
      });
    });
  }

  await batch.commit();

  for (const { period, items } of allRankings) {
    console.log(`\n--- ${period} ---`);
    items.forEach((item) => console.log(`  ${item.rank}. ${item.name}`));
  }

  await browser.close();
  const total = allRankings.reduce((s, r) => s + r.items.length, 0);
  console.log(`\n完了！合計${total}件のランキングを保存`);
}

main().catch((e) => {
  console.error('エラー:', e);
  process.exit(1);
});

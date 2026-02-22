import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { canAutoImportShops } from '@/lib/permissions';
import { withPermission, withErrorHandler } from '@/lib/api-middleware';
import { LINE_STATIONS, STATION_TO_LINES } from '@/lib/line-stations';
import {
  sleep,
  searchShopsByStation,
  fetchShopDetails,
  isAllowedPrefecture,
  processInChunks,
  type ImportResult,
} from '@/lib/shop-import';

export const maxDuration = 120;

export const POST = withErrorHandler(
  withPermission(canAutoImportShops, 'PROプラン以上が必要です', async (req, { userId }) => {
    const body = await req.json();
    const lineName: string = body.lineName;

    const stations = LINE_STATIONS[lineName];
    if (!stations) {
      return NextResponse.json({ error: `路線 "${lineName}" が見つかりません` }, { status: 400 });
    }

    // 駅検索 → shopEncId収集
    const shopToStations = new Map<string, Set<string>>();
    for (const station of stations) {
      const ids = await searchShopsByStation(station);
      for (const id of ids) {
        if (!shopToStations.has(id)) {
          shopToStations.set(id, new Set());
        }
        shopToStations.get(id)!.add(station);
      }
      await sleep(500);
    }

    // 駅→路線マッピング
    const shopToLines = new Map<string, string[]>();
    for (const [shopId, stationSet] of shopToStations) {
      const lineSet = new Set<string>();
      for (const station of stationSet) {
        const lines = STATION_TO_LINES[station];
        if (lines) {
          for (const line of lines) lineSet.add(line);
        }
      }
      shopToLines.set(shopId, [...lineSet].sort());
    }

    // 詳細取得（3件ずつ並行、800msディレイ）
    const shopIds = [...shopToStations.keys()];
    const shopDetails = new Map<
      string,
      {
        name: string;
        address: string;
        nearestStation: string;
        imageUrl: string | null;
        machineCount: { dl2: number; dl3: number } | null;
        tags: string[];
        lines: string[];
      }
    >();

    await processInChunks(shopIds, 3, 800, async (shopId) => {
      const details = await fetchShopDetails(shopId);
      if (details) {
        const lines = shopToLines.get(shopId) ?? [];
        shopDetails.set(shopId, { ...details, lines });
      }
      return details;
    });

    // 都道府県フィルター
    let shopsSkipped = 0;
    for (const [shopId, details] of shopDetails) {
      if (!isAllowedPrefecture(details.address)) {
        shopDetails.delete(shopId);
        shopsSkipped++;
      }
    }

    // Firestoreに保存
    const bookmarksRef = adminDb.collection(`users/${userId}/shopBookmarks`);
    let shopsSaved = 0;
    let errors = 0;

    for (const [shopEncId, details] of shopDetails) {
      try {
        const docId = `dl_${shopEncId}`;
        const docRef = bookmarksRef.doc(docId);
        const existing = await docRef.get();

        if (existing.exists) {
          await docRef.set(
            {
              name: details.name,
              address: details.address,
              nearestStation: details.nearestStation,
              imageUrl: details.imageUrl,
              machineCount: details.machineCount,
              tags: details.tags,
              lines: details.lines,
              dartsliveSearchUrl: `https://search.dartslive.com/jp/shop/${shopEncId}`,
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
        } else {
          await docRef.set({
            name: details.name,
            address: details.address,
            nearestStation: details.nearestStation,
            imageUrl: details.imageUrl,
            machineCount: details.machineCount,
            tags: details.tags,
            lines: details.lines,
            dartsliveSearchUrl: `https://search.dartslive.com/jp/shop/${shopEncId}`,
            note: '',
            rating: null,
            visitCount: 0,
            lastVisitedAt: null,
            isFavorite: false,
            listIds: [],
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
        shopsSaved++;
      } catch {
        errors++;
      }
    }

    const result: ImportResult = {
      lineName,
      stationsSearched: stations.length,
      shopsFound: shopToStations.size,
      shopsSaved,
      shopsSkipped,
      errors,
    };

    return NextResponse.json(result);
  }),
  'Shop import error',
);

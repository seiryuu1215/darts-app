import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withAdmin, withErrorHandler } from '@/lib/api-middleware';
import { sendLinePushMessage, buildDailyCarouselMessage } from '@/lib/line';
import {
  buildRoleBasedDailyNotification,
  type DailyNotificationContext,
} from '@/lib/line-notification-builder';
import type { CountUpPlayData } from '@/lib/dartslive-api';

export const maxDuration = 60;

export const POST = withErrorHandler(
  withAdmin(async (_req: NextRequest, ctx) => {
    const userId = ctx.userId;

    // ユーザーの lineUserId を取得
    const userDoc = await adminDb.doc(`users/${userId}`).get();
    const userData = userDoc.data();
    const lineUserId = userData?.lineUserId;

    if (!lineUserId) {
      return NextResponse.json(
        { error: 'LINE未連携です。先にアカウントを連携してください。' },
        { status: 400 },
      );
    }

    // キャッシュからスタッツを取得
    const cacheDoc = await adminDb.doc(`users/${userId}/dartsliveCache/latest`).get();
    const cacheData = cacheDoc.exists ? cacheDoc.data() : null;

    if (!cacheData) {
      return NextResponse.json(
        { error: 'キャッシュデータがありません。先に取得を実行してください。' },
        { status: 400 },
      );
    }

    // CUプレイデータを取得
    let allCuPlays: CountUpPlayData[] = [];
    let yesterdayCuPlays: CountUpPlayData[] = [];

    try {
      const cuCacheDoc = await adminDb.doc(`users/${userId}/dartsliveApiCache/countupPlays`).get();
      if (cuCacheDoc.exists) {
        allCuPlays = JSON.parse(cuCacheDoc.data()?.data ?? '[]');
        // テスト用: 直近のプレイをyesterdayCuPlaysとして使用
        if (allCuPlays.length > 0) {
          // 最新日のプレイを抽出
          const latestDate = allCuPlays[allCuPlays.length - 1].time
            .replace(/\//g, '-')
            .split(/[T _]/)[0];
          yesterdayCuPlays = allCuPlays.filter((p) => {
            const ds = p.time.replace(/\//g, '-').split(/[T _]/)[0];
            return ds === latestDate;
          });
        }
      }
    } catch {
      // CUデータなしでも続行
    }

    // テスト日付
    const now = new Date();
    now.setHours(now.getHours() + 9);
    const dateStr = `[TEST] ${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;

    // adminティアのフル分析カルーセルを構築
    const notifCtx: DailyNotificationContext = {
      userId,
      role: 'admin',
      stats: {
        rating: cacheData.rating ?? null,
        ppd: cacheData.stats01Avg ?? null,
        mpr: cacheData.statsCriAvg ?? null,
        prevRating: cacheData.prevRating ?? null,
        dateStr,
        awards: {
          dBull: cacheData.bullStats?.dBull ?? 0,
          sBull: cacheData.bullStats?.sBull ?? 0,
          hatTricks: cacheData.hatTricks ?? 0,
          ton80: cacheData.ton80 ?? 0,
          lowTon: cacheData.lowTon ?? 0,
          highTon: cacheData.highTon ?? 0,
          threeInABed: cacheData.threeInABed ?? 0,
          threeInABlack: cacheData.threeInABlack ?? 0,
          whiteHorse: cacheData.whiteHorse ?? 0,
        },
      },
      allCuPlays: allCuPlays.length > 0 ? allCuPlays : undefined,
      yesterdayCuPlays: yesterdayCuPlays.length > 0 ? yesterdayCuPlays : undefined,
    };

    const result = await buildRoleBasedDailyNotification(notifCtx);
    const messages: object[] = [];
    if (result.bubbles.length > 0) {
      messages.push(buildDailyCarouselMessage(result.bubbles));
    }
    if (result.imageMessages) {
      messages.push(...result.imageMessages);
    }

    if (messages.length === 0) {
      return NextResponse.json({ success: false, message: '送信するデータがありません' });
    }

    const sent = await sendLinePushMessage(lineUserId, messages);

    return NextResponse.json({
      success: sent,
      bubbleCount: result.bubbles.length,
      imageCount: result.imageMessages?.length ?? 0,
      message: sent
        ? `テスト通知を送信しました（${result.bubbles.length}バブル, ${result.imageMessages?.length ?? 0}画像）`
        : '送信に失敗しました',
    });
  }),
  'admin/line-test',
);

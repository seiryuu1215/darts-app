import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import {
  validateLineSignature,
  replyLineMessage,
  getConditionLabel,
  buildCompletionMessage,
  buildStatsFlexMessage,
} from '@/lib/line';
import { decrypt } from '@/lib/crypto';
import { dlApiFullSync, dlApiDiffSync, mapApiToScrapedStats } from '@/lib/dartslive-api';
import type { ScrapedStats } from '@/lib/dartslive-scraper';

export const maxDuration = 60;

interface LineEvent {
  type: string;
  replyToken?: string;
  source?: { type: string; userId?: string };
  message?: { type: string; text?: string };
}

/** 会話状態を取得 */
async function getConversation(lineUserId: string) {
  const ref = adminDb.doc(`lineConversations/${lineUserId}`);
  const snap = await ref.get();
  if (!snap.exists)
    return { state: 'idle' as const, pendingStats: null, condition: null, memo: null, pendingMemo: null };
  return snap.data() as {
    state: 'idle' | 'waiting_condition' | 'waiting_memo' | 'waiting_challenge' | 'waiting_practice_memo';
    pendingStats: Record<string, unknown> | null;
    condition: number | null;
    memo: string | null;
    pendingMemo: string | null;
  };
}

/** 会話状態を更新 */
async function setConversation(lineUserId: string, data: Record<string, unknown>) {
  const ref = adminDb.doc(`lineConversations/${lineUserId}`);
  await ref.set({ ...data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

/** lineUserIdからユーザーを検索 */
async function findUserByLineId(lineUserId: string) {
  const snap = await adminDb
    .collection('users')
    .where('lineUserId', '==', lineUserId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

/** ★テキストから condition 数値を抽出 */
function parseCondition(text: string): number | null {
  const match = text.match(/★([1-5])/);
  return match ? parseInt(match[1], 10) : null;
}

/** 8桁コードかどうか判定 */
function isLinkCode(text: string): boolean {
  return /^\d{8}$/.test(text.trim());
}

export async function POST(request: NextRequest) {
  // 生のリクエストボディを取得（署名検証用）
  const rawBody = await request.text();
  const signature = request.headers.get('x-line-signature') || '';

  if (!validateLineSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  const body = JSON.parse(rawBody);
  const events: LineEvent[] = body.events || [];

  for (const event of events) {
    const lineUserId = event.source?.userId;
    if (!lineUserId) continue;

    try {
      if (event.type === 'follow') {
        await handleFollow(event, lineUserId);
      } else if (event.type === 'unfollow') {
        await handleUnfollow(lineUserId);
      } else if (event.type === 'message' && event.message?.type === 'text') {
        await handleTextMessage(event, lineUserId, event.message.text || '');
      }
    } catch (err) {
      console.error('Webhook event error:', err);
    }
  }

  return NextResponse.json({ ok: true });
}

/** フォローイベント: ウェルカム + コード案内 */
async function handleFollow(event: LineEvent, lineUserId: string) {
  if (!event.replyToken) return;
  await replyLineMessage(event.replyToken, [
    {
      type: 'text',
      text: 'Darts Lab へようこそ！🎯\n\nWebサイトのプロフィール編集ページから「LINE連携コードを発行」して、ここに8桁のコードを送信するとアカウントが連携されます。',
    },
  ]);
}

/** アンフォローイベント: lineUserId をクリア */
async function handleUnfollow(lineUserId: string) {
  const user = await findUserByLineId(lineUserId);
  if (user) {
    await adminDb.doc(`users/${user.id}`).update({
      lineUserId: null,
      lineNotifyEnabled: false,
    });
  }
  // 会話状態もクリア
  await adminDb
    .doc(`lineConversations/${lineUserId}`)
    .delete()
    .catch(() => {});
}

/** テキストメッセージハンドリング */
async function handleTextMessage(event: LineEvent, lineUserId: string, text: string) {
  if (!event.replyToken) return;
  const trimmed = text.trim();

  // 8桁コード → アカウント連携
  if (isLinkCode(trimmed)) {
    await handleLinkCode(event.replyToken, lineUserId, trimmed);
    return;
  }

  // 「取得」コマンド: どの状態からでも再取得可能
  if (trimmed === '取得') {
    await setConversation(lineUserId, {
      state: 'idle',
      pendingStats: null,
      condition: null,
      memo: null,
    });
    await handleFetchStats(event.replyToken, lineUserId);
    return;
  }

  // 「ヘルプ」コマンド: コマンド一覧を表示
  if (trimmed === 'ヘルプ') {
    await replyLineMessage(event.replyToken, [
      {
        type: 'text',
        text: [
          '📖 Darts Lab コマンド一覧',
          '',
          '📊 「取得」',
          '  → DARTSLIVEスタッツを今すぐ取得',
          '',
          '📝 「メモ」',
          '  → 練習メモを保存（次回スタッツに紐づけ）',
          '',
          '❓ 「ヘルプ」',
          '  → このコマンド一覧を表示',
          '',
          '💡 スタッツは毎朝自動で確認し、プレイがあれば通知します。',
        ].join('\n'),
      },
    ]);
    return;
  }

  // 会話状態に応じた処理
  const conv = await getConversation(lineUserId);

  if (conv.state === 'waiting_condition') {
    const condition = parseCondition(trimmed);
    if (!condition) {
      await replyLineMessage(event.replyToken, [
        {
          type: 'text',
          text: '★1〜★5 から選んでください。',
          quickReply: {
            items: [1, 2, 3, 4, 5].map((n) => ({
              type: 'action',
              action: { type: 'message', label: `★${n}`, text: `★${n}` },
            })),
          },
        },
      ]);
      return;
    }

    await setConversation(lineUserId, {
      state: 'waiting_memo',
      condition,
    });

    const label = getConditionLabel(condition);
    await replyLineMessage(event.replyToken, [
      {
        type: 'text',
        text: `★${condition}（${label}）で記録します。\nメモがあれば入力してください。（「なし」でスキップ）`,
      },
    ]);
    return;
  }

  if (conv.state === 'waiting_memo') {
    const memo = trimmed === 'なし' ? '' : trimmed;

    await setConversation(lineUserId, {
      state: 'waiting_challenge',
      memo,
    });

    await replyLineMessage(event.replyToken, [
      {
        type: 'text',
        text: '次回への課題があれば入力してください。（「なし」でスキップ）',
      },
    ]);
    return;
  }

  if (conv.state === 'waiting_challenge') {
    const challenge = trimmed === 'なし' ? '' : trimmed;
    const user = await findUserByLineId(lineUserId);
    if (!user || !conv.pendingStats) {
      await replyLineMessage(event.replyToken, [
        { type: 'text', text: 'エラーが発生しました。もう一度お試しください。' },
      ]);
      await setConversation(lineUserId, {
        state: 'idle',
        pendingStats: null,
        condition: null,
        memo: null,
      });
      return;
    }

    const stats = conv.pendingStats;
    const condition = conv.condition || 3;
    const memo = conv.memo || '';

    // Firestore に dartsLiveStats レコード作成
    await adminDb.collection(`users/${user.id}/dartsLiveStats`).add({
      date: stats.date
        ? new Date(String(stats.date).replace(/\//g, '-') + 'T00:00:00+09:00')
        : FieldValue.serverTimestamp(),
      rating: stats.rating ?? null,
      gamesPlayed: stats.gamesPlayed ?? 0,
      zeroOneStats: {
        ppd: stats.ppd ?? 0,
        avg: stats.avg01 ?? null,
        highOff: null,
      },
      cricketStats: {
        mpr: stats.mpr ?? 0,
        highScore: null,
      },
      bullRate: null,
      hatTricks: stats.hatTricksTotal ?? null,
      bullStats:
        stats.dBullTotal != null && stats.sBullTotal != null
          ? { dBull: Number(stats.dBullTotal), sBull: Number(stats.sBullTotal) }
          : null,
      ton80: stats.ton80 ?? undefined,
      lowTon: stats.lowTon ?? undefined,
      highTon: stats.highTon ?? undefined,
      threeInABed: stats.threeInABed ?? undefined,
      threeInABlack: stats.threeInABlack ?? undefined,
      whiteHorse: stats.whiteHorse ?? undefined,
      condition,
      memo,
      challenge,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 完了通知
    await replyLineMessage(event.replyToken, [
      buildCompletionMessage({
        rating: (stats.rating as number) ?? null,
        ppd: (stats.ppd as number) ?? null,
        condition,
        memo,
        challenge,
      }),
    ]);

    // 会話状態リセット
    await setConversation(lineUserId, {
      state: 'idle',
      pendingStats: null,
      condition: null,
      memo: null,
    });
    return;
  }

  // waiting_practice_memo 状態: メモテキストを保存
  if (conv.state === 'waiting_practice_memo') {
    const memoText = trimmed;

    await setConversation(lineUserId, {
      state: 'idle',
      pendingMemo: memoText,
      pendingMemoAt: FieldValue.serverTimestamp(),
    });

    await replyLineMessage(event.replyToken, [
      {
        type: 'text',
        text: `メモを保存しました。次回スタッツ更新時に反映されます。\n\n📝 ${memoText}`,
      },
    ]);
    return;
  }

  // idle 状態: 「メモ」コマンド → 練習メモ入力モードへ
  if (conv.state === 'idle' && trimmed === 'メモ') {
    // 既にpendingMemoがある場合は上書き確認
    if (conv.pendingMemo) {
      await setConversation(lineUserId, {
        state: 'waiting_practice_memo',
      });

      await replyLineMessage(event.replyToken, [
        {
          type: 'text',
          text: `既にメモがあります:\n「${conv.pendingMemo}」\n\n新しいメモを入力すると上書きされます。練習メモを入力してください。`,
        },
      ]);
    } else {
      await setConversation(lineUserId, {
        state: 'waiting_practice_memo',
      });

      await replyLineMessage(event.replyToken, [
        {
          type: 'text',
          text: '練習メモを入力してください。次回のスタッツ更新時に紐づけます。',
        },
      ]);
    }
    return;
  }

  // idle 状態での通常メッセージ
  await replyLineMessage(event.replyToken, [
    {
      type: 'text',
      text: 'Darts Lab Bot です。\n毎朝DARTSLIVEのスタッツを確認して、プレイがあれば通知します。\n\n「取得」と送信すると、今すぐスタッツを取得できます。\n「メモ」と送信すると、練習メモを残せます。',
    },
  ]);
}

/** 「取得」コマンド: オンデマンドスタッツ取得（admin→API優先、非admin→Puppeteer） */
async function handleFetchStats(replyToken: string, lineUserId: string) {
  const user = await findUserByLineId(lineUserId);
  if (!user) {
    await replyLineMessage(replyToken, [
      { type: 'text', text: 'アカウントが連携されていません。先に8桁コードで連携してください。' },
    ]);
    return;
  }

  const userData = user as Record<string, unknown>;
  const dlCreds = userData.dlCredentialsEncrypted as
    | { email: string; password: string }
    | null
    | undefined;

  if (!dlCreds?.email || !dlCreds?.password) {
    await replyLineMessage(replyToken, [
      {
        type: 'text',
        text: 'DARTSLIVE認証情報が設定されていません。Webサイトのプロフィール編集ページから設定してください。',
      },
    ]);
    return;
  }

  try {
    const dlEmail = decrypt(dlCreds.email);
    const dlPassword = decrypt(dlCreds.password);

    let stats: ScrapedStats;

    if (userData.role === 'admin') {
      // admin: DARTSLIVE API を優先使用（cronと同一パス）
      try {
        const apiCacheDoc = await adminDb
          .doc(`users/${user.id}/dartsliveApiCache/latest`)
          .get();
        const existingLastSync = apiCacheDoc.exists
          ? (apiCacheDoc.data()?.lastSyncAt?.toDate?.()?.toISOString() ?? null)
          : null;

        let apiSyncResult;
        if (existingLastSync) {
          apiSyncResult = await dlApiDiffSync(dlEmail, dlPassword, existingLastSync);
        } else {
          apiSyncResult = await dlApiFullSync(dlEmail, dlPassword);
        }
        stats = mapApiToScrapedStats(apiSyncResult);
      } catch (apiErr) {
        console.error(`API sync failed for admin ${user.id}, falling back to scraper:`, apiErr);
        // Puppeteerにフォールバック
        stats = await fetchStatsByScraper(dlEmail, dlPassword);
      }
    } else {
      // 非admin: 従来通りPuppeteer使用
      stats = await fetchStatsByScraper(dlEmail, dlPassword);
    }

    // 前回キャッシュを取得
    const cacheRef = adminDb.doc(`users/${user.id}/dartsliveCache/latest`);
    const prevDoc = await cacheRef.get();
    const prevData = prevDoc.exists ? prevDoc.data() : null;

    // 今日の日付文字列 (JST)
    const now = new Date();
    now.setHours(now.getHours() + 9); // UTC→JST
    const dateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;

    // Flex Message でスタッツ表示（差分付き）
    const flexMsg = buildStatsFlexMessage({
      date: dateStr,
      rating: stats.rating,
      ppd: stats.stats01Avg,
      mpr: stats.statsCriAvg,
      prevRating: prevData?.rating ?? null,
      awards: {
        dBull: stats.dBullTotal,
        sBull: stats.sBullTotal,
        hatTricks: stats.hatTricksTotal,
        ton80: stats.ton80,
        lowTon: stats.lowTon,
        highTon: stats.highTon,
        threeInABed: stats.threeInABed,
        threeInABlack: stats.threeInABlack,
        whiteHorse: stats.whiteHorse,
      },
      prevAwards: prevData
        ? {
            dBull: prevData.bullStats?.dBull ?? 0,
            sBull: prevData.bullStats?.sBull ?? 0,
            hatTricks: prevData.hatTricks ?? 0,
            ton80: prevData.ton80 ?? 0,
            lowTon: prevData.lowTon ?? 0,
            highTon: prevData.highTon ?? 0,
            threeInABed: prevData.threeInABed ?? 0,
            threeInABlack: prevData.threeInABlack ?? 0,
            whiteHorse: prevData.whiteHorse ?? 0,
          }
        : undefined,
    });

    await replyLineMessage(replyToken, [flexMsg]);

    // キャッシュ更新
    await cacheRef.set(
      {
        rating: stats.rating,
        stats01Avg: stats.stats01Avg,
        statsCriAvg: stats.statsCriAvg,
        bullStats: {
          dBull: stats.dBullTotal,
          sBull: stats.sBullTotal,
        },
        hatTricks: stats.hatTricksTotal,
        ton80: stats.ton80,
        lowTon: stats.lowTon,
        highTon: stats.highTon,
        threeInABed: stats.threeInABed,
        threeInABlack: stats.threeInABlack,
        whiteHorse: stats.whiteHorse,
        prevRating: prevData?.rating ?? null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    // 会話状態を waiting_condition に遷移
    await setConversation(lineUserId, {
      state: 'waiting_condition',
      pendingStats: {
        date: dateStr,
        rating: stats.rating,
        ppd: stats.stats01Avg,
        mpr: stats.statsCriAvg,
        avg01: stats.stats01Avg,
        dBullTotal: stats.dBullTotal,
        sBullTotal: stats.sBullTotal,
        ton80: stats.ton80,
        lowTon: stats.lowTon,
        highTon: stats.highTon,
        threeInABed: stats.threeInABed,
        threeInABlack: stats.threeInABlack,
        whiteHorse: stats.whiteHorse,
        hatTricksTotal: stats.hatTricksTotal,
      },
      condition: null,
      memo: null,
    });
  } catch (err) {
    console.error('Fetch stats error:', err);
    await replyLineMessage(replyToken, [
      {
        type: 'text',
        text: 'スタッツの取得に失敗しました。DARTSLIVEの認証情報を確認してください。',
      },
    ]);
  }
}

/** Puppeteerでスタッツ取得（非admin / APIフォールバック共用） */
async function fetchStatsByScraper(dlEmail: string, dlPassword: string): Promise<ScrapedStats> {
  const { launchBrowser, createPage, login, scrapeStats } =
    await import('@/lib/dartslive-scraper');

  const browser = await launchBrowser();
  try {
    const page = await createPage(browser);
    try {
      const loginSuccess = await login(page, dlEmail, dlPassword);
      if (!loginSuccess) {
        throw new Error('DARTSLIVEへのログインに失敗しました。');
      }
      return await scrapeStats(page);
    } finally {
      await page.close();
    }
  } finally {
    await browser.close().catch(() => {});
  }
}

/** 8桁コードでアカウント連携 */
async function handleLinkCode(replyToken: string, lineUserId: string, code: string) {
  const codeRef = adminDb.doc(`lineLinkCodes/${code}`);
  const codeSnap = await codeRef.get();

  if (!codeSnap.exists) {
    await replyLineMessage(replyToken, [
      {
        type: 'text',
        text: 'コードが見つかりません。有効期限が切れているか、コードが正しくない可能性があります。',
      },
    ]);
    return;
  }

  const codeData = codeSnap.data();
  if (!codeData) {
    await replyLineMessage(replyToken, [
      { type: 'text', text: 'コードの読み取りに失敗しました。' },
    ]);
    return;
  }

  // 有効期限チェック（10分）
  const expiresAt = codeData.expiresAt?.toDate?.();
  if (expiresAt && expiresAt < new Date()) {
    await codeRef.delete();
    await replyLineMessage(replyToken, [
      {
        type: 'text',
        text: 'コードの有効期限が切れています。プロフィールページから再発行してください。',
      },
    ]);
    return;
  }

  const userId = codeData.userId;
  if (!userId) {
    await replyLineMessage(replyToken, [
      { type: 'text', text: 'コードに紐づくユーザーが見つかりません。' },
    ]);
    return;
  }

  // ユーザーに lineUserId を設定
  await adminDb.doc(`users/${userId}`).update({
    lineUserId,
    lineNotifyEnabled: true,
  });

  // コードを削除
  await codeRef.delete();

  // 連携済みのユーザー名を取得
  const userSnap = await adminDb.doc(`users/${userId}`).get();
  const displayName = userSnap.data()?.displayName || 'ユーザー';

  await replyLineMessage(replyToken, [
    {
      type: 'text',
      text: `アカウント連携が完了しました！\n${displayName} さん、こんにちは。\n\n毎朝10時にDARTSLIVEをチェックして、プレイがあればここに通知します。`,
    },
  ]);
}

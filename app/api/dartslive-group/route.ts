import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { decrypt } from '@/lib/crypto';
import { withAuth, withErrorHandler, withPermission } from '@/lib/api-middleware';

export const maxDuration = 120;

interface GroupMember {
  name: string;
  rating: number;
  ppd: number;
  mpr: number;
}

type PuppeteerPage = Awaited<ReturnType<Awaited<ReturnType<typeof puppeteer.launch>>['newPage']>>;

/** DARTSLIVE ログイン */
async function login(page: PuppeteerPage, email: string, password: string) {
  await page.goto('https://card.dartslive.com/account/login.jsp', {
    waitUntil: 'networkidle2',
    timeout: 15000,
  });
  await page.type('#text', email);
  await page.type('#password', password);
  await page.click('input[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });

  if (page.url().includes('login.jsp')) {
    throw new Error('LOGIN_FAILED');
  }
}

/** ページ内のリンクを収集（グループ関連を探す） */
async function collectLinks(page: PuppeteerPage): Promise<{ href: string; text: string }[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('a')).map((a) => ({
      href: a.href || '',
      text: (a.textContent || '').trim(),
    })),
  );
}


/** ページからグループメンバーデータを抽出（柔軟なセレクタ） */
async function tryExtractGroupData(
  page: PuppeteerPage,
): Promise<{ groupName: string; members: GroupMember[] }> {
  return page.evaluate(() => {
    // グループ名: h2, h3, title系要素, もしくは特定class
    const groupName =
      document.querySelector(
        'h2.playerName, h2, .group-name, .groupName, .ttl, .title',
      )?.textContent?.trim() || '';

    const members: { name: string; rating: number; ppd: number; mpr: number }[] = [];

    const getNum = (text: string): number => {
      const n = parseFloat(text.replace(/[^0-9.]/g, ''));
      return isNaN(n) ? 0 : n;
    };

    // パターン1: テーブル行からメンバーデータを抽出
    const tableRows = document.querySelectorAll('table tr');
    tableRows.forEach((row) => {
      const cells = Array.from(row.querySelectorAll('td'));
      if (cells.length < 2) return;

      // 名前セル候補（テキストコンテンツを持つ最初のセル）
      const nameCell = cells.find((c) => {
        const t = c.textContent?.trim() || '';
        return t.length > 0 && t.length < 30 && !/^[\d.]+$/.test(t);
      });
      if (!nameCell) return;

      const name = nameCell.textContent?.trim() || '';

      // 数値セルからrating/ppd/mprを推測
      const numCells = cells
        .filter((c) => c !== nameCell)
        .map((c) => getNum(c.textContent?.trim() || ''))
        .filter((n) => n > 0);

      if (numCells.length >= 1) {
        members.push({
          name,
          rating: numCells[0] || 0,
          ppd: numCells[1] || 0,
          mpr: numCells[2] || 0,
        });
      }
    });

    // パターン2: リスト要素からメンバーデータを抽出
    if (members.length === 0) {
      const listItems = document.querySelectorAll(
        '.memberItem, .member-item, li[class*="member"], .listItem, .player',
      );
      listItems.forEach((item) => {
        const name =
          item.querySelector(
            '.name, .playerName, .member-name, .memberName, h3, h4, strong',
          )?.textContent?.trim() || '';
        if (!name) return;

        const getText = (sels: string): string => {
          for (const sel of sels.split(',')) {
            const el = item.querySelector(sel.trim());
            if (el?.textContent?.trim()) return el.textContent.trim();
          }
          return '0';
        };

        members.push({
          name,
          rating: getNum(getText('.rating, .rt, .rate, [class*="rating"]')),
          ppd: getNum(getText('.ppd, .stats01, .avg01, [class*="ppd"], [class*="01"]')),
          mpr: getNum(getText('.mpr, .statsCri, .avgCri, [class*="mpr"], [class*="cri"]')),
        });
      });
    }

    // パターン3: playerNameクラスなどから推測
    if (members.length === 0) {
      const nameEls = document.querySelectorAll('.playerName, .name, h2 + *');
      nameEls.forEach((el) => {
        const name = el.textContent?.trim() || '';
        if (!name || name.length > 30) return;
        // 近くのスタッツ要素を探す
        const parent = el.closest('tr, li, div, section');
        if (!parent) return;
        const nums = Array.from(parent.querySelectorAll('td, span, div'))
          .map((c) => getNum(c.textContent?.trim() || ''))
          .filter((n) => n > 0);
        if (nums.length > 0) {
          members.push({
            name,
            rating: nums[0] || 0,
            ppd: nums[1] || 0,
            mpr: nums[2] || 0,
          });
        }
      });
    }

    return { groupName, members };
  });
}

/** グループページをスクレイピング */
async function scrapeGroupData(page: PuppeteerPage): Promise<{
  groupName: string;
  members: GroupMember[];
  pageHtml?: string;
}> {
  // グループページへ直接アクセス（URLはデバッグで確認済み）
  const groupUrl = 'https://card.dartslive.com/t/group/index.jsp';
  try {
    await page.goto(groupUrl, {
      waitUntil: 'networkidle2',
      timeout: 15000,
    });
  } catch {
    return { groupName: '', members: [], pageHtml: 'ページ読み込みタイムアウト' };
  }

  if (page.url().includes('login.jsp')) {
    return { groupName: '', members: [], pageHtml: 'ログインページにリダイレクトされました' };
  }

  // まずメンバー抽出を試す
  const data = await tryExtractGroupData(page);
  if (data.members.length > 0) {
    return {
      groupName: data.groupName || 'マイグループ',
      members: data.members,
    };
  }

  // メンバーが見つからない場合: ページ内のリンクを確認
  // グループ一覧→個別グループページへの遷移が必要かもしれない
  const links = await collectLinks(page);
  const groupLinks = links.filter(
    (l) => l.href.includes('group') && l.href !== groupUrl && l.text.length > 0,
  );

  // グループへのリンクがあれば最初のグループに入る
  for (const gl of groupLinks) {
    try {
      await page.goto(gl.href, { waitUntil: 'networkidle2', timeout: 15000 });
      const subData = await tryExtractGroupData(page);
      if (subData.members.length > 0) {
        return {
          groupName: subData.groupName || gl.text || 'マイグループ',
          members: subData.members,
        };
      }
    } catch {
      continue;
    }
  }

  // デバッグ用: ページのHTML構造を返す（最大3000文字）
  const htmlSnippet = await page.evaluate(() => {
    // body内のテキスト構造を取得
    const body = document.body;
    if (!body) return 'body要素なし';
    return body.innerHTML.substring(0, 3000);
  });

  return {
    groupName: '',
    members: [],
    pageHtml: htmlSnippet,
  };
}

/**
 * GET /api/dartslive-group — キャッシュされたグループデータを返す
 */
export const GET = withErrorHandler(
  withAuth(async (_req: NextRequest, { userId }) => {
    const cacheDoc = await adminDb.doc(`users/${userId}/dartsliveCache/group`).get();
    if (!cacheDoc.exists) {
      return NextResponse.json({ group: null });
    }
    const data = cacheDoc.data()!;
    return NextResponse.json({
      group: {
        groupName: data.groupName,
        members: data.members,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      },
    });
  }),
  'DartsliveGroup GET error',
);

/**
 * POST /api/dartslive-group — グループデータをスクレイピングして更新
 * Pro/Admin ユーザーのみ
 */
export const POST = withErrorHandler(
  withPermission(
    (role) => role === 'pro' || role === 'admin',
    'PROプラン以上が必要です',
    async (_req: NextRequest, { userId }) => {
      const userDoc = await adminDb.doc(`users/${userId}`).get();
      const userData = userDoc.data();

      if (!userData?.dlCredentialsEncrypted?.email || !userData?.dlCredentialsEncrypted?.password) {
        return NextResponse.json(
          { error: 'DARTSLIVE連携が設定されていません' },
          { status: 400 },
        );
      }

      const dlEmail = decrypt(userData.dlCredentialsEncrypted.email);
      const dlPassword = decrypt(userData.dlCredentialsEncrypted.password);

      const isVercel = process.env.VERCEL === '1';
      const browser = await puppeteer.launch({
        args: isVercel ? chromium.args : ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 720 },
        executablePath: isVercel
          ? await chromium.executablePath()
          : process.env.CHROME_PATH ||
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        headless: true,
      });

      try {
        const page = await browser.newPage();
        await page.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        );

        // 不要リソースをブロックして高速化
        await page.setRequestInterception(true);
        page.on(
          'request',
          (req: { resourceType: () => string; abort: () => void; continue: () => void }) => {
            const type = req.resourceType();
            if (['stylesheet', 'font', 'image', 'media'].includes(type)) {
              req.abort();
            } else {
              req.continue();
            }
          },
        );

        await login(page, dlEmail, dlPassword);
        const groupData = await scrapeGroupData(page);

        await page.close();

        if (groupData.members.length === 0) {
          return NextResponse.json(
            {
              error: 'グループデータを取得できませんでした。グループに参加しているか確認してください。',
              pageHtml: groupData.pageHtml || null,
            },
            { status: 404 },
          );
        }

        // Firestoreに保存
        const cacheRef = adminDb.doc(`users/${userId}/dartsliveCache/group`);
        await cacheRef.set({
          groupName: groupData.groupName,
          members: groupData.members,
          updatedAt: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({
          group: {
            groupName: groupData.groupName,
            members: groupData.members,
          },
        });
      } finally {
        await browser.close();
      }
    },
  ),
  'DartsliveGroup POST error',
);

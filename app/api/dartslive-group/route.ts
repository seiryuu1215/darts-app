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
  cardImageUrl?: string;
}

/** DARTSLIVE ログイン */
async function login(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof puppeteer.launch>>['newPage']>>,
  email: string,
  password: string,
) {
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

/** グループページからメンバー一覧を取得 */
async function scrapeGroupMembers(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof puppeteer.launch>>['newPage']>>,
): Promise<{ groupName: string; members: GroupMember[] }> {
  // グループページへアクセス（DARTSLIVE グループ機能のURL）
  await page.goto('https://card.dartslive.com/t/group/index.jsp', {
    waitUntil: 'networkidle2',
    timeout: 15000,
  });

  return page.evaluate(() => {
    const groupName =
      document.querySelector('.group-name, .groupName, h2')?.textContent?.trim() || 'マイグループ';

    const members: {
      name: string;
      rating: number;
      ppd: number;
      mpr: number;
      cardImageUrl?: string;
    }[] = [];

    // メンバー行をパース
    const memberRows = document.querySelectorAll(
      '.member-list tr, .groupMemberList li, .memberItem',
    );
    memberRows.forEach((row) => {
      const name =
        row.querySelector('.member-name, .memberName, .name')?.textContent?.trim() || '';
      if (!name) return;

      const getNumFromEl = (sel: string): number => {
        const t = row.querySelector(sel)?.textContent?.trim() || '0';
        const n = parseFloat(t.replace(/[^0-9.]/g, ''));
        return isNaN(n) ? 0 : n;
      };

      members.push({
        name,
        rating: getNumFromEl('.rating, .rt'),
        ppd: getNumFromEl('.ppd, .stats01'),
        mpr: getNumFromEl('.mpr, .statsCri'),
        cardImageUrl:
          (row.querySelector('.card-img, .memberImg img') as HTMLImageElement)?.src || undefined,
      });
    });

    return { groupName, members };
  });
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
    return NextResponse.json({ group: cacheDoc.data() });
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

        await login(page, dlEmail, dlPassword);
        const groupData = await scrapeGroupMembers(page);

        await page.close();

        // Firestoreに保存
        const cacheRef = adminDb.doc(`users/${userId}/dartsliveCache/group`);
        await cacheRef.set({
          groupName: groupData.groupName,
          members: groupData.members,
          updatedAt: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ group: groupData });
      } finally {
        await browser.close();
      }
    },
  ),
  'DartsliveGroup POST error',
);

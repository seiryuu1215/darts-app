/**
 * LINE リッチメニュー自動セットアップスクリプト (2×3 グリッド)
 *
 * 使い方:
 *   tsx scripts/setup-line-richmenu.ts
 *
 * 環境変数:
 *   LINE_CHANNEL_ACCESS_TOKEN — LINE Messaging API のチャネルアクセストークン
 *
 * 処理:
 *   1. リッチメニュー画像を sharp + SVG で生成 (2500×1686px)
 *   2. LINE API でリッチメニューオブジェクトを作成
 *   3. 画像をアップロード
 *   4. デフォルトリッチメニューとして設定
 */

import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));

// .env.local を優先、なければ .env をロード
const envPath = resolve(__dirname, '..', '.env.local');
const envFallback = resolve(__dirname, '..', '.env');
dotenv.config({ path: existsSync(envPath) ? envPath : envFallback });

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('LINE_CHANNEL_ACCESS_TOKEN が設定されていません');
  process.exit(1);
}

const LINE_API = 'https://api.line.me/v2/bot';
const LINE_DATA_API = 'https://api-data.line.me/v2/bot';

// ─── リッチメニュー画像生成 (2×3 グリッド) ──────────────────

const WIDTH = 2500;
const HEIGHT = 1686; // 2行分 (843 × 2)
const COLS = 3;
const ROWS = 2;
const COL_W = Math.floor(WIDTH / COLS);
const ROW_H = Math.floor(HEIGHT / ROWS);

interface MenuButton {
  label: string;
  sublabel: string;
  icon: string; // SVG path
  color: string;
}

// 2×3 グリッド: 上段 [取得, 分析, トレンド] / 下段 [メモ, 設定, ヘルプ]
const BUTTONS: MenuButton[][] = [
  // 上段
  [
    {
      label: '取得',
      sublabel: 'スタッツ取得',
      icon: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z" fill="currentColor"/>`,
      color: '#1976d2',
    },
    {
      label: '分析',
      sublabel: 'CU詳細分析',
      icon: `<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" fill="currentColor"/>`,
      color: '#7B1FA2',
    },
    {
      label: 'トレンド',
      sublabel: 'Rating推移',
      icon: `<path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" fill="currentColor"/>`,
      color: '#1565C0',
    },
  ],
  // 下段
  [
    {
      label: 'メモ',
      sublabel: '練習メモ',
      icon: `<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>`,
      color: '#2E7D32',
    },
    {
      label: '設定',
      sublabel: 'プロフィール',
      icon: `<path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" fill="currentColor"/>`,
      color: '#616161',
    },
    {
      label: 'ヘルプ',
      sublabel: 'コマンド一覧',
      icon: `<path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z" fill="currentColor"/>`,
      color: '#FF9800',
    },
  ],
];

function generateMenuSvg(): string {
  const bgGradient = `
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1a1a2e"/>
        <stop offset="100%" stop-color="#16213e"/>
      </linearGradient>
    </defs>`;

  let buttonsSvg = '';

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const btn = BUTTONS[row][col];
      const cx = COL_W * col + COL_W / 2;
      const cy = ROW_H * row + ROW_H / 2;

      // 縦区切り線
      if (col > 0) {
        buttonsSvg += `<line x1="${COL_W * col}" y1="${ROW_H * row + 40}" x2="${COL_W * col}" y2="${ROW_H * (row + 1) - 40}" stroke="#ffffff" stroke-width="2" opacity="0.1"/>`;
      }

      // 横区切り線（上段と下段の間）
      if (row > 0 && col === 0) {
        buttonsSvg += `<line x1="60" y1="${ROW_H * row}" x2="${WIDTH - 60}" y2="${ROW_H * row}" stroke="#ffffff" stroke-width="2" opacity="0.1"/>`;
      }

      // アイコン円背景
      buttonsSvg += `<circle cx="${cx}" cy="${cy - 80}" r="65" fill="${btn.color}" opacity="0.25"/>`;
      buttonsSvg += `<circle cx="${cx}" cy="${cy - 80}" r="65" fill="none" stroke="${btn.color}" stroke-width="3" opacity="0.6"/>`;

      // アイコン (Material Icon SVG)
      const iconScale = 4;
      const iconX = cx - 12 * iconScale;
      const iconY = cy - 80 - 12 * iconScale;
      buttonsSvg += `<g transform="translate(${iconX}, ${iconY}) scale(${iconScale})" color="${btn.color}">${btn.icon}</g>`;

      // メインラベル
      buttonsSvg += `<text x="${cx}" y="${cy + 50}" text-anchor="middle" font-family="'Hiragino Sans', 'Noto Sans JP', sans-serif" font-size="70" font-weight="bold" fill="#ffffff">${btn.label}</text>`;

      // サブラベル
      buttonsSvg += `<text x="${cx}" y="${cy + 110}" text-anchor="middle" font-family="'Hiragino Sans', 'Noto Sans JP', sans-serif" font-size="36" fill="#888888">${btn.sublabel}</text>`;
    }
  }

  // 上部の装飾ライン
  const topLine = `<rect x="0" y="0" width="${WIDTH}" height="6" fill="#1976d2" opacity="0.8"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    ${bgGradient}
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    ${topLine}
    ${buttonsSvg}
  </svg>`;
}

async function generateMenuImage(): Promise<Buffer> {
  const svg = generateMenuSvg();
  return sharp(Buffer.from(svg)).png().toBuffer();
}

// ─── LINE API 操作 ───────────────────────────

async function lineApi(
  method: string,
  path: string,
  body?: object | Buffer,
  contentType?: string,
): Promise<unknown> {
  const base = contentType?.startsWith('image/') ? LINE_DATA_API : LINE_API;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${TOKEN}`,
  };

  let reqBody: BodyInit | undefined;
  if (body instanceof Buffer) {
    headers['Content-Type'] = contentType ?? 'image/png';
    reqBody = new Uint8Array(body);
  } else if (body) {
    headers['Content-Type'] = 'application/json';
    reqBody = JSON.stringify(body);
  }

  const res = await fetch(`${base}${path}`, { method, headers, body: reqBody });
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`LINE API ${method} ${path}: ${res.status} ${text}`);
  }

  return text ? JSON.parse(text) : null;
}

/** 既存のデフォルトリッチメニューを解除 */
async function deleteDefaultRichMenu() {
  try {
    await lineApi('DELETE', '/user/all/richmenu');
    console.log('既存のデフォルトリッチメニューを解除');
  } catch {
    // デフォルトが未設定の場合は404でも問題なし
  }
}

/** リッチメニュー一覧を取得して全削除 */
async function deleteAllRichMenus() {
  const result = (await lineApi('GET', '/richmenu/list')) as {
    richmenus: { richMenuId: string }[];
  };
  for (const rm of result.richmenus ?? []) {
    await lineApi('DELETE', `/richmenu/${rm.richMenuId}`);
    console.log(`リッチメニュー ${rm.richMenuId} を削除`);
  }
}

/** リッチメニューを作成 (2×3 グリッド) */
async function createRichMenu(): Promise<string> {
  const settingsUrl = process.env.NEXTAUTH_URL || 'https://darts-app-lime.vercel.app';

  const result = (await lineApi('POST', '/richmenu', {
    size: { width: WIDTH, height: HEIGHT },
    selected: true,
    name: 'Darts Lab メインメニュー v2',
    chatBarText: 'メニュー',
    areas: [
      // 上段: 取得, 分析, トレンド
      {
        bounds: { x: 0, y: 0, width: COL_W, height: ROW_H },
        action: { type: 'message', text: '取得' },
      },
      {
        bounds: { x: COL_W, y: 0, width: COL_W, height: ROW_H },
        action: { type: 'message', text: '分析' },
      },
      {
        bounds: { x: COL_W * 2, y: 0, width: COL_W, height: ROW_H },
        action: { type: 'message', text: 'トレンド' },
      },
      // 下段: メモ, 設定, ヘルプ
      {
        bounds: { x: 0, y: ROW_H, width: COL_W, height: ROW_H },
        action: { type: 'message', text: 'メモ' },
      },
      {
        bounds: { x: COL_W, y: ROW_H, width: COL_W, height: ROW_H },
        action: { type: 'uri', uri: `${settingsUrl}/profile/edit` },
      },
      {
        bounds: { x: COL_W * 2, y: ROW_H, width: COL_W, height: ROW_H },
        action: { type: 'message', text: 'ヘルプ' },
      },
    ],
  })) as { richMenuId: string };

  return result.richMenuId;
}

/** リッチメニュー画像をアップロード */
async function uploadRichMenuImage(richMenuId: string, image: Buffer) {
  await lineApi('POST', `/richmenu/${richMenuId}/content`, image, 'image/png');
}

/** デフォルトリッチメニューとして設定 */
async function setDefaultRichMenu(richMenuId: string) {
  await lineApi('POST', `/user/all/richmenu/${richMenuId}`);
}

// ─── メイン処理 ─────────────────────────────

async function main() {
  console.log('=== LINE リッチメニュー セットアップ (2×3) ===\n');

  // 1. 画像生成
  console.log('1. リッチメニュー画像を生成中...');
  const image = await generateMenuImage();
  console.log(`   画像サイズ: ${(image.length / 1024).toFixed(0)} KB`);
  console.log(`   解像度: ${WIDTH}×${HEIGHT}px`);

  // ローカルにも保存（確認用）
  const outPath = resolve(__dirname, '..', 'public', 'line-richmenu.png');
  await sharp(image).toFile(outPath);
  console.log(`   保存先: ${outPath}`);

  // 2. 既存リッチメニューをクリーンアップ
  console.log('\n2. 既存リッチメニューをクリーンアップ...');
  await deleteDefaultRichMenu();
  await deleteAllRichMenus();

  // 3. 新しいリッチメニューを作成
  console.log('\n3. リッチメニューを作成...');
  const richMenuId = await createRichMenu();
  console.log(`   richMenuId: ${richMenuId}`);

  // 4. 画像をアップロード
  console.log('\n4. 画像をアップロード...');
  await uploadRichMenuImage(richMenuId, image);
  console.log('   アップロード完了');

  // 5. デフォルトに設定
  console.log('\n5. デフォルトリッチメニューに設定...');
  await setDefaultRichMenu(richMenuId);
  console.log('   設定完了');

  console.log('\n=== セットアップ完了 ===');
  console.log(`リッチメニューID: ${richMenuId}`);
  console.log('レイアウト: 2×3 (取得/分析/トレンド | メモ/設定/ヘルプ)');
  console.log('LINEアプリでボットとのチャットを開くと表示されます。');
}

main().catch((err) => {
  console.error('エラー:', err);
  process.exit(1);
});

/**
 * LINE リッチメニュー自動セットアップスクリプト
 *
 * 使い方:
 *   tsx scripts/setup-line-richmenu.ts
 *
 * 環境変数:
 *   LINE_CHANNEL_ACCESS_TOKEN — LINE Messaging API のチャネルアクセストークン
 *
 * 処理:
 *   1. リッチメニュー画像を sharp + SVG で生成
 *   2. LINE API でリッチメニューオブジェクトを作成
 *   3. 画像をアップロード
 *   4. デフォルトリッチメニューとして設定
 */

import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';
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

// ─── リッチメニュー画像生成 ──────────────────

const WIDTH = 2500;
const HEIGHT = 843;
const COL_W = Math.floor(WIDTH / 3);

interface MenuButton {
  label: string;
  sublabel: string;
  icon: string; // SVG path
  color: string;
}

const BUTTONS: MenuButton[] = [
  {
    label: '取得',
    sublabel: 'スタッツ取得',
    icon: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z" fill="currentColor"/>`,
    color: '#1976d2',
  },
  {
    label: 'メモ',
    sublabel: '練習メモ',
    icon: `<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>`,
    color: '#2E7D32',
  },
  {
    label: 'ヘルプ',
    sublabel: 'コマンド一覧',
    icon: `<path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z" fill="currentColor"/>`,
    color: '#FF9800',
  },
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

  for (let i = 0; i < BUTTONS.length; i++) {
    const btn = BUTTONS[i];
    const cx = COL_W * i + COL_W / 2;
    const cy = HEIGHT / 2;

    // 区切り線
    if (i > 0) {
      buttonsSvg += `<line x1="${COL_W * i}" y1="60" x2="${COL_W * i}" y2="${HEIGHT - 60}" stroke="#ffffff" stroke-width="2" opacity="0.1"/>`;
    }

    // アイコン円背景
    buttonsSvg += `<circle cx="${cx}" cy="${cy - 100}" r="80" fill="${btn.color}" opacity="0.25"/>`;
    buttonsSvg += `<circle cx="${cx}" cy="${cy - 100}" r="80" fill="none" stroke="${btn.color}" stroke-width="3" opacity="0.6"/>`;

    // アイコン (Material Icon SVG)
    const iconScale = 5;
    const iconX = cx - 12 * iconScale;
    const iconY = cy - 100 - 12 * iconScale;
    buttonsSvg += `<g transform="translate(${iconX}, ${iconY}) scale(${iconScale})" color="${btn.color}">${btn.icon}</g>`;

    // メインラベル
    buttonsSvg += `<text x="${cx}" y="${cy + 60}" text-anchor="middle" font-family="'Hiragino Sans', 'Noto Sans JP', sans-serif" font-size="80" font-weight="bold" fill="#ffffff">${btn.label}</text>`;

    // サブラベル
    buttonsSvg += `<text x="${cx}" y="${cy + 130}" text-anchor="middle" font-family="'Hiragino Sans', 'Noto Sans JP', sans-serif" font-size="42" fill="#888888">${btn.sublabel}</text>`;
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
  const result = (await lineApi('GET', '/richmenu/list')) as { richmenus: { richMenuId: string }[] };
  for (const rm of result.richmenus ?? []) {
    await lineApi('DELETE', `/richmenu/${rm.richMenuId}`);
    console.log(`リッチメニュー ${rm.richMenuId} を削除`);
  }
}

/** リッチメニューを作成 */
async function createRichMenu(): Promise<string> {
  const result = (await lineApi('POST', '/richmenu', {
    size: { width: WIDTH, height: HEIGHT },
    selected: true,
    name: 'Darts Lab メインメニュー',
    chatBarText: 'メニュー',
    areas: [
      {
        bounds: { x: 0, y: 0, width: COL_W, height: HEIGHT },
        action: { type: 'message', text: '取得' },
      },
      {
        bounds: { x: COL_W, y: 0, width: COL_W, height: HEIGHT },
        action: { type: 'message', text: 'メモ' },
      },
      {
        bounds: { x: COL_W * 2, y: 0, width: COL_W, height: HEIGHT },
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
  console.log('=== LINE リッチメニュー セットアップ ===\n');

  // 1. 画像生成
  console.log('1. リッチメニュー画像を生成中...');
  const image = await generateMenuImage();
  console.log(`   画像サイズ: ${(image.length / 1024).toFixed(0)} KB`);

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
  console.log('LINEアプリでボットとのチャットを開くと表示されます。');
}

main().catch((err) => {
  console.error('エラー:', err);
  process.exit(1);
});

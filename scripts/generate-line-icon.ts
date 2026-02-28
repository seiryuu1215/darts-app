/**
 * LINE ボットアイコン画像生成スクリプト
 *
 * 使い方:
 *   tsx scripts/generate-line-icon.ts
 *
 * 出力:
 *   public/line-bot-icon.png (640x640)
 *
 * ※ アイコンの設定は LINE Official Account Manager から手動で行う必要があります
 *    https://manager.line.biz/ → 設定 → アカウント設定 → プロフィール画像
 */

import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SIZE = 640;

/**
 * app/icon.svg をベースにLINEボット用アイコンを生成
 * 円形表示されるため、重要な要素は中央に配置
 */
async function generate() {
  // 既存のアプリアイコンSVGを読み込み
  const iconSvg = readFileSync(resolve(ROOT, 'app/icon.svg'), 'utf-8');

  // SVGをPNGに変換 (640x640)
  const iconPng = await sharp(Buffer.from(iconSvg))
    .resize(SIZE, SIZE, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();

  // 「Darts Lab」テキストを下部に追加するオーバーレイ
  const overlaySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
    <!-- 下部にグラデーション背景 -->
    <defs>
      <linearGradient id="textBg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="transparent"/>
        <stop offset="30%" stop-color="rgba(0,0,0,0.6)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.85)"/>
      </linearGradient>
    </defs>
    <rect x="0" y="${SIZE - 180}" width="${SIZE}" height="180" fill="url(#textBg)"/>
    <text x="${SIZE / 2}" y="${SIZE - 60}" text-anchor="middle"
      font-family="'Helvetica Neue', 'Arial', sans-serif"
      font-size="72" font-weight="bold" fill="#ffffff" letter-spacing="4">
      Darts Lab
    </text>
  </svg>`;

  const overlayBuf = await sharp(Buffer.from(overlaySvg))
    .resize(SIZE, SIZE)
    .png()
    .toBuffer();

  // 合成
  const result = await sharp(iconPng)
    .composite([{ input: overlayBuf, gravity: 'center' }])
    .png()
    .toBuffer();

  const outPath = resolve(ROOT, 'public', 'line-bot-icon.png');
  await sharp(result).toFile(outPath);

  console.log(`LINE ボットアイコンを生成しました: ${outPath}`);
  console.log(`サイズ: ${SIZE}x${SIZE}px (${(result.length / 1024).toFixed(0)} KB)`);
  console.log('');
  console.log('=== 次のステップ ===');
  console.log('1. https://manager.line.biz/ にアクセス');
  console.log('2. アカウントを選択');
  console.log('3. 設定 → アカウント設定 → プロフィール画像を編集');
  console.log(`4. ${outPath} をアップロード`);
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});

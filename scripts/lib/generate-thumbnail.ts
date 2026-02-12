/**
 * サムネイル生成ユーティリティ
 * SVG → PNG 変換で OGP風サムネイルを生成
 */
import sharp from 'sharp';

interface ThumbnailOptions {
  title: string;
  tags?: string[];
  gradient?: [string, string];
  width?: number;
  height?: number;
}

const GRADIENTS: [string, string][] = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#a18cd1', '#fbc2eb'],
  ['#fccb90', '#d57eeb'],
  ['#e0c3fc', '#8ec5fc'],
  ['#c471f5', '#fa71cd'],
  ['#48c6ef', '#6f86d6'],
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * タイトルを指定幅で折り返す（日本語対応）
 * 1行あたり約16文字で折り返し
 */
function wrapTitle(title: string, maxCharsPerLine = 16): string[] {
  const lines: string[] = [];
  let current = '';
  for (const char of title) {
    current += char;
    if (current.length >= maxCharsPerLine) {
      lines.push(current);
      current = '';
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3); // 最大3行
}

export function generateThumbnailSvg(options: ThumbnailOptions): string {
  const { title, tags = [], width = 800, height = 420 } = options;
  const gradient = options.gradient || GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];

  const lines = wrapTitle(title);
  const fontSize = lines.some((l) => l.length > 14) ? 36 : 40;
  const lineHeight = fontSize * 1.4;
  const textBlockHeight = lines.length * lineHeight;
  const textStartY = (height - textBlockHeight) / 2 + fontSize * 0.35;

  const titleLines = lines
    .map(
      (line, i) =>
        `<text x="${width / 2}" y="${textStartY + i * lineHeight}" text-anchor="middle" font-family="'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP','Yu Gothic',sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" filter="url(#shadow)">${escapeXml(line)}</text>`,
    )
    .join('\n    ');

  const tagChips = tags
    .slice(0, 3)
    .map((tag, i) => {
      const tagWidth = tag.length * 16 + 24;
      const totalWidth = tags.slice(0, 3).reduce((sum, t) => sum + t.length * 16 + 24 + 8, -8);
      const startX = (width - totalWidth) / 2;
      const x = startX + tags.slice(0, i).reduce((sum, t) => sum + t.length * 16 + 24 + 8, 0);
      return `
    <rect x="${x}" y="${height - 60}" width="${tagWidth}" height="28" rx="14" fill="rgba(255,255,255,0.25)"/>
    <text x="${x + tagWidth / 2}" y="${height - 42}" text-anchor="middle" font-family="'Hiragino Sans',sans-serif" font-size="13" fill="white">${escapeXml(tag)}</text>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${gradient[0]}"/>
      <stop offset="100%" style="stop-color:${gradient[1]}"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="rgba(0,0,0,0.3)"/>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect x="0" y="0" width="${width}" height="${height}" fill="rgba(0,0,0,0.15)"/>
  <!-- decorative circles -->
  <circle cx="${width - 80}" cy="80" r="120" fill="rgba(255,255,255,0.06)"/>
  <circle cx="100" cy="${height - 60}" r="80" fill="rgba(255,255,255,0.06)"/>
  <!-- logo -->
  <text x="32" y="40" font-family="'Hiragino Sans',sans-serif" font-size="16" font-weight="bold" fill="rgba(255,255,255,0.7)">Darts Lab</text>
  <!-- title -->
  ${titleLines}
  <!-- tags -->
  ${tagChips}
</svg>`;
}

export async function generateThumbnailPng(options: ThumbnailOptions): Promise<Buffer> {
  const svg = generateThumbnailSvg(options);
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * 画像生成用フォント読み込み共通モジュール
 * Noto Sans JP (Regular/Bold) を Google Fonts から取得しキャッシュする
 */

let fontCache: { regular: ArrayBuffer; bold: ArrayBuffer } | null = null;

export async function loadNotoSansJPFonts(): Promise<{ regular: ArrayBuffer; bold: ArrayBuffer }> {
  if (fontCache) return fontCache;

  const [regular, bold] = await Promise.all([
    fetch(
      'https://fonts.gstatic.com/s/notosansjp/v56/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEj75s.ttf',
    ).then((res) => res.arrayBuffer()),
    fetch(
      'https://fonts.gstatic.com/s/notosansjp/v56/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFPYk75s.ttf',
    ).then((res) => res.arrayBuffer()),
  ]);

  fontCache = { regular, bold };
  return fontCache;
}

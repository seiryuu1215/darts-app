/**
 * 既存記事のサムネイルを生成・設定するスクリプト
 * 使い方: npx tsx scripts/fix-thumbnails.ts
 */

import 'dotenv/config';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { config } from 'dotenv';
import { generateThumbnailPng } from './lib/generate-thumbnail';

config({ path: '.env.local' });

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
if (!projectId || !storageBucket) {
  console.error('環境変数が不足しています');
  process.exit(1);
}

let app;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  app = initializeApp({
    credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
    storageBucket,
  });
} else {
  app = initializeApp({ projectId, storageBucket });
}

const db = getFirestore(app);
const bucket = getStorage(app).bucket();

// 記事ごとに色を固定（順番にグラデーションを割り当て）
const GRADIENTS: [string, string][] = [
  ['#667eea', '#764ba2'], // 紫
  ['#f093fb', '#f5576c'], // ピンク
  ['#4facfe', '#00f2fe'], // 青
  ['#43e97b', '#38f9d7'], // 緑
];

async function fixThumbnails() {
  const snapshot = await db.collection('articles').orderBy('createdAt', 'asc').get();
  console.log(`${snapshot.size}件の記事を処理します\n`);

  let i = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const gradient = GRADIENTS[i % GRADIENTS.length];

    console.log(`[${i + 1}/${snapshot.size}] ${data.title}`);

    // サムネ生成
    const pngBuffer = await generateThumbnailPng({
      title: data.title,
      tags: data.tags || [],
      gradient,
    });

    // Firebase Storage にアップロード
    const filePath = `images/articles/${doc.id}/cover.png`;
    const file = bucket.file(filePath);
    await file.save(pngBuffer, {
      metadata: { contentType: 'image/png' },
    });
    await file.makePublic();
    const coverImageUrl = `https://storage.googleapis.com/${storageBucket}/${filePath}`;

    // スラッグを連番に更新
    const newSlug = `article-${String(i + 1).padStart(3, '0')}`;

    await doc.ref.update({ coverImageUrl, slug: newSlug });
    console.log(`  ✓ サムネ設定完了`);
    console.log(`  ✓ スラッグ: ${data.slug} → ${newSlug}`);
    console.log(`  → /articles/${newSlug}\n`);

    i++;
  }

  console.log('完了！');
}

fixThumbnails().catch((err) => {
  console.error('エラー:', err);
  process.exit(1);
});

/**
 * 記事自動投稿スクリプト（AIエージェント連携用）
 *
 * 使い方:
 *   npx tsx scripts/post-article.ts --title "記事タイトル" --tags "タグ1,タグ2" --content "マークダウン本文"
 *   npx tsx scripts/post-article.ts --title "記事タイトル" --tags "タグ1" --file ./article.md
 *   npx tsx scripts/post-article.ts --title "記事タイトル" --draft    # 下書きとして保存
 *   echo "本文" | npx tsx scripts/post-article.ts --title "タイトル"  # stdin から本文を読む
 *
 * オプション:
 *   --title    記事タイトル（必須）
 *   --tags     カンマ区切りのタグ（省略可）
 *   --content  マークダウン本文（--file / stdin と排他）
 *   --file     本文を読み込むマークダウンファイルのパス
 *   --draft    下書きとして保存（省略時は公開）
 *   --gradient "色1,色2"  サムネのグラデーション色（省略時はランダム）
 *
 * 出力（JSON）:
 *   { "id": "xxx", "slug": "article-005", "url": "/articles/article-005", "coverImageUrl": "https://..." }
 */

import 'dotenv/config';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { generateThumbnailPng } from './lib/generate-thumbnail';

config({ path: '.env.local' });

// ---------- Firebase初期化 ----------

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
if (!projectId || !storageBucket) {
  console.error(JSON.stringify({ error: '環境変数が不足: NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET' }));
  process.exit(1);
}

let app;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  app = initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS), storageBucket });
} else {
  app = initializeApp({ projectId, storageBucket });
}

const db = getFirestore(app);
const bucket = getStorage(app).bucket();

// ---------- 引数パース ----------

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};
  const flags: Set<string> = new Set();

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        parsed[key] = args[i + 1];
        i++;
      } else {
        flags.add(key);
      }
    }
  }

  return { parsed, flags };
}

// ---------- stdin読み取り ----------

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return '';
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

// ---------- 次の連番スラッグを取得 ----------

async function getNextSlug(): Promise<string> {
  const snapshot = await db.collection('articles').get();
  let maxNum = 0;
  snapshot.docs.forEach((doc) => {
    const slug = doc.data().slug as string;
    const match = slug?.match(/^article-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  return `article-${String(maxNum + 1).padStart(3, '0')}`;
}

// ---------- メイン ----------

async function main() {
  const { parsed, flags } = parseArgs();

  // タイトル
  const title = parsed['title'];
  if (!title) {
    console.error(JSON.stringify({ error: '--title は必須です' }));
    process.exit(1);
  }

  // タグ
  const tags = parsed['tags']
    ? parsed['tags'].split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  // 本文
  let content = '';
  if (parsed['content']) {
    content = parsed['content'];
  } else if (parsed['file']) {
    content = readFileSync(parsed['file'], 'utf-8');
  } else {
    content = await readStdin();
  }

  if (!content.trim()) {
    console.error(JSON.stringify({ error: '本文が空です。--content / --file / stdin のいずれかで指定してください' }));
    process.exit(1);
  }

  const isDraft = flags.has('draft');

  // グラデーション
  let gradient: [string, string] | undefined;
  if (parsed['gradient']) {
    const parts = parsed['gradient'].split(',');
    if (parts.length === 2) gradient = [parts[0].trim(), parts[1].trim()];
  }

  // 管理者ユーザー取得
  const ADMIN_EMAIL = 'mt.oikawa@gmail.com';
  const userSnapshot = await db.collection('users').where('email', '==', ADMIN_EMAIL).get();
  let userId = '';
  let userName = '';
  if (!userSnapshot.empty) {
    userId = userSnapshot.docs[0].id;
    userName = userSnapshot.docs[0].data().displayName || '';
  }

  // 連番スラッグ
  const slug = await getNextSlug();

  // Firestore ドキュメント作成
  const docRef = db.collection('articles').doc();
  const articleId = docRef.id;

  // サムネイル生成 & アップロード
  const pngBuffer = await generateThumbnailPng({ title, tags, gradient });
  const filePath = `images/articles/${articleId}/cover.png`;
  const file = bucket.file(filePath);
  await file.save(pngBuffer, { metadata: { contentType: 'image/png' } });
  await file.makePublic();
  const coverImageUrl = `https://storage.googleapis.com/${storageBucket}/${filePath}`;

  // Firestore 保存
  await docRef.set({
    slug,
    title,
    content,
    coverImageUrl,
    tags,
    isDraft,
    userId,
    userName,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // 結果をJSON出力（パイプ連携しやすいように）
  const result = {
    id: articleId,
    slug,
    url: `/articles/${slug}`,
    coverImageUrl,
    isDraft,
    title,
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});

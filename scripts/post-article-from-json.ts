/**
 * AIエージェントのJSON出力を受け取って記事を投稿
 *
 * 使い方:
 *   cat output.json | npx tsx scripts/post-article-from-json.ts
 *   npx tsx scripts/post-article-from-json.ts --file output.json
 *   npx tsx scripts/post-article-from-json.ts --file output.json --draft
 *
 * 入力JSON形式:
 *   {
 *     "title": "記事タイトル",
 *     "tags": ["タグ1", "タグ2"],
 *     "content": "マークダウン本文..."
 *   }
 */

import 'dotenv/config';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { generateThumbnailPng } from './lib/generate-thumbnail';

config({ path: '.env.local' });

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
if (!projectId || !storageBucket) {
  console.error(JSON.stringify({ error: '環境変数が不足' }));
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

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return '';
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf-8');
}

async function getNextSlug(): Promise<string> {
  const snapshot = await db.collection('articles').get();
  let maxNum = 0;
  snapshot.docs.forEach((doc) => {
    const match = (doc.data().slug as string)?.match(/^article-(\d+)$/);
    if (match) maxNum = Math.max(maxNum, parseInt(match[1], 10));
  });
  return `article-${String(maxNum + 1).padStart(3, '0')}`;
}

function extractJson(raw: string): { title: string; tags: string[]; content: string } {
  // コードブロックで囲まれている場合を考慮
  const codeBlockMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  const jsonStr = codeBlockMatch ? codeBlockMatch[1] : raw;

  const parsed = JSON.parse(jsonStr.trim());

  if (!parsed.title || !parsed.content) {
    throw new Error('JSON に title と content が必要です');
  }

  return {
    title: parsed.title,
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    content: parsed.content,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const isDraft = args.includes('--draft');
  const fileIdx = args.indexOf('--file');

  let rawInput = '';
  if (fileIdx !== -1 && args[fileIdx + 1]) {
    rawInput = readFileSync(args[fileIdx + 1], 'utf-8');
  } else {
    rawInput = await readStdin();
  }

  if (!rawInput.trim()) {
    console.error(JSON.stringify({ error: '入力が空です。stdin か --file でJSONを渡してください' }));
    process.exit(1);
  }

  const { title, tags, content } = extractJson(rawInput);

  // 管理者ユーザー
  const userSnapshot = await db.collection('users').where('email', '==', 'mt.oikawa@gmail.com').get();
  let userId = '', userName = '';
  if (!userSnapshot.empty) {
    userId = userSnapshot.docs[0].id;
    userName = userSnapshot.docs[0].data().displayName || '';
  }

  const slug = await getNextSlug();
  const docRef = db.collection('articles').doc();
  const articleId = docRef.id;

  // サムネイル
  const pngBuffer = await generateThumbnailPng({ title, tags });
  const filePath = `images/articles/${articleId}/cover.png`;
  const file = bucket.file(filePath);
  await file.save(pngBuffer, { metadata: { contentType: 'image/png' } });
  await file.makePublic();
  const coverImageUrl = `https://storage.googleapis.com/${storageBucket}/${filePath}`;

  // Firestore
  await docRef.set({
    slug, title, content, coverImageUrl, tags, isDraft,
    userId, userName,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log(JSON.stringify({ id: articleId, slug, url: `/articles/${slug}`, coverImageUrl, isDraft, title }, null, 2));
}

main().catch((err) => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});

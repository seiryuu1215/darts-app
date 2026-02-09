/**
 * 記事削除スクリプト
 * 使い方: npx tsx scripts/delete-article.ts <article-id>
 */
import 'dotenv/config';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { config } from 'dotenv';
config({ path: '.env.local' });

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
let app;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  app = initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS), storageBucket });
} else {
  app = initializeApp({ projectId, storageBucket });
}
const db = getFirestore(app);
const bucket = getStorage(app).bucket();

async function main() {
  const id = process.argv[2];
  if (!id) { console.error('使い方: npx tsx scripts/delete-article.ts <article-id>'); process.exit(1); }
  await db.collection('articles').doc(id).delete();
  try { await bucket.file(`images/articles/${id}/cover.png`).delete(); } catch {}
  console.log(`削除完了: ${id}`);
}
main().catch(console.error);

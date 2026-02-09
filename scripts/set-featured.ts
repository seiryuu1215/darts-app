/**
 * 記事3本をおすすめに設定
 * 使い方: npx tsx scripts/set-featured.ts
 */
import 'dotenv/config';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
config({ path: '.env.local' });

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
let app;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  app = initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS) });
} else {
  app = initializeApp({ projectId });
}
const db = getFirestore(app);

// おすすめにしたいスラッグ
const FEATURED_SLUGS = ['article-002', 'article-003', 'article-004'];

async function main() {
  const snapshot = await db.collection('articles').get();
  for (const doc of snapshot.docs) {
    const slug = doc.data().slug;
    const isFeatured = FEATURED_SLUGS.includes(slug);
    await doc.ref.update({ isFeatured });
    console.log(`${slug}: isFeatured=${isFeatured} — ${doc.data().title}`);
  }
  console.log('\n完了！');
}
main().catch(console.error);

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

async function main() {
  const snapshot = await db.collection('darts').get();
  console.log(`darts: ${snapshot.size}件\n`);
  for (const doc of snapshot.docs) {
    const d = doc.data();
    const imgs = d.imageUrls?.length || 0;
    console.log(`  ${doc.id} | ${d.userName} | ${d.title} | imgs=${imgs} | draft=${d.isDraft}`);
  }

  // barrels コレクションから画像付きを数件確認
  const barrels = await db.collection('barrels').limit(5).get();
  console.log(`\nbarrels sample (${barrels.size}件):`);
  for (const doc of barrels.docs) {
    const b = doc.data();
    console.log(`  ${b.name} | ${b.brand} | img=${b.imageUrl ? 'あり' : 'なし'}`);
  }
}
main().catch(console.error);

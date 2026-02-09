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

async function check() {
  const snapshot = await db.collection('articles').get();
  console.log(`articles コレクション: ${snapshot.size}件`);
  snapshot.docs.forEach((doc) => {
    const d = doc.data();
    console.log(`  id=${doc.id}, slug=${d.slug}, isDraft=${d.isDraft}, title=${d.title}, createdAt=${d.createdAt?.toDate()}`);
  });
}

check().catch(console.error);

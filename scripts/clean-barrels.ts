import 'dotenv/config';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';

config({ path: '.env.local' });

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!projectId) throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID が未設定');

const app = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS) })
  : initializeApp({ projectId });

const db = getFirestore(app);

async function cleanBarrels() {
  const snapshot = await db.collection('barrels').get();
  let removed = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (!data.weight || !data.length || !data.maxDiameter || !data.imageUrl) {
      await doc.ref.delete();
      removed++;
    }
  }

  console.log(`削除完了: ${removed} 件`);
}

cleanBarrels().catch(console.error);

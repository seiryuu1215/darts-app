import { adminDb } from '../lib/firebase-admin';

async function main() {
  const usersSnap = await adminDb.collection('users').where('role', '==', 'admin').limit(1).get();
  if (usersSnap.empty) {
    console.log('No admin user found');
    return;
  }
  const userId = usersSnap.docs[0].id;
  console.log('Admin userId:', userId);

  // ユーザーのサブコレクションを列挙
  const collections = await adminDb.doc(`users/${userId}`).listCollections();
  console.log(
    'Subcollections:',
    collections.map((c) => c.id),
  );

  // dartsliveApiCache を確認
  for (const col of collections) {
    if (col.id.includes('dartslive') || col.id.includes('Dartslive')) {
      const docs = await col.listDocuments();
      console.log(
        `\n${col.id} docs:`,
        docs.map((d) => d.id),
      );
      for (const docRef of docs) {
        const snap = await docRef.get();
        if (snap.exists) {
          const data = snap.data() || {};
          const keys = Object.keys(data);
          console.log(`  ${docRef.id} keys:`, keys);

          // recentPlays があれば中身を確認
          if (data.recentPlays) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const plays: any[] = JSON.parse(data.recentPlays);
            console.log(`  recentPlays count: ${plays.length}`);

            const cuAll = plays.filter((p) => p.gameName === 'COUNT-UP' || p.gameId === 'COUNT-UP');
            console.log(`  COUNT-UP count: ${cuAll.length}`);

            const withLog = plays.filter((p) => p.playLog || p.sensorData);
            console.log(`  With playLog/sensorData: ${withLog.length}`);

            if (plays.length > 0) {
              console.log('\n  === First play (all fields) ===');
              console.log(JSON.stringify(plays[0], null, 2).substring(0, 2000));
            }
            if (withLog.length > 0) {
              console.log('\n  === First with playLog ===');
              console.log(JSON.stringify(withLog[0], null, 2).substring(0, 3000));
            }
          }

          // bundle があれば確認
          if (data.bundle) {
            const bundle = JSON.parse(data.bundle);
            console.log(`  bundle keys:`, Object.keys(bundle));
          }
        }
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

import { adminDb } from '../lib/firebase-admin';

async function main() {
  const usersSnap = await adminDb.collection('users').where('role', '==', 'admin').limit(1).get();
  if (usersSnap.empty) {
    console.log('No admin user found');
    return;
  }
  const userId = usersSnap.docs[0].id;
  console.log('Admin userId:', userId);

  // 全サブコレクションのドキュメントを確認
  const collections = await adminDb.doc(`users/${userId}`).listCollections();
  for (const col of collections) {
    const docs = await col.listDocuments();
    for (const docRef of docs) {
      const snap = await docRef.get();
      if (!snap.exists) continue;
      const data = snap.data() || {};

      // recentPlays を含むドキュメントを探す
      if (data.recentPlays) {
        console.log(`\n=== FOUND recentPlays in ${col.id}/${docRef.id} ===`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const plays: any[] =
          typeof data.recentPlays === 'string' ? JSON.parse(data.recentPlays) : data.recentPlays;
        console.log('Count:', plays.length);
        if (plays.length > 0) {
          console.log('Keys:', Object.keys(plays[0]));
          const cu = plays.filter((p) => p.gameName === 'COUNT-UP' || p.gameId === 'COUNT-UP');
          console.log('COUNT-UP count:', cu.length);
          const withLog = plays.filter((p) => p.playLog || p.sensorData);
          console.log('With playLog/sensorData:', withLog.length);
          if (cu.length > 0) {
            console.log('\nFirst COUNT-UP:');
            console.log(JSON.stringify(cu[0], null, 2).substring(0, 2000));
          }
          if (withLog.length > 0) {
            console.log('\nFirst with playLog:');
            console.log(JSON.stringify(withLog[0], null, 2).substring(0, 3000));
          }
        }
      }

      // bundle を含むドキュメントを探す
      if (data.bundle) {
        console.log(`\n=== FOUND bundle in ${col.id}/${docRef.id} ===`);
        const bundle = typeof data.bundle === 'string' ? JSON.parse(data.bundle) : data.bundle;
        console.log('Bundle keys:', Object.keys(bundle));
      }

      // lastSyncAt があれば表示
      if (data.lastSyncAt) {
        console.log(
          `\n${col.id}/${docRef.id} lastSyncAt:`,
          data.lastSyncAt?.toDate?.() ?? data.lastSyncAt,
        );
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

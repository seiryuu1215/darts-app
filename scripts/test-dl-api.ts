import { adminDb } from '../lib/firebase-admin';
import { decrypt } from '../lib/crypto';

async function main() {
  const usersSnap = await adminDb.collection('users').where('role', '==', 'admin').limit(1).get();
  if (usersSnap.empty) {
    console.log('No admin user found');
    return;
  }
  const userId = usersSnap.docs[0].id;
  const userData = usersSnap.docs[0].data();

  if (!userData.dlCredentialsEncrypted?.email || !userData.dlCredentialsEncrypted?.password) {
    console.log('No encrypted credentials found');
    return;
  }

  const email = decrypt(userData.dlCredentialsEncrypted.email);
  const password = decrypt(userData.dlCredentialsEncrypted.password);
  console.log('Credentials decrypted OK, email length:', email.length);

  const body = new URLSearchParams();
  body.append('ACTION_TYPE', 'WAPI-0016');
  body.append('MAIL', email);
  body.append('PASS', password);

  const res = await fetch('https://dlapp.dartslive.com/dataapi/action.jsp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Umineko',
      Authorization: 'Basic ZGFydHMtZGV2LWZ0cDpXTHNrNHF6NFh1eXo=',
    },
    body: body.toString(),
  });

  console.log('Status:', res.status);
  const text = await res.text();
  // JSONならパースして表示、HTMLならエラー抜粋
  try {
    const json = JSON.parse(text);
    console.log('Response (JSON):', JSON.stringify(json, null, 2).substring(0, 500));
  } catch {
    console.log('Response (HTML):', text.substring(0, 300));
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Script error:', e.message);
    process.exit(1);
  });

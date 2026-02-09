import { NextRequest, NextResponse } from 'next/server';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  const results: Record<string, unknown> = {
    step: 'start',
    firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    adminEmail: process.env.ADMIN_EMAIL ? 'set' : 'not set',
  };

  try {
    // Step 1: Firebase Auth
    results.step = 'firebase-auth';
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    results.uid = userCredential.user.uid;
    results.authEmail = userCredential.user.email;
    results.authSuccess = true;

    // Step 2: Firestore read
    results.step = 'firestore-read';
    const userDoc = await adminDb.doc(`users/${userCredential.user.uid}`).get();
    results.firestoreExists = userDoc.exists;
    results.firestoreRole = userDoc.exists ? userDoc.data()?.role : null;

    results.step = 'done';
    return NextResponse.json(results);
  } catch (error) {
    results.error = error instanceof Error ? error.message : String(error);
    results.errorCode = (error as { code?: string })?.code;
    return NextResponse.json(results, { status: 500 });
  }
}

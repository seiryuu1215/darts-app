import CredentialsProvider from 'next-auth/providers/credentials';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { adminDb } from '@/lib/firebase-admin';
import { UserRole, StripeSubscriptionStatus } from '@/types';
import type { NextAuthOptions } from 'next-auth';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );
          const user = userCredential.user;

          let role: UserRole = 'general';
          let subscriptionStatus: StripeSubscriptionStatus | null = null;
          const userDoc = await adminDb.doc(`users/${user.uid}`).get();
          if (userDoc.exists) {
            role = userDoc.data()?.role || 'general';
            subscriptionStatus = userDoc.data()?.subscriptionStatus || null;
          }

          // 管理者メールの場合、自動的にadmin権限を付与
          if (user.email === ADMIN_EMAIL && role !== 'admin') {
            role = 'admin';
            if (userDoc.exists) {
              await adminDb.doc(`users/${user.uid}`).update({ role: 'admin' });
            }
          }

          return {
            id: user.uid,
            name: user.displayName,
            email: user.email,
            role,
            subscriptionStatus,
          };
        } catch (error) {
          console.error('Auth error:', error instanceof Error ? error.message : error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as unknown as { role: UserRole }).role;
        token.subscriptionStatus = (user as unknown as { subscriptionStatus: StripeSubscriptionStatus | null }).subscriptionStatus;
      } else if (token.sub) {
        // セッション更新時にFirestoreから最新のroleを取得
        try {
          const userDoc = await adminDb.doc(`users/${token.sub}`).get();
          if (userDoc.exists) {
            token.role = userDoc.data()?.role || 'general';
            token.subscriptionStatus = userDoc.data()?.subscriptionStatus || null;
          }
          // ADMIN_EMAIL チェック
          if (token.email === ADMIN_EMAIL && token.role !== 'admin') {
            token.role = 'admin';
          }
        } catch {
          // Firestore読み取りエラー時は既存のroleを維持
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = (token.role as UserRole) || 'general';
        session.user.subscriptionStatus = (token.subscriptionStatus as StripeSubscriptionStatus | null) || null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};

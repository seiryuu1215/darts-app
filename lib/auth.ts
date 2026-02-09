import CredentialsProvider from 'next-auth/providers/credentials';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { adminDb } from '@/lib/firebase-admin';
import { UserRole } from '@/types';
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
          const userDoc = await adminDb.doc(`users/${user.uid}`).get();
          if (userDoc.exists) {
            role = userDoc.data()?.role || 'general';
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
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = (token.role as UserRole) || 'general';
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};

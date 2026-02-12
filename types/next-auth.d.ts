import { DefaultSession } from 'next-auth';
import { UserRole, StripeSubscriptionStatus } from '@/types';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      subscriptionStatus: StripeSubscriptionStatus | null;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: UserRole;
    subscriptionStatus?: StripeSubscriptionStatus | null;
  }
}

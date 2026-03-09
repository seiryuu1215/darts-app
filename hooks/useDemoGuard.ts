'use client';

import { useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ToastProvider';

export function useDemoGuard() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const isDemo = session?.user?.isDemo === true;

  const guardedAction = useCallback(
    (action: () => void | Promise<void>) => {
      if (isDemo) {
        showToast('デモアカウントではこの操作はできません');
        return;
      }
      return action();
    },
    [isDemo, showToast],
  );

  return { isDemo, guardedAction };
}

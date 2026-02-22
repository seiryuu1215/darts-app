'use client';

import { useSession } from 'next-auth/react';
import type { UserRole } from '@/types';
import {
  isPro,
  isAdmin,
  canUseDartslive,
  canExportCsv,
  canCreateDiscussion,
  canViewDetailedAnalysis,
  canWriteArticles,
  canUsePushNotifications,
  canAutoImportShops,
  getSettingsLimit,
  getShopBookmarkLimit,
  getStatsRetentionDays,
} from '@/lib/permissions';

export interface PermissionState {
  role: UserRole | undefined;
  isPro: boolean;
  isAdmin: boolean;
  canUseDartslive: boolean;
  canExportCsv: boolean;
  canCreateDiscussion: boolean;
  canViewDetailedAnalysis: boolean;
  canWriteArticles: boolean;
  canUsePushNotifications: boolean;
  canAutoImportShops: boolean;
  settingsLimit: number | null;
  shopBookmarkLimit: number | null;
  statsRetentionDays: number | null;
}

export function usePermission(): PermissionState {
  const { data: session } = useSession();
  const role = session?.user?.role;

  return {
    role,
    isPro: isPro(role),
    isAdmin: isAdmin(role),
    canUseDartslive: canUseDartslive(role),
    canExportCsv: canExportCsv(role),
    canCreateDiscussion: canCreateDiscussion(role),
    canViewDetailedAnalysis: canViewDetailedAnalysis(role),
    canWriteArticles: canWriteArticles(role),
    canUsePushNotifications: canUsePushNotifications(role),
    canAutoImportShops: canAutoImportShops(role),
    settingsLimit: getSettingsLimit(role),
    shopBookmarkLimit: getShopBookmarkLimit(role),
    statsRetentionDays: getStatsRetentionDays(role),
  };
}

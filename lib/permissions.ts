import type { UserRole } from '@/types';

export const SETTINGS_LIMIT_GENERAL = 1;
export const SHOP_BOOKMARK_LIMIT_GENERAL = 5;

export function isPro(role: UserRole | undefined): boolean {
  return role === 'pro' || role === 'admin';
}

export function isAdmin(role: UserRole | undefined): boolean {
  return role === 'admin';
}

export function canWriteArticles(role: UserRole | undefined): boolean {
  return role === 'admin';
}

export function canEditArticle(
  role: UserRole | undefined,
  _articleUserId: string,
  _currentUserId: string,
): boolean {
  return role === 'admin';
}

export function canUseDartslive(role: UserRole | undefined): boolean {
  return role === 'pro' || role === 'admin';
}

export function getSettingsLimit(role: UserRole | undefined): number | null {
  if (role === 'pro' || role === 'admin') return null;
  return SETTINGS_LIMIT_GENERAL;
}

export function canViewDetailedAnalysis(role: UserRole | undefined): boolean {
  return role === 'pro' || role === 'admin';
}

export function getStatsRetentionDays(role: UserRole | undefined): number | null {
  if (role === 'pro' || role === 'admin') return null;
  return 30;
}

export function canExportCsv(role: UserRole | undefined): boolean {
  return role === 'pro' || role === 'admin';
}

export function canCreateDiscussion(role: UserRole | undefined): boolean {
  return role === 'pro' || role === 'admin';
}

export function canEditDiscussion(
  role: UserRole | undefined,
  authorId: string,
  currentId: string,
): boolean {
  if (role === 'admin') return true;
  if (role === 'pro') return authorId === currentId;
  return false;
}

export function canReplyDiscussion(role: UserRole | undefined): boolean {
  return role !== undefined;
}

export function canPinDiscussion(role: UserRole | undefined): boolean {
  return role === 'admin';
}

export function canLockDiscussion(role: UserRole | undefined): boolean {
  return role === 'admin';
}

export function getShopBookmarkLimit(role: UserRole | undefined): number | null {
  if (role === 'pro' || role === 'admin') return null;
  return SHOP_BOOKMARK_LIMIT_GENERAL;
}

export function canUsePushNotifications(role: UserRole | undefined): boolean {
  return role === 'pro' || role === 'admin';
}

export function canAutoImportShops(role: UserRole | undefined): boolean {
  return role === 'pro' || role === 'admin';
}

export function canUseDartsliveApi(role: UserRole | undefined): boolean {
  return role === 'admin';
}

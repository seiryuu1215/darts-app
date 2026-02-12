import type { UserRole } from '@/types';

export const SETTINGS_LIMIT_GENERAL = 3;

export function isPro(role: UserRole | undefined): boolean {
  return role === 'pro' || role === 'admin';
}

export function isAdmin(role: UserRole | undefined): boolean {
  return role === 'admin';
}

export function canWriteArticles(role: UserRole | undefined): boolean {
  return role === 'pro' || role === 'admin';
}

export function canEditArticle(
  role: UserRole | undefined,
  articleUserId: string,
  currentUserId: string
): boolean {
  if (role === 'admin') return true;
  if (role === 'pro') return articleUserId === currentUserId;
  return false;
}

export function canUseDartslive(role: UserRole | undefined): boolean {
  return role === 'pro' || role === 'admin';
}

export function getSettingsLimit(role: UserRole | undefined): number | null {
  if (role === 'pro' || role === 'admin') return null;
  return SETTINGS_LIMIT_GENERAL;
}

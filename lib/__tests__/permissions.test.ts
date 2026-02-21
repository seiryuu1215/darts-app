import { describe, it, expect } from 'vitest';
import {
  isPro,
  isAdmin,
  canExportCsv,
  canUseDartslive,
  canWriteArticles,
  canViewDetailedAnalysis,
  canUsePushNotifications,
  getSettingsLimit,
  getShopBookmarkLimit,
  getStatsRetentionDays,
  SETTINGS_LIMIT_GENERAL,
  SHOP_BOOKMARK_LIMIT_GENERAL,
} from '@/lib/permissions';

describe('isPro', () => {
  it('returns true for pro', () => {
    expect(isPro('pro')).toBe(true);
  });
  it('returns true for admin', () => {
    expect(isPro('admin')).toBe(true);
  });
  it('returns false for general', () => {
    expect(isPro('general')).toBe(false);
  });
  it('returns false for undefined', () => {
    expect(isPro(undefined)).toBe(false);
  });
});

describe('isAdmin', () => {
  it('returns true for admin', () => {
    expect(isAdmin('admin')).toBe(true);
  });
  it('returns false for pro', () => {
    expect(isAdmin('pro')).toBe(false);
  });
  it('returns false for general', () => {
    expect(isAdmin('general')).toBe(false);
  });
});

describe('canExportCsv', () => {
  it('returns true for pro', () => {
    expect(canExportCsv('pro')).toBe(true);
  });
  it('returns true for admin', () => {
    expect(canExportCsv('admin')).toBe(true);
  });
  it('returns false for general', () => {
    expect(canExportCsv('general')).toBe(false);
  });
});

describe('canUseDartslive', () => {
  it('returns true for pro', () => {
    expect(canUseDartslive('pro')).toBe(true);
  });
  it('returns false for general', () => {
    expect(canUseDartslive('general')).toBe(false);
  });
});

describe('canWriteArticles', () => {
  it('returns true for admin', () => {
    expect(canWriteArticles('admin')).toBe(true);
  });
  it('returns false for pro', () => {
    expect(canWriteArticles('pro')).toBe(false);
  });
  it('returns false for general', () => {
    expect(canWriteArticles('general')).toBe(false);
  });
});

describe('canViewDetailedAnalysis', () => {
  it('returns true for pro', () => {
    expect(canViewDetailedAnalysis('pro')).toBe(true);
  });
  it('returns false for general', () => {
    expect(canViewDetailedAnalysis('general')).toBe(false);
  });
});

describe('getSettingsLimit', () => {
  it('returns null for pro (unlimited)', () => {
    expect(getSettingsLimit('pro')).toBeNull();
  });
  it('returns null for admin (unlimited)', () => {
    expect(getSettingsLimit('admin')).toBeNull();
  });
  it('returns SETTINGS_LIMIT_GENERAL for general', () => {
    expect(getSettingsLimit('general')).toBe(SETTINGS_LIMIT_GENERAL);
  });
  it('returns SETTINGS_LIMIT_GENERAL for undefined', () => {
    expect(getSettingsLimit(undefined)).toBe(SETTINGS_LIMIT_GENERAL);
  });
});

describe('getStatsRetentionDays', () => {
  it('returns null for pro (unlimited)', () => {
    expect(getStatsRetentionDays('pro')).toBeNull();
  });
  it('returns 30 for general', () => {
    expect(getStatsRetentionDays('general')).toBe(30);
  });
});

describe('getShopBookmarkLimit', () => {
  it('returns null for pro (unlimited)', () => {
    expect(getShopBookmarkLimit('pro')).toBeNull();
  });
  it('returns null for admin (unlimited)', () => {
    expect(getShopBookmarkLimit('admin')).toBeNull();
  });
  it('returns SHOP_BOOKMARK_LIMIT_GENERAL for general', () => {
    expect(getShopBookmarkLimit('general')).toBe(SHOP_BOOKMARK_LIMIT_GENERAL);
  });
  it('returns SHOP_BOOKMARK_LIMIT_GENERAL for undefined', () => {
    expect(getShopBookmarkLimit(undefined)).toBe(SHOP_BOOKMARK_LIMIT_GENERAL);
  });
});

describe('canUsePushNotifications', () => {
  it('returns true for pro', () => {
    expect(canUsePushNotifications('pro')).toBe(true);
  });
  it('returns true for admin', () => {
    expect(canUsePushNotifications('admin')).toBe(true);
  });
  it('returns false for general', () => {
    expect(canUsePushNotifications('general')).toBe(false);
  });
  it('returns false for undefined', () => {
    expect(canUsePushNotifications(undefined)).toBe(false);
  });
});

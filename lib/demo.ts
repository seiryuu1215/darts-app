/**
 * デモアカウント定数・ブロックリスト
 */

export const DEMO_ACCOUNTS = {
  general: {
    uid: 'demo-general',
    email: 'demo-general@darts-lab.example',
    password: 'demo1234',
    role: 'general' as const,
  },
  pro: {
    uid: 'demo-pro',
    email: 'demo-pro@darts-lab.example',
    password: 'demo1234',
    role: 'pro' as const,
  },
  admin: {
    uid: 'demo-admin',
    email: 'demo-admin@darts-lab.example',
    password: 'demo1234',
    role: 'admin' as const,
  },
} as const;

export const DEMO_UIDS = new Set(Object.values(DEMO_ACCOUNTS).map((a) => a.uid));

/** 全デモアカウント共通ブロック対象 */
export const DEMO_BLOCKED_ROUTES = new Set([
  '/api/account/delete',
  '/api/stripe/checkout',
  '/api/stripe/portal',
  '/api/line/link',
  '/api/line/save-dl-credentials',
  '/api/line/save-px-credentials',
  '/api/upload',
  '/api/health/sync',
]);

/** admin デモ専用ブロック対象 */
export const DEMO_ADMIN_BLOCKED_ROUTES = new Set([
  '/api/admin/update-role',
  '/api/admin/update-pricing',
  '/api/admin/dartslive-sync',
  '/api/admin/phoenix-sync',
  '/api/admin/dartslive-history',
  '/api/admin/phoenix-stats',
  '/api/admin/line-test',
  '/api/admin/users',
  '/api/admin/delete-user',
  '/api/admin/articles',
  '/api/admin/barrel-scrape',
]);

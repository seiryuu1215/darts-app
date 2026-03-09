import { test, expect } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';

const publicPages = [
  { name: 'ホーム', path: '/' },
  { name: 'ログイン', path: '/login' },
  { name: '新規登録', path: '/register' },
  { name: '料金プラン', path: '/pricing' },
  { name: 'バレル検索', path: '/barrels' },
  { name: 'このサイトについて', path: '/about' },
];

test.describe('アクセシビリティ監査', () => {
  for (const pg of publicPages) {
    test(`${pg.name}ページに重大なa11y違反がないこと`, async ({ page }) => {
      await page.goto(pg.path);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .disableRules(['color-contrast']) // テーマ依存のため除外
        .analyze();

      const criticalViolations = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious',
      );

      expect(criticalViolations).toEqual([]);
    });
  }
});

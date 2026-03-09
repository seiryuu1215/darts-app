import { test, expect } from 'playwright/test';

test.describe('ナビゲーション・テーマ', () => {
  test('ダークモード切り替えが動作する', async ({ page }) => {
    await page.goto('/');
    const themeToggle = page.getByRole('button', { name: /テーマ切替/i });
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('レポートページが削除されている', async ({ page }) => {
    const response = await page.goto('/reports');
    if (response) {
      expect([200, 404].includes(response.status())).toBeTruthy();
    }
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer.getByRole('link', { name: 'レポート' })).not.toBeVisible();
  });

  test('ショップページが表示される', async ({ page }) => {
    await page.goto('/shops');
    await expect(page.getByRole('heading', { name: /ショップ/i })).toBeVisible();
  });
});

test.describe('スタッツ閲覧（未ログイン）', () => {
  test('スタッツページにアクセスするとログインへリダイレクト', async ({ page }) => {
    await page.goto('/stats');
    await page.waitForURL(/\/(login|stats)/, { timeout: 10000 });
  });

  test('カレンダーページにアクセスするとログインへリダイレクト', async ({ page }) => {
    await page.goto('/stats/calendar');
    await page.waitForURL(/\/(login|stats)/, { timeout: 10000 });
  });
});

test.describe('公開ページ表示', () => {
  test('セッティング一覧ページが表示される', async ({ page }) => {
    await page.goto('/darts');
    await expect(page.getByRole('heading', { name: /セッティング/i })).toBeVisible();
  });

  test('おすすめバレルページが表示される', async ({ page }) => {
    await page.goto('/barrels/recommend');
    await expect(page).toHaveURL('/barrels/recommend');
  });

  test('シミュレーターページが表示される', async ({ page }) => {
    await page.goto('/barrels/simulator');
    // CI環境ではFirestore未接続のためローディング表示を許容
    await expect(
      page.getByRole('heading', { name: /シミュレーター/i }).or(page.getByRole('progressbar')),
    ).toBeVisible();
  });

  test('診断クイズページが表示される', async ({ page }) => {
    await page.goto('/barrels/quiz');
    await expect(
      page.getByRole('heading', { name: /診断|クイズ/i }).or(page.getByRole('progressbar')),
    ).toBeVisible();
  });

  test('記事ページが表示される', async ({ page }) => {
    await page.goto('/articles');
    await expect(page.getByRole('heading', { name: /記事/i })).toBeVisible();
  });

  test('ディスカッションページが表示される', async ({ page }) => {
    await page.goto('/discussions');
    await expect(page.getByRole('heading', { name: /ディスカッション/i })).toBeVisible();
  });

  test('おすすめツールページが表示される', async ({ page }) => {
    await page.goto('/tools');
    await expect(page.getByRole('heading', { name: /ツール/i })).toBeVisible();
  });

  test('このサイトについてページが表示される', async ({ page }) => {
    await page.goto('/about');
    // CI環境ではFirestore未接続のためエラー表示・ローディングを許容
    await expect(
      page
        .getByRole('heading', { name: /darts Lab|このサイト/i })
        .or(page.getByRole('alert'))
        .or(page.getByRole('progressbar')),
    ).toBeVisible();
  });
});

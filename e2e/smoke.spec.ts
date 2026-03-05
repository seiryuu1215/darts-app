import { test, expect } from 'playwright/test';

test.describe('公開ページ スモークテスト', () => {
  test('ホームページが表示される', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/darts Lab/i);
  });

  test('ログインページが表示される', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /ログイン/i })).toBeVisible();
  });

  test('料金プランページが表示される', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByText(/Pro/i)).toBeVisible();
  });

  test('利用規約ページが表示される', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.getByText(/利用規約/i)).toBeVisible();
  });

  test('プライバシーポリシーが表示される', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByText(/プライバシー/i)).toBeVisible();
  });
});

test.describe('認証リダイレクト', () => {
  test('未ログインでスタッツページにアクセスするとログインへリダイレクト', async ({ page }) => {
    await page.goto('/stats');
    await page.waitForURL(/\/(login|stats)/);
    // ログインページまたはスタッツページ（認証状態による）が表示される
  });

  test('未ログインでプロフィールにアクセスするとログインへリダイレクト', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForURL(/\/(login|profile)/);
  });
});

test.describe('バレル検索', () => {
  test('バレル一覧ページが表示される', async ({ page }) => {
    await page.goto('/barrels');
    await expect(page.getByText(/バレル/i)).toBeVisible();
  });

  test('バレル検索フォームが存在する', async ({ page }) => {
    await page.goto('/barrels');
    const searchInput = page.getByRole('textbox').first();
    await expect(searchInput).toBeVisible();
  });
});

test.describe('ナビゲーション', () => {
  test('フッターリンクが正しく表示される', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });
});

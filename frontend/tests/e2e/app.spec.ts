import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://127.0.0.1:4173';

test.describe('图片翻译 SaaS - Demo smoke', () => {
  test('dashboard demo flow navigates to editor', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await expect(page.getByText('开始新任务')).toBeVisible();

    const demoBadge = page.getByTestId('project-demo-badge').first();
    await expect(demoBadge).toBeVisible();

    const firstCard = page.getByTestId('project-card').first();
    await firstCard.click();

    await expect(page).toHaveURL(/\/editor\//);
    await expect(page.getByRole('button', { name: '下载结果' })).toBeVisible();

    await page.getByRole('button', { name: '退出' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('history page renders demo badges', async ({ page }) => {
    await page.goto(`${BASE_URL}/history`);
    await expect(page.getByRole('heading', { name: '历史记录' })).toBeVisible();

    const badge = page.getByTestId('history-demo-badge').first();
    await expect(badge).toBeVisible();

    await page.getByRole('button', { name: '刷新' }).click();
    await expect(badge).toBeVisible();
  });
});

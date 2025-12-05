import { test, expect } from '@playwright/test';

const demoProject = {
  id: 'e2e-project-1',
  name: 'E2E Demo Project',
  status: 'completed',
  stage: 'done',
  sourceLang: '中文(简体)',
  targetLang: '英语',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  thumbnail: 'https://picsum.photos/id/175/300/300',
  isDemo: true,
};

const BASE_URL = process.env.E2E_BASE_URL || 'http://127.0.0.1:4173';

test.describe('核心 E2E 流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/translate', (route) => {
      const type = route.request().resourceType();
      if (!['fetch', 'xhr'].includes(type)) return route.continue();
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(demoProject),
      });
    });

    await page.route('**/api/translate/url', (route) => {
      const type = route.request().resourceType();
      if (!['fetch', 'xhr'].includes(type)) return route.continue();
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(demoProject),
      });
    });

    await page.route('**/api/projects*', (route) => {
      const type = route.request().resourceType();
      if (!['fetch', 'xhr'].includes(type)) return route.continue();
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [demoProject],
          total: 1,
          page: 1,
          pageSize: 10,
          pages: 1,
          totalPages: 1,
        }),
      });
    });

    await page.route('**/api/history*', (route) => {
      const type = route.request().resourceType();
      if (!['fetch', 'xhr'].includes(type)) return route.continue();
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              {
                id: 'hist-1',
                date: new Date().toISOString(),
                projectName: demoProject.name,
                action: '翻译 (中文 → 英语)',
                result: 'success',
                projectId: demoProject.id,
                isDemo: true,
              },
              {
                id: 'hist-2',
                date: new Date().toISOString(),
                projectName: '失败示例',
                action: '翻译 (中文 → 日语)',
                result: 'failed',
                resultMessage: '格式错误',
              },
            ],
            total: 2,
            page: 1,
            pageSize: 20,
            pages: 1,
            totalPages: 1,
          }),
        });
      }

      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 204 });
      }

      return route.continue();
    });
  });

  test('上传→翻译→编辑→保存', async ({ page }) => {
    const homeResponse = await page.goto(`${BASE_URL}/`);
    expect(homeResponse?.ok()).toBeTruthy();
    await expect(page.getByText('开始新任务')).toBeVisible({ timeout: 20000 });

    const urlInput = page.getByPlaceholder('粘贴图片链接 (例如: https://example.com/product.jpg)');
    await urlInput.fill('https://example.com/demo.jpg');
    await page.getByRole('button', { name: '导入链接' }).click();

    await page.waitForURL('**/editor/**');
    await expect(page.getByText('图片精修')).toBeVisible();

    const translationBox = page.locator('textarea').first();
    await expect(translationBox).toBeVisible();
    await translationBox.fill('限时抢购 50% OFF');

    await expect(translationBox).toHaveValue('限时抢购 50% OFF');

    await page.getByRole('button', { name: '下载结果' }).click();
    await expect(page.getByText('下载功能开发中...')).toBeVisible();
  });

  test('历史查看→删除', async ({ page }) => {
    const historyResponse = await page.goto(`${BASE_URL}/history`);
    expect(historyResponse?.ok()).toBeTruthy();

    const deleteButtons = page.getByTestId('history-delete-button');
    await expect(deleteButtons.first()).toBeVisible({ timeout: 20000 });
    const initialCount = await deleteButtons.count();

    await deleteButtons.first().click();

    await expect(page.getByText('记录已删除')).toBeVisible();
    await expect(deleteButtons).toHaveCount(initialCount - 1);
  });
});

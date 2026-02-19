import { test, expect } from '@playwright/test';

test.describe('Admin Workflow: Login, Create, Verify, Delete', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should allow staff to login, post an item with AI fill, and delete all items', async ({ page }) => {
    // 1. Auth (localhost auto-staff)
    const staffBtn = page.getByRole('button', { name: /STAFF/i }).first();
    await expect(staffBtn).toBeVisible();
    await staffBtn.click();
    await expect(page.getByText('Staff Mode Enabled')).toBeVisible();

    // 2. Mock AI
    await page.route('**/api/gemini/analyze', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  nameTag: 'Official Test Item',
                  category: 'School Hat',
                  description: 'A black test item.'
                })
              }]
            }
          }]
        })
      });
    });

    // 3. Create with AI Fill
    await page.getByRole('button', { name: "Post new item" }).click();
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'staff.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake')
    });

    // CLICK AI FILL
    const aiBtn = page.getByRole('button', { name: /AI Fill/i });
    await aiBtn.click();

    // Verify Fill
    await expect(page.locator('#name-input-0')).toHaveValue('Official Test Item', { timeout: 15000 });

    await page.getByRole('button', { name: /Post 1 Item/i }).click();

    // Wait for Persistence
    await expect(page.getByTestId('sync-indicator')).toBeHidden({ timeout: 20000 });

    // 4. Verify & Cleanup
    await expect(page.getByRole('heading', { name: /All items/i })).toBeVisible();

    const searchInput = page.getByPlaceholder(/Search items/i);
    await searchInput.fill('Official');
    await expect(page.locator('h3', { hasText: /Official Test Item/i }).first()).toBeVisible({ timeout: 10000 });

    await searchInput.fill('');
    page.once('dialog', async d => await d.accept());
    await page.getByRole('button', { name: 'Delete All' }).click();

    await expect(page.getByText('No items found.')).toBeVisible({ timeout: 15000 });
    console.log('[E2E] PASSED');
  });
});

import { test, expect } from '@playwright/test';

test.describe('Guest Workflow: Upload Item', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should allow guest to post an item without login', async ({ page }) => {
    // 1. Verify we are NOT in staff mode
    await expect(page.getByText('Staff Mode Enabled')).not.toBeVisible();

    // 2. Open Upload Modal
    const fabButton = page.getByRole('button', { name: "Post new item" });
    await expect(fabButton).toBeVisible();
    await fabButton.click();

    // 3. Upload Image
    const buffer = Buffer.from('fake-data');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'guest-item.png',
      mimeType: 'image/png',
      buffer: buffer
    });

    // 4. Fill in details manually
    // Use { exact: true } to avoid strict mode violation with previously indexed "RAG Item 1"
    await expect(page.getByText('Item 1', { exact: true })).toBeVisible();

    const nameInput = page.locator('#name-input-0');
    await nameInput.fill('Guest Lost Item');

    const categorySelect = page.locator('#category-select-0');
    await categorySelect.selectOption({ index: 1 });

    const descriptionInput = page.locator('#description-input-0');
    await descriptionInput.fill('Lost blue item');

    // 5. Submit
    const postButton = page.getByRole('button', { name: /Post 1 Item/i });
    await expect(postButton).toBeEnabled();
    await postButton.click();

    // Wait for Persistence
    await expect(page.getByTestId('sync-indicator')).toBeHidden({ timeout: 20000 });
    await expect(page.getByText('Posted to Mowbray Hub!')).toBeVisible();

    // 6. Verify Item Appears in Feed
    const searchInput = page.getByPlaceholder(/Search items/i);
    await searchInput.fill('Guest Lost Item');

    // Use h3 locator for better precision
    await expect(page.locator('h3', { hasText: 'Guest Lost Item' }).first()).toBeVisible({ timeout: 10000 });
  });
});

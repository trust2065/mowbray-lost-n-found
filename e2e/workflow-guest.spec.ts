import { test, expect } from '@playwright/test';

test.describe('Guest Workflow: Upload Item', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should allow guest to post an item without login', async ({ page }) => {
    // 1. Verify we are NOT in staff mode
    // The "Staff Mode Enabled" text should NOT be visible
    await expect(page.getByText('Staff Mode Enabled')).not.toBeVisible();

    // 2. Open Upload Modal
    const fabButton = page.getByRole('button', { name: "Post new item" });
    await expect(fabButton).toBeVisible();
    await fabButton.click();

    // 3. Upload Image
    // Create a dummy image buffer (1x1 red pixel PNG)
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

    // In UploadModal.tsx, locate the file input
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'guest-item.png',
      mimeType: 'image/png',
      buffer: buffer
    });

    // 4. Fill in details manually (Guests might use AI, but let's test manual entry)
    // Wait for item card to appear
    await expect(page.getByText('Item 1')).toBeVisible();

    const nameInput = page.locator('#name-input-0');
    await nameInput.fill('Guest Lost Item');

    const categorySelect = page.locator('#category-select-0');
    await categorySelect.selectOption({ label: 'Water Bottle' }); // Valid category from constants.ts

    const descriptionInput = page.locator('#description-input-0');
    await descriptionInput.fill('Lost blue jacket');

    const locationSelect = page.locator('#location-select-0');
    // We need to know a valid location. 'Playground' is common.
    // Let's check constants or just pick one by index if possible, or select 'Playground'
    // If 'Playground' doesn't exist, this will fail. I'll read constants.ts first or assume safe default.
    // I'll assume 'Playground' or 'Canteen' or check values.
    // Better to select by index to be safe.
    await locationSelect.selectOption({ index: 1 });

    // 5. Submit
    const postButton = page.getByRole('button', { name: /Post \d+ Item/i });
    await expect(postButton).toBeEnabled();
    await postButton.click();

    // 6. Verify Success
    await expect(page.getByText('Posted to Mowbray Hub!')).toBeVisible();

    // 7. Verify Item Appears in Feed
    // Guests see the feed too.
    const searchInput = page.getByPlaceholder(/Search/i);
    await searchInput.fill('Guest Lost Item');
    await expect(page.getByText('Guest Lost Item').first()).toBeVisible();
  });
});

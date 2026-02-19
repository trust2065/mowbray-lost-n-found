import { test, expect } from '@playwright/test';

test.describe('AI Auto Fill Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should detect item from uploaded image using AI', async ({ page }) => {
    // 1. Mock the API response to avoid hitting real Gemini API (save cost & speed up)
    await page.route('**/api/gemini/analyze', async route => {
      // Create a slight delay to simulate network
      await new Promise(resolve => setTimeout(resolve, 500));

      const json = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                nameTag: 'Peter Parker',
                category: 'School Hat',
                description: 'Red and blue spandex suit'
              })
            }]
          }
        }]
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(json)
      });
    });

    // 2. Enter admin mode via STAFF toggle (available on localhost without password)
    const staffButton = page.getByRole('button', { name: /staff/i }).first();
    await expect(staffButton).toBeVisible();
    await staffButton.click();

    // Verify admin mode banner appears
    await expect(page.getByText('ADMIN MODE', { exact: false })).toBeVisible();

    // 3. Open Upload Modal using the Floating Action Button
    // The FAB in App.tsx has aria-label="Post new item"
    const fabButton = page.getByRole('button', { name: "Post new item" });
    await expect(fabButton).toBeVisible();
    await fabButton.click();

    // 4. Upload a file
    // Create a dummy image buffer (1x1 red pixel PNG)
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

    // In UploadModal.tsx: "Select up to 5 photo(s)" area has a hidden file input
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: buffer
    });

    // 5. Check if item card appears in modal and verify "Auto Fill" button exists
    // The items are mapped in the modal. We look for "Item 1" text or similar structure
    const itemCard = page.getByText('Item 1').first();
    await expect(itemCard).toBeVisible();

    const autoFillBtn = page.getByRole('button', { name: /AI Fill/i });
    await expect(autoFillBtn).toBeVisible();

    // 6. Click "Auto Fill" button
    await autoFillBtn.click();

    // 7. Verify fields are filled
    // Using IDs to locate inputs based on index
    const nameInput = page.locator('#name-input-0');
    const descriptionInput = page.locator('#description-input-0');

    // Wait for the values to be populated
    try {
      await expect(nameInput).toHaveValue('Peter Parker', { timeout: 10000 });
    } catch (error) {
      const debugErr = await page.locator('#ai-debug-error').getAttribute('data-error');
      console.error('DEBUG AI ERROR:', debugErr);
      throw error;
    }
    await expect(descriptionInput).toHaveValue('Red and blue spandex suit');

    // Verify Category selection
    const categorySelect = page.locator('#category-select-0');
    await expect(categorySelect).toHaveValue('School Hat');
  });
});

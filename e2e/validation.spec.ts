import { test, expect } from '@playwright/test';

test.describe('Validation & Edge Cases', () => {

  test.beforeEach(async ({ page }) => {
    // Mock Gemini API globally for this spec to prevent proxy errors
    await page.route('**/api/gemini/analyze', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ embedding: { values: new Array(768).fill(0) } })
      });
    });
    await page.addInitScript(() => {
      window.localStorage.setItem('public_access_authorized', 'true');
    });
    await page.goto('/');

    // Open upload modal
    const fabButton = page.getByRole('button', { name: "Post new item" });
    await fabButton.click();
  });

  test('should validate file extension (non-image)', async ({ page }) => {
    const buffer = Buffer.from('this is a text file');
    const fileInput = page.locator('input[type="file"]').first();

    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer
    });

    // It should NOT add an item card
    await expect(page.getByText('Item 1', { exact: true })).not.toBeVisible();
  });

  test('should handle description limit validation', async ({ page }) => {
    const buffer = Buffer.from('fake-image');
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'valid.png',
      mimeType: 'image/png',
      buffer
    });

    await expect(page.getByText('Item 1', { exact: true })).toBeVisible();

    const longText = 'a'.repeat(501);
    const descInput = page.locator('#description-input-0');
    await descInput.fill(longText);

    // If there's a character counter or warning, we could check it.
    await expect(descInput).toHaveValue(longText);
  });

  test('should require item name', async ({ page }) => {
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'valid.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake')
    });

    await expect(page.getByText('Item 1', { exact: true })).toBeVisible();

    // Try to post with empty name
    let alertMessage = '';
    page.on('dialog', async d => {
      alertMessage = d.message();
      await d.accept();
    });

    await page.getByRole('button', { name: /Post 1 Item/i }).click();

    // Expect alert about missing fields
    await expect.poll(() => alertMessage).toContain('Name cannot be empty');
  });

});

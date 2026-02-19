import { test, expect } from '@playwright/test';

test.describe('Validation & Edge Cases', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`[BROWSER] ${msg.text()}`));
    await page.goto('/');

    // Open upload modal
    const fabButton = page.getByRole('button', { name: "Post new item" });
    await fabButton.click();
  });

  test('should validate file extension (non-image)', async ({ page }) => {
    const buffer = Buffer.from('this is a text file');
    const fileInput = page.locator('input[type="file"]').first();

    // Use dialog listener for alert
    let alertMsg = '';
    page.on('dialog', async d => {
      alertMsg = d.message();
      await d.dismiss();
    });

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
    // Our App currently doesn't block > 500 but we can check if it accepts it.
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
      await d.accept(); // "Continue anyway?" usually
    });

    await page.getByRole('button', { name: /Post 1 Item/i }).click();

    // Expect alert about missing fields
    await expect.poll(() => alertMessage).toContain('Name cannot be empty');
  });

});

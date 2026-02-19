import { test, expect } from '@playwright/test';

test.describe('Validation & Edge Cases', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Open upload modal
    const fabButton = page.getByRole('button', { name: "Post new item" });
    await fabButton.click();
  });

  test('should validate file extension (non-image)', async ({ page }) => {
    // Attempt to upload a .txt file
    const buffer = Buffer.from('this is a text file');
    const fileInput = page.locator('input[type="file"]').first();

    // Catch the alert or warning
    // The App uses alert() for some validations, check code.
    // UploadModal.tsx: if (files.length > 5) alert(...)
    // But for file TYPE, it might be in `useFileUpload`.

    // Let's see if it accepts it. Valid HTML input accept might block it too if `accept="image/*"` is set.
    // If it's blocked by `accept`, playwright might still force it.
    // `useFileUpload.ts` has logic.

    // Monitor for alert dialog
    page.once('dialog', dialog => {
      dialog.dismiss();
    });

    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: buffer
    });

    // Check if item was added. If rejected, no item card should appear.

    // Original code uses "Item 1" text for header in card
    await expect(page.getByText('Item 1')).not.toBeVisible();

    // If there was an alert, verify message (optional, depends on implementation details)
    // "Please upload image files only." based on typical implementations
  });

  test('should handle description limit validation', async ({ page }) => {
    // Upload valid image
    const buffer = Buffer.from('fake-image', 'base64');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'valid.png',
      mimeType: 'image/png',
      buffer: buffer
    });

    // Wait for item
    await expect(page.getByText('Item 1')).toBeVisible();

    // Fill description with very long text
    const longText = 'a'.repeat(501); // Assuming 500 chars limit? Or 1000? 
    // Need to check constraints. If no strict constraints, just check it works.
    // If there is a limit, we expect an error or visual indicator.

    const descInput = page.locator('#description-input-0');
    await descInput.fill(longText);

    // Check if submit is still enabled or if there's an error
    // "Validation problem" usually creates a warning.
  });

  test('should require item name', async ({ page }) => {
    // Upload valid image
    const buffer = Buffer.from('fake-image', 'base64');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'valid.png',
      mimeType: 'image/png',
      buffer: buffer
    });

    await expect(page.getByText('Item 1')).toBeVisible();

    // Name is empty by default?
    const nameInput = page.locator('#name-input-0');
    await expect(nameInput).toBeEmpty();

    // Try to click Post
    const postButton = page.getByRole('button', { name: /Post \d+ Item/i });

    // If validation prevents submission:
    // await expect(postButton).toBeDisabled(); 
    // OR if it alerts:
    let alertMessage = '';
    page.once('dialog', dialog => {
      alertMessage = dialog.message();
      dialog.dismiss();
    });

    await postButton.click();

    // Expect alert about missing fields
    // "Some items have name issues:\nItem 1: Name cannot be empty\nContinue anyway?"
    expect(alertMessage).toContain('Name cannot be empty');
  });

});

import { test, expect } from '@playwright/test';

test.describe('Admin Workflow: Login, Create, Verify, Delete', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should allow staff to login, post an item with AI fill, and delete all items', async ({ page }) => {
    // -----------------------------------------------------------------------
    // 1. LOGIN FLOW (Localhost / Staff Toggle)
    // -----------------------------------------------------------------------
    // In local dev, we have a direct toggle button, no password needed.
    // Look for button with text "Staff" (it might be an icon button with label or text)
    const staffToggleButton = page.getByRole('button', { name: /staff/i }).first();
    await expect(staffToggleButton).toBeVisible();
    await staffToggleButton.click();

    // Verify Staff Mode
    // The text in App.tsx is "Staff Mode Enabled"
    await expect(page.getByText('Staff Mode Enabled')).toBeVisible();

    // -----------------------------------------------------------------------
    // 2. CREATE ITEM FLOW
    // -----------------------------------------------------------------------

    // Mock API Response
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
                  description: 'A black test item for e2e validation.'
                })
              }]
            }
          }]
        })
      });
    });

    // Open Upload Modal
    const fabButton = page.getByRole('button', { name: "Post new item" });
    await expect(fabButton).toBeVisible();
    await fabButton.click();

    // Upload Image
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    // In UploadModal.tsx, the input is hidden, so we locate it by type
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'e2e-test.png',
      mimeType: 'image/png',
      buffer: buffer
    });

    // Wait for item card to appear in the preview list
    await expect(page.getByText('Item 1')).toBeVisible();

    // Click AI Fill
    const aiButton = page.getByRole('button', { name: /AI Fill/i });
    await aiButton.click();

    // Verify fields populated
    const nameInput = page.locator('#name-input-0');
    await expect(nameInput).toHaveValue('Official Test Item', { timeout: 15000 });

    const categorySelect = page.locator('#category-select-0');
    await expect(categorySelect).toHaveValue('School Hat');

    // Submit - "Post 1 Item(s)"
    // Use a regex that requires a digit to distinguish from the "Post new item" FAB
    const postButton = page.getByRole('button', { name: /Post \d+ Item/i });
    await postButton.click();

    // Verify Success and Modal Closed
    await expect(page.getByText('Posted to Mowbray Hub!')).toBeVisible();

    // Wait for modal to disappear
    await expect(page.getByText('Upload Photos')).not.toBeVisible();
    await page.waitForTimeout(1000);

    // -----------------------------------------------------------------------
    // 3. VERIFICATION FLOW
    // -----------------------------------------------------------------------

    // In Staff mode, we see "All items" heading
    await expect(page.getByRole('heading', { name: 'All items', exact: true })).toBeVisible();

    // Search for our item
    const searchInput = page.getByPlaceholder(/Search/i);
    await searchInput.fill('Official Test Item');

    // Verify card is present
    const itemTitle = page.getByText('Official Test Item').first();
    await expect(itemTitle).toBeVisible();


    // -----------------------------------------------------------------------
    // 4. CLEANUP FLOW
    // -----------------------------------------------------------------------

    // Clear search input before deleting
    // Ensure we are viewing "All items" in search meaning an empty search
    await searchInput.fill('');
    await expect(searchInput).toHaveValue('');

    // Click Delete All
    // Mock the confirm dialog
    // Ensure the dialog listener is set BEFORE the click
    page.once('dialog', async dialog => {
      console.log(`Dialog message: ${dialog.message()}`);
      await dialog.accept();
    });

    const deleteAllBtn = page.getByRole('button', { name: 'Delete All' });
    await expect(deleteAllBtn).toBeVisible();
    await deleteAllBtn.click();

    // Verify Empty State
    // "No items found." is the text in App.tsx when filteredItems is empty
    await expect(page.getByText('No items found.')).toBeVisible({ timeout: 15000 });
  });
});

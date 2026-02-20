import { test, expect } from '@playwright/test';

test.describe('Mowbray Lost & Found Hub', () => {
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
    // Wait for initial load
    await expect(page.getByRole('heading', { name: /Mowbray Public/i })).toBeVisible();
  });

  test('should have correct title and header', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Lost & Found/i);

    // Check main heading
    const heading = page.getByRole('heading', { name: /Mowbray Public/i });
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Lost & Found Hub');
  });

  test('should allow toggling dark mode', async ({ page }) => {
    // Locate the dark mode toggle button
    const toggleButton = page.getByLabel('Toggle Dark Mode').filter({ visible: true });

    // Initial state: ensure light mode
    const html = page.locator('html');
    await expect(html).not.toHaveClass(/dark/);

    // Click to toggle dark mode
    await toggleButton.click();

    // Verify dark mode class is added
    await expect(html).toHaveClass(/dark/);

    // Click again to toggle back
    await toggleButton.click();
    await expect(html).not.toHaveClass(/dark/);
  });

  test('should allow searching for items', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search by name/i);
    await expect(searchInput).toBeVisible();

    // Type a search query
    await searchInput.fill('Test Search');

    // Verify the input has the value
    await expect(searchInput).toHaveValue('Test Search');
  });

  test('should filter by category', async ({ page }) => {
    // Find category buttons
    const allButton = page.getByRole('button', { name: 'All Items' });
    await expect(allButton).toBeVisible();

    const filterContainer = page.locator('.overflow-x-auto');
    await expect(filterContainer).toBeVisible();

    // Verify it is active
    await expect(allButton).toHaveClass(/bg-blue-600/);

    // Provide a mock item to test other categories
    await page.getByRole('button', { name: "Post new item" }).click();
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'cat.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake')
    });

    // Fill the required name
    const nameInput = page.locator('#name-input-0');
    await nameInput.fill('Cat Item');

    // Select category 'School Hat'
    const categorySelect = page.locator('#category-select-0');
    await categorySelect.selectOption('School Hat');

    // Fill description
    const descInput = page.locator('#description-input-0');
    await descInput.fill('A cat hat');

    // Submit
    const postButton = page.getByRole('button', { name: /Post 1 Item/i });
    await postButton.click();

    // Wait for the upload/indicator to finish
    await expect(page.getByTestId('sync-indicator')).toBeHidden({ timeout: 20000 });

    // Now 'School Hat' category should be available and active
    const buttons = filterContainer.getByRole('button');
    const schoolHatButton = page.getByRole('button', { name: 'School Hat' }).first();
    await expect(schoolHatButton).toBeVisible({ timeout: 15000 });

    // Click 'School Hat' category
    await schoolHatButton.click();

    // Verify it becomes active
    await expect(schoolHatButton).toHaveClass(/bg-blue-600/);
  });

  test('should show admin login modal on title double click', async ({ page }) => {
    // Use the specific test ID we just added
    const titleTrigger = page.getByTestId('admin-login-trigger');
    await expect(titleTrigger).toBeVisible({ timeout: 10000 });

    // Double click the title area. 
    await titleTrigger.dblclick({ force: true });

    // Expect the login modal to appear
    const loginModal = page.getByText('Staff Access');
    await expect(loginModal).toBeVisible({ timeout: 15000 });

    // Close the modal
    const closeButton = page.getByRole('button', { name: 'Cancel' });
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    await expect(loginModal).not.toBeVisible();
  });
});

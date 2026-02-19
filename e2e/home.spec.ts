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
    const searchInput = page.getByPlaceholder(/Search items/i);
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

    const buttons = filterContainer.getByRole('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(1);

    // Click a category button
    await buttons.nth(1).click();

    // Verify it becomes active
    await expect(buttons.nth(1)).toHaveClass(/bg-blue-600/);
  });

  test('should show admin login modal on title double click', async ({ page }) => {
    // Target the specific wrapper that has the dblclick listener
    const titleTrigger = page.locator('header .cursor-pointer').filter({ hasText: /Mowbray Public/i });
    await expect(titleTrigger).toBeVisible();

    // Double click the title area. 
    // Sometimes .dblclick() is flaky in CI, using click with count can be more robust.
    await titleTrigger.click({ clickCount: 2, delay: 100 });

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

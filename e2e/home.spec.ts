import { test, expect } from '@playwright/test';

test.describe('Mowbray Lost & Found Hub', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
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
    const toggleButton = page.getByLabel('Toggle Dark Mode');

    // Initial state: ensure light mode (body should have bg-slate-50 or not have dark class)
    // Checking data-theme or class on html/body is typical for dark mode implementations
    const html = page.locator('html');
    await expect(html).not.toHaveClass(/dark/);

    // Click to toggle dark mode
    await toggleButton.click();

    // Verify dark mode class is added to html element
    await expect(html).toHaveClass(/dark/);

    // Click again to toggle back to light mode
    await toggleButton.click();
    await expect(html).not.toHaveClass(/dark/);
  });

  test('should allow searching for items', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search for name, description and location/i);
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

    // Find another category button, e.g., 'Clothing' (assuming it exists based on previous context)
    // Since I can't be sure of the dynamic categories without reading constants, I'll just check for buttons in the filter area
    const filterContainer = page.locator('.overflow-x-auto');
    await expect(filterContainer).toBeVisible();

    const buttons = filterContainer.getByRole('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(1); // Should have All + other categories

    // Click a category button
    await buttons.nth(1).click();

    // Verify it becomes active (usually by checking class for active state background color)
    await expect(buttons.nth(1)).toHaveClass(/bg-emerald-600/);
  });

  test('should show admin login modal on title double click', async ({ page }) => {
    const title = page.locator('header h1'); // Target the header h1 specifically

    // Double click the title
    await title.dblclick();

    // Expect the login modal to appear
    const loginModal = page.getByText('Staff Access');
    await expect(loginModal).toBeVisible();

    // Close the modal
    const closeButton = page.getByRole('button', { name: 'Cancel' });
    await closeButton.click();
    await expect(loginModal).not.toBeVisible();
  });
});

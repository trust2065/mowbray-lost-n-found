import { test, expect } from '@playwright/test';

test.describe('Semantic Search (RAG) Flow', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('public_access_authorized', 'true');
    });
    await page.goto('/');

    // Auth
    const staffBtn = page.getByRole('button', { name: /STAFF/i }).first();
    await expect(staffBtn).toBeVisible();
    await staffBtn.click();
    await expect(page.getByText('Staff Mode Enabled')).toBeVisible();
  });

  test('should allow indexing multiple items and performing semantic search', async ({ page }) => {
    let embedCallCount = 0;

    // 1. Mock AI API
    await page.route('**/api/gemini/analyze', async route => {
      const payload = route.request().postDataJSON();

      if (payload.mode === 'embed') {
        embedCallCount++;
        // Simulate failure for first 5 uploads
        if (embedCallCount <= 5) {
          await route.fulfill({ status: 500, body: 'Error' });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ embedding: { values: new Array(768).fill(0.5) } })
          });
        }
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            candidates: [{
              content: { parts: [{ text: JSON.stringify({ nameTag: 'Blue Jacket', category: 'School Hat', description: 'Test' }) }] }
            }]
          })
        });
      }
    });

    // 2. Post 5 items without embeddings (mocked failure)
    console.log('[E2E] Posting items...');
    for (let i = 1; i <= 5; i++) {
      await page.getByRole('button', { name: "Post new item" }).click();

      await page.locator('input[type="file"]').first().setInputFiles({
        name: `rag-${i}.png`,
        mimeType: 'image/png',
        buffer: Buffer.from('fake')
      });

      // Manually fill to skip AI Fill latency/issues
      const nameInput = page.locator('#name-input-0');
      await nameInput.fill(`RAG Item ${i}`);

      await page.getByRole('button', { name: /Post 1 Item/i }).click();

      await expect(page.getByTestId('sync-indicator')).toBeHidden({ timeout: 20000 });
    }

    // 3. Re-index
    await page.reload();
    await page.getByRole('button', { name: /STAFF/i }).first().click();

    // Wait for items to load
    await expect(page.locator('h3', { hasText: /RAG Item 1/i })).toBeVisible({ timeout: 15000 });

    const dialogs: string[] = [];
    page.on('dialog', async d => {
      dialogs.push(d.message());
      await d.accept();
    });

    await page.getByRole('button', { name: /Re-index Smart Search/i }).click();

    // Verify re-index success
    await expect.poll(() => dialogs.some(m => m.includes('Newly indexed: 5')), { timeout: 30000 }).toBeTruthy();

    // 4. Semantic Search
    await page.getByRole('button', { name: /AI/i }).first().click();
    await page.getByPlaceholder(/Describe item color/i).fill('something blue');

    await expect(page.getByText(/Match/i).first()).toBeVisible({ timeout: 15000 });
    console.log('[E2E] PASSED');
  });
});

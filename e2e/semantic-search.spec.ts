import { test, expect } from '@playwright/test';

test.describe('Semantic Search (RAG) Flow', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Login as staff
    const staffToggleButton = page.getByRole('button', { name: /staff/i }).first();
    await staffToggleButton.click();
    await expect(page.getByText('Staff Mode Enabled')).toBeVisible();
  });

  test('should allow indexing multiple items and performing semantic search', async ({ page }) => {
    let embedCallCount = 0;

    // 1. Mock the Embedding API
    await page.route('**/api/gemini/analyze', async route => {
      const payload = route.request().postDataJSON();

      if (payload.mode === 'embed') {
        embedCallCount++;
        // We simulate failure for the first 5 "upload" calls to ensure they are saved without embeddings
        // In the upload flow, if generateEmbedding fails, it just skips the embedding and continues.
        if (embedCallCount <= 5) {
          console.log(`[E2E] Mocking EMBED FAILURE #${embedCallCount} for upload`);
          await route.fulfill({ status: 500, body: 'Error' });
        } else {
          console.log(`[E2E] Mocking EMBED SUCCESS #${embedCallCount} for re-indexing or search`);
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              embedding: { values: new Array(768).fill(0.1) }
            })
          });
        }
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            candidates: [{
              content: { parts: [{ text: JSON.stringify({ nameTag: 'Blue Jacket', category: 'Clothing', description: 'Item', location: 'Gym' }) }] }
            }]
          })
        });
      }
    });

    // 2. Post 5 items
    console.log('[E2E] Posting 5 items...');
    for (let i = 1; i <= 5; i++) {
      const fabButton = page.getByRole('button', { name: /Post new item/i });
      await fabButton.click();

      const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles({
        name: `test-${i}.png`,
        mimeType: 'image/png',
        buffer: buffer
      });

      await page.locator('#name-input-0').fill(`Test Item ${i}`);
      await page.getByRole('button', { name: /Post \d+ Item/i }).click();
      await expect(page.getByText(/Posted to Mowbray Hub/i)).toBeVisible();
      // Wait for toast to disappear or just wait a bit
      await page.waitForTimeout(500);
    }

    // 3. Trigger Re-index
    console.log('[E2E] Waiting for 5 items in list...');
    await expect(page.locator('h3', { hasText: 'Test Item 1' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h3', { hasText: 'Test Item 5' })).toBeVisible({ timeout: 10000 });

    const reindexBtn = page.getByRole('button', { name: /Re-index Smart Search/i });
    const dialogs: string[] = [];
    page.on('dialog', async dialog => {
      dialogs.push(dialog.message());
      console.log(`[E2E] DIALOG: ${dialog.message()}`);
      await dialog.accept();
    });

    await reindexBtn.click();

    // We expect 2 dialogs: 1. Confirm, 2. Result alert "Newly indexed: 5"
    await expect.poll(() => dialogs.length, { timeout: 30000 }).toBeGreaterThanOrEqual(2);

    const resultMsg = dialogs.find(m => m.includes('Newly indexed: 5'));
    expect(resultMsg).toBeDefined();
    console.log('[E2E] Successfully verified indexing of 5 items!');

    // 4. Verification in Search
    const aiToggle = page.getByRole('button', { name: /AI/i });
    await aiToggle.click();
    await page.getByPlaceholder(/Describe what you lost/i).fill('blue jacket');

    await expect(page.getByText(/Match/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/100% Match/i).first()).toBeVisible();
    console.log('[E2E] Test PASSED.');
  });
});

# E2E Test Stability Skill (Firebase + AI Stack)

This skill provides mandatory guidelines for debugging and writing stable E2E tests for web applications using Firebase Emulators and AI (Gemini) proxies.

## 1. Environment & Execution
- **Always use Emulators**: Never run tests against production/dev Firebase if emulators are available.
- **Serial Execution**: If the app modifies global state (e.g., `Delete All`, global list), set `workers: 1` and `fullyParallel: false` in `playwright.config.ts`.
- **Cleanup**: Ensure tests either cleanup their own data or the runner restarts the emulator between runs.

## 2. Debugging Toolset
- **Console Mirroring**: Immediately add `page.on('console', msg => console.log(`[BROWSER] ${msg.text()}`))` to `beforeEach` when a test fails.
- **Firebase Logs**: Monitor `firestore-debug.log` if writes are failing without clear browser errors.
- **Network Interception**: Use `page.route` to mock AI API responses to avoid latency and costs.

## 3. Selector Best Practices
- **Avoid Ambiguity**: Use `{ exact: true }` for generic text labels (e.g., "Item 1") to avoid strict mode violations if the same text appears in list items.
- **Sync Indicators**: Use a global `data-testid="sync-indicator"` in the App. Wait for it to be hidden BEFORE verifying results.
- **Heading Hierarchy**: Locate list items using semantic tags: `page.locator('h3', { hasText: /Name/i })`.

## 4. Common Pitfalls
- **Firestore Undefined**: `addDoc` fails if any field is `javascript undefined`. Strip undefined keys before calling Firestore.
- **AI Latency**: AI-filled fields may take seconds. Use `await expect(locator).toHaveValue(..., { timeout: 10000 })`.
- **Debounce**: Wait for at least 500ms-1000ms after typing in search boxes before verifying results if the app uses debounced filtering.

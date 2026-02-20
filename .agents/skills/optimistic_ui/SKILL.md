---
name: optimistic_ui
description: Optimistic UI pattern for instant feedback with background persistence and sync indicators.
---

# Optimistic UI Skill

## Problem
Firestore writes take 500ms-2s. Users shouldn't stare at a spinner. Items should appear instantly in the list, with background persistence and a visual indicator showing sync status.

## Architecture

```
User clicks "Post" → Item appears in list immediately (fake ID) → Background Firestore write → Sync indicator disappears
```

## Rules

### 1. Optimistic ID Tracking

```typescript
// In the parent component
const optimisticIdsRef = useRef<Set<string>>(new Set());

// When creating optimistic items
const fakeId = `optimistic-${Date.now()}`;
optimisticIdsRef.current.add(fakeId);
setItems(prev => [optimisticItem, ...prev]);
```

Use `useRef<Set>` instead of `useState<Set>` to avoid unnecessary re-renders.

### 2. Sync Indicator

```tsx
// Show when there are pending optimistic items
{isSyncing && (
  <div data-testid="sync-indicator" className="fixed top-2 right-2 ...">
    Syncing...
  </div>
)}
```

**MUST** use `data-testid="sync-indicator"` for E2E test stability. Tests wait for this to be hidden before asserting results.

### 3. Deduplication on Subscription

When Firestore subscription fires, filter out items that match optimistic IDs:

```typescript
subscribeToItems((firestoreItems) => {
  setItems(prev => {
    // Keep optimistic items that haven't been confirmed yet
    const optimisticItems = prev.filter(item => optimisticIdsRef.current.has(item.id));
    // Merge: Firestore items + remaining optimistic items
    return [...firestoreItems, ...optimisticItems];
  });
});
```

### 4. Confirmation Flow

```typescript
const confirmUpload = async (pendingItems) => {
  setIsSyncing(true);

  // 1. Create optimistic items with fake IDs
  const optimisticItems = pendingItems.map(item => ({
    ...item,
    id: `optimistic-${Date.now()}`,
  }));
  optimisticIdsRef.current = new Set(optimisticItems.map(i => i.id));

  // 2. Close modal immediately — user sees items in list
  closeModal();
  showSuccessToast();

  // 3. Background: write to Firestore
  for (const item of optimisticItems) {
    try {
      const realId = await addItem(itemData);
      optimisticIdsRef.current.delete(item.id);
    } catch (error) {
      // TODO: rollback optimistic item
    }
  }

  optimisticIdsRef.current.clear();
  setIsSyncing(false);
};
```

### 5. Error Handling / Rollback
If Firestore write fails:
- Remove the optimistic item from the list
- Show an error toast
- Log the error for debugging

```typescript
catch (error) {
  setItems(prev => prev.filter(i => i.id !== optimisticItem.id));
  showErrorToast('Upload failed. Please try again.');
}
```

### 6. E2E Testing Pattern

```typescript
// Wait for optimistic item to appear
await expect(page.locator('h3', { hasText: 'Item Name' })).toBeVisible();

// Wait for sync to complete
await expect(page.getByTestId('sync-indicator')).toBeHidden({ timeout: 20000 });

// Now verify the item persisted (e.g., reload and check)
```

### 7. Common Pitfalls
- **Don't use `useState` for optimistic IDs** — causes re-render loops
- **Don't await Firestore before closing modal** — defeats the purpose
- **Always clear optimistic IDs** after all writes complete, even on partial failure
- **Firestore subscription may fire multiple times** during writes — dedup logic is essential

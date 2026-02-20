---
name: firebase_ci_safety
description: Prevents Firebase-related failures in CI environments (GitHub Actions) where .env files and secrets are missing.
---

# Firebase CI Safety Skill

## Problem
Firebase SDK requires valid config values at initialization. In CI environments (GitHub Actions), `.env` files don't exist and secrets may not be configured, causing:
- `FirebaseError: Document parent name "projects//databases/(default)/documents" lacks a project id`
- Silent feature breakage when env-dependent flags (e.g., `ADMIN_PASSCODE`) are empty strings

## Rules

### 1. Firebase Config Fallbacks (MANDATORY)
Every Firebase config field MUST have a non-empty fallback value:

```typescript
// src/firebase/config.ts
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'dummy-api-key',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'dummy-project',
  // ... all fields need fallbacks
};
```

**Why**: Firebase SDK initializes fine with empty strings, but any Firestore read/write will throw a cryptic error. The fallback values are only used when connecting to the emulator, so they're safe.

### 2. Feature Flags with Environment Awareness
Never use empty-string fallbacks for feature flags that control UI behavior:

```typescript
// BAD — admin login disabled in CI because '' is falsy
export const ADMIN_PASSCODE = getEnvVar('VITE_ADMIN_PASSCODE', '');

// GOOD — dev/CI gets a default, production requires the real secret
export const ADMIN_PASSCODE = getEnvVar('VITE_ADMIN_PASSCODE', import.meta.env.PROD ? '' : 'dev-passcode');
```

**Why**: `ADMIN_PASSCODE ? handler : undefined` — empty string = no handler = feature silently disappears.

### 3. Firestore Undefined Fields
`addDoc` throws if any field value is `undefined`. Always strip or default:

```typescript
// BAD
const data = { name: 'foo', embedding: undefined }; // throws

// GOOD — conditionally add
const data: SomeType = { name: 'foo' };
if (embedding) data.embedding = embedding;
```

### 4. Emulator Connection
```typescript
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}
```

### 5. CI Caching
Cache emulator JARs in GitHub Actions to avoid re-downloading every run:

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.cache/firebase/emulators
    key: firebase-emulators-${{ runner.os }}
```

### 6. E2E Test Environment
- Set `VITE_USE_FIREBASE_EMULATOR=true` in `playwright.config.ts` webServer env
- Run tests with: `firebase emulators:exec "npx playwright test"`
- Use `workers: 1` and `fullyParallel: false` to prevent emulator state conflicts

---
name: gemini_api_proxy
description: Standard patterns for proxying Gemini API calls through a serverless function to protect API keys.
---

# Gemini API Proxy Skill

## Problem
Gemini API keys must never be exposed in frontend code. A server-side proxy is needed to:
- Hide the API key from browser devtools
- Support both `generateContent` (vision) and `embedContent` (RAG) endpoints
- Work in local dev (Vite proxy) and production (Vercel serverless)

## Architecture

```
Browser → /api/gemini/analyze → Serverless Function → Google Gemini API
```

## Rules

### 1. Proxy Implementation (Vercel Serverless)

```javascript
// api/proxy.js
export default async function handler(req, res) {
  const { mode = 'generate', text, imageData, prompt, mimeType } = req.body;
  const API_KEY = process.env.VITE_GEMINI_API_KEY;

  if (mode === 'embed') {
    // POST to models/gemini-embedding-001:embedContent
    // Body: { model: "models/gemini-embedding-001", content: { parts: [{ text }] }, task_type }
  } else {
    // POST to models/gemini-1.5-flash-latest:generateContent
    // Body: { contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType, data: imageData } }] }] }
  }
}
```

### 2. Vite Dev Proxy

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    }
  }
}
```

### 3. Vercel Production Rewrite

```json
// vercel.json
{ "rewrites": [{ "source": "/api/gemini/analyze", "destination": "/api/proxy" }] }
```

### 4. E2E Test Mocking (MANDATORY)
**Every** E2E test file MUST mock the API in `beforeEach` to prevent:
- `ECONNREFUSED` errors (no backend server in CI)
- Real API costs
- Flaky tests due to network latency

```typescript
test.beforeEach(async ({ page }) => {
  await page.route('**/api/gemini/analyze', async route => {
    const payload = route.request().postDataJSON();
    if (payload?.mode === 'embed') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ embedding: { values: new Array(768).fill(0) } })
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          candidates: [{ content: { parts: [{ text: JSON.stringify({ nameTag: '...', category: '...', description: '...' }) }] } }]
        })
      });
    }
  });
  await page.goto('/');
});
```

### 5. Frontend Hook Pattern

```typescript
// hooks/useGeminiAPI.ts
const controller = new AbortController();
const response = await fetch('/api/gemini/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt, imageData, mimeType }),
  signal: controller.signal,
});
```

- Always use `AbortController` to cancel in-flight requests on unmount
- Catch `AbortError` silently (user navigated away)
- Use `error: unknown` in catch blocks, never `any`

---
name: rag_search
description: Client-side vector search (RAG) using Gemini Embeddings and cosine similarity for semantic search.
---

# RAG Search Skill

## Problem
Keyword search fails when users describe items differently than how they're stored. Semantic search using embeddings allows "find my blue jacket" to match "Navy school blazer".

## Architecture

```
Upload:  Item text → Gemini Embedding API → 768-dim vector → Firestore
Search:  Query text → Gemini Embedding API → 768-dim vector → cosine similarity vs all items → ranked results
```

## Rules

### 1. Embedding Generation (Upload Time)

```typescript
const getItemSearchText = (item: { nameTag: string; category: string; description: string; location: string }) =>
  `${item.nameTag} ${item.category} ${item.description} ${item.location}`;

const embedding = await generateEmbedding(getItemSearchText(item));

// Store in Firestore — OPTIONAL field, never block upload on failure
if (embedding && embedding.length > 0) {
  itemData.embedding = embedding;
}
```

**Critical**: Embedding generation MUST NOT block the upload. If it fails (API down, rate limit), store the item without embedding and let Re-index fix it later.

### 2. Cosine Similarity (Search Time)

```typescript
export const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
};
```

All computation happens client-side (no vector DB needed for small datasets).

### 3. Re-index Feature (Staff Only)

Scan all items, find those without embeddings, batch generate:

```typescript
const itemsWithoutEmbedding = items.filter(item => !item.embedding || item.embedding.length === 0);

let indexed = 0;
for (const item of itemsWithoutEmbedding) {
  const embedding = await generateEmbedding(getItemSearchText(item));
  if (embedding) {
    await updateItem(item.id, { embedding });
    indexed++;
  }
}
alert(`Newly indexed: ${indexed}`);
```

### 4. Search Flow

```typescript
// 1. Generate query embedding
const queryEmbedding = await generateEmbedding(searchQuery);

// 2. Score all items
const scored = items
  .filter(item => item.embedding?.length)
  .map(item => ({
    ...item,
    similarity: cosineSimilarity(queryEmbedding, item.embedding!)
  }))
  .filter(item => item.similarity > 0.3) // threshold
  .sort((a, b) => b.similarity - a.similarity);
```

### 5. UI Toggle

Provide a clear toggle between keyword search and semantic search:
- Keyword: instant, filters by substring match
- Semantic: slight delay (API call for query embedding), filters by similarity score
- Show similarity percentage on each result card

### 6. Data Schema

```typescript
const ItemSchema = z.object({
  // ... other fields
  embedding: z.array(z.number()).optional(), // 768-dim vector, optional
});
```

### 7. Model Info
- Model: `gemini-embedding-001`
- Dimensions: 768
- Task type: `RETRIEVAL_DOCUMENT` for indexing, `RETRIEVAL_QUERY` for searching
- Rate limit: depends on API plan, implement retry/backoff

### 8. Scale Considerations
- Client-side cosine similarity works fine for < 10,000 items
- Beyond that, consider Pinecone / pgvector / Firebase Vector Search extension
- Embedding dimension (768) × item count determines memory usage

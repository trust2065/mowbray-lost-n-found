/**
 * Vector math utilities for semantic search
 */

/**
 * Calculates cosine similarity between two vectors
 */
export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  if (vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const normASqrt = Math.sqrt(normA);
  const normBSqrt = Math.sqrt(normB);

  if (normASqrt === 0 || normBSqrt === 0) return 0;

  return dotProduct / (normASqrt * normBSqrt);
};

/**
 * Generates a textual representation of an item for embedding
 */
export const getItemSearchText = (item: { nameTag: string; category: string; description: string; location: string; }): string => {
  return `${item.nameTag} | ${item.category} | ${item.description} | ${item.location}`;
};

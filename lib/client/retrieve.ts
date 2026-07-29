import { DocumentChunk, EmbeddedChunk } from "@/types/retrieval";

// Calculate cosine similarity between two vectors
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Find top K most similar chunks
export function findSimilarChunks(
  queryEmbedding: number[],
  chunks: EmbeddedChunk[] | (DocumentChunk & { embedding?: number[] })[],
  topK: number = 3
): DocumentChunk[] {
  // Calculate similarities
  const similarities = chunks.map(chunk => ({
    chunk,
    score: chunk.embedding ? cosineSimilarity(queryEmbedding, chunk.embedding) : 0
  }));
  
  // Sort by highest score
  similarities.sort((a, b) => b.score - a.score);
  
  // Return top K chunks (stripping the embeddings to save memory when passing around)
  return similarities.slice(0, topK).map(s => {
    const chunk = { ...s.chunk };
    delete chunk.embedding;
    return chunk as DocumentChunk;
  });
}

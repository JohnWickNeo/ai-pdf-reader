import { EmbeddedChunk } from "@/types/retrieval";
import fs from "fs/promises";
import path from "path";

// For local MVP, we store vector data alongside uploads
const UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads");

export async function saveDocumentEmbeddings(documentId: string, chunks: EmbeddedChunk[]): Promise<void> {
  const filePath = path.join(UPLOAD_DIR, `${documentId}_vectors.json`);
  await fs.writeFile(filePath, JSON.stringify(chunks, null, 2));
}

export async function getDocumentEmbeddings(documentId: string): Promise<EmbeddedChunk[]> {
  const filePath = path.join(UPLOAD_DIR, `${documentId}_vectors.json`);
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Could not read embeddings for document ${documentId}`, error);
    return [];
  }
}

/**
 * Computes cosine similarity between two vectors.
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  
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

/**
 * Searches the local JSON store for the most similar chunks to the query embedding.
 */
export async function searchSimilarChunks(
  documentId: string,
  queryEmbedding: number[],
  topK: number = 5
): Promise<EmbeddedChunk[]> {
  const chunks = await getDocumentEmbeddings(documentId);
  
  if (!chunks.length) {
    return [];
  }

  // Calculate similarity score for each chunk
  const scoredChunks = chunks.map(chunk => ({
    chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  // Sort by highest similarity
  scoredChunks.sort((a, b) => b.score - a.score);

  // Return the top K chunks
  return scoredChunks.slice(0, topK).map(sc => sc.chunk);
}

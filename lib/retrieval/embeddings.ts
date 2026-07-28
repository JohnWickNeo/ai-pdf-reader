import { geminiClient, withRetry } from "../gemini/client";

const EMBEDDING_MODEL = "gemini-embedding-2";

/**
 * Generates an embedding for a single string using Gemini.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await withRetry(() =>
      geminiClient.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: text,
      })
    );
    
    if (!response.embeddings || response.embeddings.length === 0 || !response.embeddings[0].values) {
      throw new Error("No embedding returned from Gemini");
    }
    
    return response.embeddings[0].values;
  } catch (error) {
    console.error("Embedding generation failed:", error);
    throw new Error("Failed to generate embedding");
  }
}

/**
 * Generates embeddings for an array of texts.
 * To respect rate limits, we process them sequentially or in small batches.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  
  // Note: For a production app with huge documents, you would want to use 
  // embedContent batching or `Promise.all` with a concurrency limiter.
  // We'll run sequentially to ensure we don't hit basic rate limits.
  for (const text of texts) {
    const embedding = await generateEmbedding(text);
    embeddings.push(embedding);
  }
  
  return embeddings;
}

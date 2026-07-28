import { DocumentChunk } from "@/types/retrieval";
import { generateEmbedding } from "./embeddings";
import { searchSimilarChunks } from "./vector-store";

/**
 * Orchestrates the RAG retrieval process.
 * 1. Embeds the user query.
 * 2. Searches for the most similar document chunks.
 * 3. Returns the chunks ready to be formatted for Gemini.
 */
export async function retrieveRelevantContext(
  documentId: string,
  question: string,
  topK: number = 5
): Promise<DocumentChunk[]> {
  try {
    const queryEmbedding = await generateEmbedding(question);
    const relevantChunks = await searchSimilarChunks(documentId, queryEmbedding, topK);
    return relevantChunks;
  } catch (error) {
    console.error(`Retrieval failed for document ${documentId}`, error);
    return [];
  }
}

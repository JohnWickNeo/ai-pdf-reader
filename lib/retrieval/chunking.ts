import { ExtractedDocument } from "@/types/document";
import { DocumentChunk } from "@/types/retrieval";

const MAX_CHUNK_LENGTH = 1000;

export function chunkDocument(document: ExtractedDocument): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  let chunkIndex = 0;

  for (const page of document.pages) {
    // Basic chunking strategy: split by newlines/paragraphs first, 
    // then recombine up to MAX_CHUNK_LENGTH
    const paragraphs = page.text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    let currentChunkText = "";

    for (const paragraph of paragraphs) {
      if (currentChunkText.length + paragraph.length > MAX_CHUNK_LENGTH && currentChunkText.length > 0) {
        // Push the current chunk and start a new one
        chunks.push(createChunk(document.documentId, currentChunkText, page.pageNumber, chunkIndex++));
        currentChunkText = paragraph;
      } else {
        currentChunkText += (currentChunkText.length > 0 ? "\n\n" : "") + paragraph;
      }
    }

    // Push any remaining text in the buffer for this page
    if (currentChunkText.trim().length > 0) {
      chunks.push(createChunk(document.documentId, currentChunkText, page.pageNumber, chunkIndex++));
    }
  }

  return chunks;
}

function createChunk(documentId: string, text: string, pageNumber: number, chunkIndex: number): DocumentChunk {
  return {
    id: Math.random().toString(36).substring(2, 10),
    documentId,
    text: text.trim(),
    pageNumber,
    chunkIndex,
  };
}

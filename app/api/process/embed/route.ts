import { NextRequest, NextResponse } from "next/server";
import { getDocumentMetadata, saveDocumentMetadata } from "@/lib/storage";
import { Document, ExtractedDocument } from "@/types/document";
import { chunkDocument } from "@/lib/retrieval/chunking";
import { generateEmbeddings } from "@/lib/retrieval/embeddings";
import { saveDocumentEmbeddings } from "@/lib/retrieval/vector-store";

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: "Missing documentId" }, { status: 400 });
    }

    const documentMetadata: Document & { extracted?: ExtractedDocument } = await getDocumentMetadata(documentId);

    if (!documentMetadata || !documentMetadata.extracted) {
      return NextResponse.json({ error: "Document or extraction data not found" }, { status: 404 });
    }

    try {
      // -- RAG Pipeline: Chunking and Embedding --
      const chunks = chunkDocument(documentMetadata.extracted);
      const chunkTexts = chunks.map(c => c.text);
      
      // Generate embeddings in a batch sequentially to avoid rate limits
      const embeddingVectors = await generateEmbeddings(chunkTexts);
      
      // Zip chunks with embeddings
      const embeddedChunks = chunks.map((chunk, index) => ({
        ...chunk,
        embedding: embeddingVectors[index],
      }));

      // Save to our JSON vector store
      await saveDocumentEmbeddings(documentId, embeddedChunks);

      // Mark document as ready
      documentMetadata.status = "ready";
      await saveDocumentMetadata(documentId, documentMetadata);
      
      return NextResponse.json({ status: "success" });
    } catch (embedError) {
      console.error("Embedding error:", embedError);
      documentMetadata.status = "failed";
      await saveDocumentMetadata(documentId, documentMetadata);
      return NextResponse.json({ 
        error: embedError instanceof Error ? embedError.message : "Failed to generate embeddings." 
      }, { status: 422 });
    }

  } catch (error) {
    console.error("Process embed error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

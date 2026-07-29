import { NextRequest, NextResponse } from "next/server";
import { generateEmbeddings } from "@/lib/retrieval/embeddings";
import { DocumentChunk } from "@/types/retrieval";

export async function POST(request: NextRequest) {
  try {
    const { chunks } = await request.json();

    if (!chunks || !Array.isArray(chunks)) {
      return NextResponse.json({ error: "Missing or invalid chunks array" }, { status: 400 });
    }

    try {
      const chunkTexts = chunks.map((c: DocumentChunk) => c.text);
      
      // Generate embeddings in a batch sequentially to avoid rate limits
      const embeddingVectors = await generateEmbeddings(chunkTexts);
      
      // Zip chunks with embeddings
      const embeddedChunks = chunks.map((chunk: DocumentChunk, index: number) => ({
        ...chunk,
        embedding: embeddingVectors[index],
      }));
      
      return NextResponse.json({ embeddedChunks });
    } catch (embedError) {
      console.error("Embedding error:", embedError);
      return NextResponse.json({ 
        error: embedError instanceof Error ? embedError.message : "Failed to generate embeddings." 
      }, { status: 422 });
    }

  } catch (error) {
    console.error("Process embed error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

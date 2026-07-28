import { NextRequest, NextResponse } from "next/server";
import { getDocumentMetadata } from "@/lib/storage";
import { answerDocumentQuestion } from "@/lib/gemini/generate";
import { retrieveRelevantContext } from "@/lib/retrieval/retrieve";
import { Document, ExtractedDocument } from "@/types/document";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, message } = body;

    if (!documentId || !message) {
      return NextResponse.json(
        { error: "Missing documentId or message" },
        { status: 400 }
      );
    }

    const metadata: Document & { extracted?: ExtractedDocument } = await getDocumentMetadata(documentId);

    if (!metadata) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (metadata.status !== "ready" || !metadata.extracted) {
      return NextResponse.json(
        { error: "Document is still processing or failed extraction" },
        { status: 400 }
      );
    }

    // Retrieve relevant chunks using RAG
    const relevantChunks = await retrieveRelevantContext(documentId, message, 5);
    
    // Format context for Gemini
    const context = relevantChunks
      .map((chunk) => `[Page ${chunk.pageNumber}]\n${chunk.text}`)
      .join("\n\n");

    const answer = await answerDocumentQuestion(context, message);

    const sources = Array.from(new Set(relevantChunks.map(c => c.pageNumber))).sort((a, b) => a - b);

    return NextResponse.json({ answer, sources });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

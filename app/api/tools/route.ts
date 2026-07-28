import { NextRequest, NextResponse } from "next/server";
import { getDocumentMetadata } from "@/lib/storage";
import { executeTool } from "@/lib/retrieval/tools";
import { Document, ExtractedDocument } from "@/types/document";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, tool, params } = body;

    if (!documentId || !tool) {
      return NextResponse.json(
        { error: "Missing documentId or tool" },
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

    // Execute the tool logic
    const result = await executeTool(documentId, tool, params);

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Tools API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

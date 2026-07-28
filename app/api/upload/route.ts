import { NextRequest, NextResponse } from "next/server";
import { saveDocument, saveDocumentMetadata } from "@/lib/storage";
import { Document } from "@/types/document";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const { filename, fileBase64, size } = await request.json();

    if (!fileBase64) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
    }

    const { documentId } = await saveDocument(fileBase64, filename);

    const documentMetadata: Document = {
      id: documentId,
      filename: filename,
      size,
      status: "uploaded",
      createdAt: new Date().toISOString(),
    };

    // Save initial metadata
    await saveDocumentMetadata(documentId, documentMetadata);

    return NextResponse.json(documentMetadata, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}

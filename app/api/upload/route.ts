import { NextRequest, NextResponse } from "next/server";
import { saveDocument, saveDocumentMetadata } from "@/lib/storage";
import { Document } from "@/types/document";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
    }

    const { documentId, size } = await saveDocument(file);

    const documentMetadata: Document = {
      id: documentId,
      filename: file.name,
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

import { NextRequest, NextResponse } from "next/server";
import { getDocumentMetadata, getDocumentPath, saveDocumentMetadata } from "@/lib/storage";
import { extractTextFromPDF } from "@/lib/pdf/extractor";
import { Document, ExtractedDocument } from "@/types/document";

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: "Missing documentId" }, { status: 400 });
    }

    const documentMetadata: Document & { extracted?: ExtractedDocument } = await getDocumentMetadata(documentId);

    if (!documentMetadata) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Update status to extracting
    documentMetadata.status = "processing";
    await saveDocumentMetadata(documentId, documentMetadata);

    try {
      const pdfPath = await getDocumentPath(documentId);
      const extractedData = await extractTextFromPDF(documentId, pdfPath);

      if (!extractedData || extractedData.pages.length === 0) {
        throw new Error("No text could be extracted from this PDF. It may be an image-only or corrupted file.");
      }

      documentMetadata.extracted = extractedData;
      await saveDocumentMetadata(documentId, documentMetadata);
      
      return NextResponse.json({ status: "success" });
    } catch (extractionError) {
      console.error("Extraction error:", extractionError);
      documentMetadata.status = "failed";
      await saveDocumentMetadata(documentId, documentMetadata);
      return NextResponse.json({ 
        error: extractionError instanceof Error ? extractionError.message : "Failed to extract text from PDF." 
      }, { status: 422 });
    }

  } catch (error) {
    console.error("Process extract error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

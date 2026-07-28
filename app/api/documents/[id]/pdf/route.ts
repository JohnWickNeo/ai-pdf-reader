import { NextRequest, NextResponse } from "next/server";
import { getDocumentPath } from "@/lib/storage";
import fs from "fs/promises";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const documentPath = await getDocumentPath(id);

    try {
      const fileBuffer = await fs.readFile(documentPath);
      
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${id}.pdf"`,
        },
      });
    } catch (error) {
      console.error("Error reading PDF file:", error);
      return NextResponse.json({ error: "Document not found on disk" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error in PDF route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

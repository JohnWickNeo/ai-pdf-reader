import { ExtractedDocument, DocumentPage } from "@/types/document";
import fs from "fs/promises";

// Robust interop for pdf-parse in Next.js Server / Turbopack environments
const pdfParseModule = require("pdf-parse");
const pdf = typeof pdfParseModule === "function" 
  ? pdfParseModule 
  : (pdfParseModule.default || pdfParseModule);

export async function extractTextFromPDF(
  documentId: string,
  filePath: string
): Promise<ExtractedDocument> {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const pages: DocumentPage[] = [];

    const renderPage = async (pageData: any) => {
      // Custom page render function to capture page numbers and text separately
      const renderOptions = {
        normalizeWhitespace: true,
        disableCombineTextItems: false
      };
      
      const textContent = await pageData.getTextContent(renderOptions);
      
      const text = textContent.items
        .map((item: any) => item.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      pages.push({
        pageNumber: pageData.pageIndex + 1,
        text,
      });

      return text;
    };

    const options = {
      pagerender: renderPage,
    };

    const parsedPdf = await pdf(dataBuffer, options);

    // Sort pages just in case promises resolved out of order (though pdf-parse handles it sequentially)
    pages.sort((a, b) => a.pageNumber - b.pageNumber);

    return {
      documentId,
      pageCount: parsedPdf.numpages,
      pages,
    };
  } catch (error) {
    console.error(`Failed to extract text from PDF ${documentId}:`, error);
    throw error;
  }
}

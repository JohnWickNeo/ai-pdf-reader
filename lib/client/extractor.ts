import { pdfjs } from "react-pdf";
import { DocumentPage } from "@/types/document";

export async function extractTextFromPDFFile(file: File): Promise<DocumentPage[]> {
  const arrayBuffer = await file.arrayBuffer();
  
  // Load the document using the worker configured in components/reader/PdfViewerClient.tsx
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdfDocument = await loadingTask.promise;
  
  const pages: DocumentPage[] = [];
  
  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item: { str: string } | unknown) => (item as { str: string })?.str || "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
      
    pages.push({
      pageNumber: i,
      text
    });
  }
  
  return pages;
}

import { pdfjs } from "react-pdf";
import { DocumentPage } from "@/types/document";

// Set up the worker for react-pdf
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

export async function extractTextFromPDFFile(file: File): Promise<DocumentPage[]> {
  const arrayBuffer = await file.arrayBuffer();
  
  // Load the document
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

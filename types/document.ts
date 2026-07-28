export type Document = {
  id: string;
  filename: string;
  size: number;
  pageCount?: number;
  status: "uploaded" | "processing" | "ready" | "failed";
  createdAt: string;
};

export type DocumentPage = {
  pageNumber: number;
  text: string;
};

export type ExtractedDocument = {
  documentId: string;
  pageCount: number;
  pages: DocumentPage[];
};

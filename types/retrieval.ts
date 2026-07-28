export type DocumentChunk = {
  id: string;
  documentId: string;
  text: string;
  pageNumber: number;
  chunkIndex: number;
};

export type EmbeddedChunk = DocumentChunk & {
  embedding: number[];
};

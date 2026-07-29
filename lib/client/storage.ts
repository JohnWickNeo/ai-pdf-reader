import { get, set, del } from "idb-keyval";
import { DocumentChunk } from "@/types/retrieval";
import { Document } from "@/types/document";

export interface LocalDocumentData {
  metadata: Document;
  pdfFile: File;
  chunks: DocumentChunk[];
}

export async function saveDocumentLocally(
  documentId: string,
  data: LocalDocumentData
): Promise<void> {
  await set(`doc_${documentId}`, data);
}

export async function getDocumentLocally(
  documentId: string
): Promise<LocalDocumentData | undefined> {
  return await get(`doc_${documentId}`);
}

export async function getAllLocalDocuments(): Promise<Document[]> {
  const { entries } = await import("idb-keyval");
  const allEntries = await entries();
  
  const docs: Document[] = [];
  for (const [key, value] of allEntries) {
    if (typeof key === "string" && key.startsWith("doc_")) {
      const data = value as LocalDocumentData;
      if (data && data.metadata) {
        docs.push(data.metadata);
      }
    }
  }
  
  return docs.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function deleteDocumentLocally(documentId: string): Promise<void> {
  await del(`doc_${documentId}`);
}

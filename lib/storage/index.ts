import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import os from "os";

// Use /tmp on Vercel/serverless environments, otherwise use local .data folder
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV;
const UPLOAD_DIR = isVercel 
  ? path.join(os.tmpdir(), "pdf-reader-uploads")
  : path.join(process.cwd(), ".data", "uploads");

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export async function saveDocument(buffer: Buffer, filename: string): Promise<{ documentId: string }> {
  await ensureUploadDir();

  const documentId = crypto.randomBytes(16).toString("hex");
  const extension = path.extname(filename) || ".pdf";
  const safeFilename = `${documentId}${extension}`;
  const filePath = path.join(UPLOAD_DIR, safeFilename);

  await fs.writeFile(filePath, buffer);

  return {
    documentId,
  };
}

export async function getDocumentPath(documentId: string): Promise<string> {
  return path.join(UPLOAD_DIR, `${documentId}.pdf`);
}

export async function saveDocumentMetadata(documentId: string, metadata: any): Promise<void> {
  await ensureUploadDir();
  const filePath = path.join(UPLOAD_DIR, `${documentId}.json`);
  await fs.writeFile(filePath, JSON.stringify(metadata, null, 2));
}

export async function getDocumentMetadata(documentId: string): Promise<any | null> {
  const filePath = path.join(UPLOAD_DIR, `${documentId}.json`);
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

export async function updateDocumentStatus(documentId: string, status: string): Promise<void> {
  const metadata = await getDocumentMetadata(documentId);
  if (metadata) {
    metadata.status = status;
    await saveDocumentMetadata(documentId, metadata);
  }
}

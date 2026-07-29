"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, File, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Document } from "@/types/document";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function PDFUploader() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "extracting" | "indexing">("idle");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const validateFile = (file: File): boolean => {
    setError(null);
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("File size exceeds 10MB limit.");
      return false;
    }
    return true;
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        uploadFile(droppedFile);
      }
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        uploadFile(selectedFile);
      }
    }
  };

  const uploadFile = async (fileToUpload: File) => {
    setUploadState("uploading");
    setUploadProgress(0);
    setError(null);

    try {
      // Simulate upload progress for UX since fetch doesn't support upload progress natively
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 300);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": fileToUpload.type,
          "x-file-name": encodeURIComponent(fileToUpload.name),
        },
        body: fileToUpload,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.error || "Upload failed.");
      }

      const response = await uploadRes.json();
      const documentId = response.id;
      
      // Phase 2: Extract text
      setUploadState("extracting");
      const extractRes = await fetch("/api/process/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });

      if (!extractRes.ok) {
        const errData = await extractRes.json();
        throw new Error(errData.error || "Failed to extract text from PDF.");
      }

      // Phase 3: Index document
      setUploadState("indexing");
      const embedRes = await fetch("/api/process/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });

      if (!embedRes.ok) {
        const errData = await embedRes.json();
        throw new Error(errData.error || "Failed to generate embeddings.");
      }

      // Complete
      router.push(`/reader/${documentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed.");
      setUploadState("idle");
      setFile(null);
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto overflow-hidden">
      <CardContent className="p-0">
        <div
          className={`relative border-2 border-dashed p-12 flex flex-col items-center justify-center transition-colors cursor-pointer min-h-[300px]
            ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:bg-accent/50"}
            ${uploadState !== "idle" ? "pointer-events-none" : ""}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => uploadState === "idle" && fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf,application/pdf"
            className="hidden"
            disabled={uploadState !== "idle"}
          />

          {!file && uploadState === "idle" && (
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <UploadCloud className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Upload your PDF</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Drag and drop your file here, or click to browse
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Maximum file size: 10MB
              </p>
            </div>
          )}

          {file && uploadState !== "idle" && (
            <div className="flex flex-col items-center w-full max-w-sm space-y-4">
              <div className="flex items-center space-x-3 w-full">
                <File className="w-8 h-8 text-primary shrink-0" />
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              
              <div className="w-full space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span>
                    {uploadState === "uploading" && "Uploading..."}
                    {uploadState === "extracting" && "Extracting text..."}
                    {uploadState === "indexing" && "Indexing document..."}
                  </span>
                  <span>{uploadState === "uploading" ? `${uploadProgress}%` : "Working..."}</span>
                </div>
                <Progress 
                  value={uploadState === "uploading" ? uploadProgress : (uploadState === "extracting" ? 75 : 95)} 
                  className="h-2" 
                />
              </div>
            </div>
          )}

          {error && (
            <div className="absolute bottom-4 left-4 right-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-center gap-2 border border-destructive/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

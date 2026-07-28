"use client";

import dynamic from "next/dynamic";

const PdfViewer = dynamic(
  () => import("./PdfViewer").then((mod) => mod.PdfViewer),
  { 
    ssr: false, 
    loading: () => (
      <div className="flex items-center justify-center h-full w-full bg-muted/10 animate-pulse">
        <p>Loading PDF Viewer...</p>
      </div>
    ) 
  }
);

interface PdfViewerClientProps {
  documentId: string;
}

export function PdfViewerClient({ documentId }: PdfViewerClientProps) {
  return <PdfViewer documentId={documentId} />;
}

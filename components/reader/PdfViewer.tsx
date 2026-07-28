"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { PdfToolbar } from "./PdfToolbar";
import { ReadingProgress } from "./ReadingProgress";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  documentId: string;
}

export function PdfViewer({ documentId }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);
  
  const pdfUrl = `/api/documents/${documentId}/pdf`;

  const getStorageKey = () => `pdf-progress-${documentId}`;

  // Save progress when page changes
  useEffect(() => {
    if (numPages > 0) {
      const progress = Math.round((currentPage / numPages) * 100);
      localStorage.setItem(
        getStorageKey(),
        JSON.stringify({
          documentId,
          currentPage,
          progress,
          updatedAt: new Date().toISOString(),
        })
      );
    }
  }, [currentPage, numPages, documentId]);

  const onDocumentLoadSuccess = ({ numPages: nextNumPages }: { numPages: number }) => {
    setNumPages(nextNumPages);
    
    // Restore progress
    const saved = localStorage.getItem(getStorageKey());
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.currentPage && parsed.currentPage <= nextNumPages) {
          setCurrentPage(parsed.currentPage);
          return;
        }
      } catch (e) {
        console.error("Failed to parse saved progress", e);
      }
    }
    setCurrentPage(1);
  };

  const handleRestart = () => {
    setCurrentPage(1);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Listen for custom events to navigate pages externally (e.g. from ChatInterface sources)
  useEffect(() => {
    const handlePdfNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<{ page: number }>;
      if (customEvent.detail?.page && numPages > 0) {
        const targetPage = Math.max(1, Math.min(customEvent.detail.page, numPages));
        setCurrentPage(targetPage);
      }
    };
    window.addEventListener("pdf-navigate", handlePdfNavigate);
    return () => window.removeEventListener("pdf-navigate", handlePdfNavigate);
  }, [numPages]);

  const handleFitWidth = useCallback(() => {
    if (containerRef.current) {
      // Very basic fit-width calculation, assuming standard A4 PDF aspect ratio
      // A more robust solution would measure the Page's intrinsic size
      const containerWidth = containerRef.current.clientWidth - 40; // minus padding
      const estimatedPdfWidth = 600; // standard unscaled PDF width in pixels
      const newScale = containerWidth / estimatedPdfWidth;
      setScale(Math.min(Math.max(newScale, 0.5), 3));
    }
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`flex flex-col h-full w-full bg-background border-r ${isFullscreen ? 'bg-background' : ''}`}
    >
      <PdfToolbar
        currentPage={currentPage}
        numPages={numPages}
        scale={scale}
        isFullscreen={isFullscreen}
        onPageChange={setCurrentPage}
        onScaleChange={setScale}
        onToggleFullscreen={handleToggleFullscreen}
        onFitWidth={handleFitWidth}
        searchText={searchText}
        onSearchChange={setSearchText}
      />
      
      <ReadingProgress 
        currentPage={currentPage}
        numPages={numPages}
        onRestart={handleRestart}
      />
      
      <div className="flex-1 overflow-auto bg-muted/30 relative">
        <div className="min-h-full min-w-full flex justify-center p-4 sm:p-8">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground animate-pulse">Loading PDF...</p>
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center h-full text-destructive">
                <p>Failed to load PDF.</p>
                <p className="text-sm">Please verify the file exists or try uploading again.</p>
              </div>
            }
          >
            {numPages > 0 && (
              <div className="shadow-lg bg-white">
                <Page
                  pageNumber={currentPage}
                  scale={scale}
                  renderAnnotationLayer={true}
                  renderTextLayer={true}
                  customTextRenderer={
                    searchText 
                      ? ({ str, itemIndex }) => {
                          if (str.toLowerCase().includes(searchText.toLowerCase())) {
                            return `<mark>${str}</mark>`;
                          }
                          return str;
                        }
                      : undefined
                  }
                />
              </div>
            )}
          </Document>
        </div>
      </div>
    </div>
  );
}

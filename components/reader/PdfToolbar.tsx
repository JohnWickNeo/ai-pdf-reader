"use client";

import { PageControls } from "./PageControls";
import { ZoomControls } from "./ZoomControls";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface PdfToolbarProps {
  currentPage: number;
  numPages: number;
  scale: number;
  isFullscreen: boolean;
  onPageChange: (page: number) => void;
  onScaleChange: (scale: number) => void;
  onToggleFullscreen: () => void;
  onFitWidth: () => void;
  searchText: string;
  onSearchChange: (text: string) => void;
}

export function PdfToolbar({
  currentPage,
  numPages,
  scale,
  isFullscreen,
  onPageChange,
  onScaleChange,
  onToggleFullscreen,
  onFitWidth,
  searchText,
  onSearchChange,
}: PdfToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-2 border-b bg-background gap-4 shrink-0">
      <div className="flex-1">
        <div className="relative max-w-xs hidden sm:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search in PDF..."
            className="pl-8 h-9"
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 flex justify-center">
        <PageControls
          currentPage={currentPage}
          numPages={numPages}
          onPageChange={onPageChange}
        />
      </div>
      
      <div className="flex-1 flex justify-end">
        <ZoomControls
          scale={scale}
          onScaleChange={onScaleChange}
          isFullscreen={isFullscreen}
          onToggleFullscreen={onToggleFullscreen}
          onFitWidth={onFitWidth}
        />
      </div>
    </div>
  );
}

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

interface PageControlsProps {
  currentPage: number;
  numPages: number;
  onPageChange: (page: number) => void;
}

export function PageControls({ currentPage, numPages, onPageChange }: PageControlsProps) {
  const [inputValue, setInputValue] = useState(currentPage.toString());
  const [prevPage, setPrevPage] = useState(currentPage);

  if (currentPage !== prevPage) {
    setPrevPage(currentPage);
    setInputValue(currentPage.toString());
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const page = parseInt(inputValue, 10);
      if (!isNaN(page) && page >= 1 && page <= numPages) {
        onPageChange(page);
      } else {
        setInputValue(currentPage.toString());
      }
    }
  };

  const handleInputBlur = () => {
    const page = parseInt(inputValue, 10);
    if (!isNaN(page) && page >= 1 && page <= numPages) {
      onPageChange(page);
    } else {
      setInputValue(currentPage.toString());
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center space-x-2 text-sm">
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onBlur={handleInputBlur}
          className="w-12 h-8 text-center px-1"
        />
        <span className="text-muted-foreground whitespace-nowrap">
          / {numPages || "--"}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onPageChange(Math.min(numPages, currentPage + 1))}
        disabled={currentPage >= numPages || !numPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

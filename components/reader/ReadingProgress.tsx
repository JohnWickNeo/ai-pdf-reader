"use client";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface ReadingProgressProps {
  currentPage: number;
  numPages: number;
  onRestart: () => void;
}

export function ReadingProgress({ currentPage, numPages, onRestart }: ReadingProgressProps) {
  if (numPages === 0) return null;

  const progress = Math.round((currentPage / numPages) * 100);

  return (
    <div className="bg-background border-b px-4 py-2 flex items-center justify-between text-sm shrink-0">
      <div className="flex-1 max-w-md space-y-1">
        <div className="flex justify-between font-medium">
          <span className="text-muted-foreground">Reading Progress</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground">
          Page {currentPage} of {numPages}
        </p>
      </div>
      <div className="ml-4">
        <Button variant="outline" size="sm" onClick={onRestart} className="flex items-center gap-2">
          <RotateCcw className="h-3 w-3" />
          <span className="hidden sm:inline">Start from beginning</span>
        </Button>
      </div>
    </div>
  );
}

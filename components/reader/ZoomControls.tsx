"use client";

import { ZoomIn, ZoomOut, Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ZoomControlsProps {
  scale: number;
  onScaleChange: (scale: number) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onFitWidth: () => void;
}

export function ZoomControls({
  scale,
  onScaleChange,
  isFullscreen,
  onToggleFullscreen,
  onFitWidth,
}: ZoomControlsProps) {
  const zoomIn = () => onScaleChange(Math.min(3, scale + 0.25));
  const zoomOut = () => onScaleChange(Math.max(0.5, scale - 0.25));

  return (
    <div className="flex items-center space-x-1">
      <Button variant="ghost" size="icon" onClick={zoomOut} title="Zoom Out">
        <ZoomOut className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium w-12 text-center">
        {Math.round(scale * 100)}%
      </span>
      <Button variant="ghost" size="icon" onClick={zoomIn} title="Zoom In">
        <ZoomIn className="h-4 w-4" />
      </Button>
      <div className="h-4 w-px bg-border mx-2" />
      <Button variant="ghost" size="icon" onClick={onFitWidth} title="Fit Width">
        <Maximize className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onToggleFullscreen} title="Toggle Fullscreen">
        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
      </Button>
    </div>
  );
}

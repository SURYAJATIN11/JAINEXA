import React from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Eye
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TimetableZoomControlsProps {
  zoomLevel: number;
  onZoomChange: (newZoom: number) => void;
  onResetZoom: () => void;
  onFitToScreen?: () => void;
  isFitToScreen?: boolean;
  className?: string;
}

export function TimetableZoomControls({
  zoomLevel,
  onZoomChange,
  onResetZoom,
  onFitToScreen,
  isFitToScreen = false,
  className = ""
}: TimetableZoomControlsProps) {
  const handleZoomIn = () => {
    onZoomChange(Math.min(140, zoomLevel + 10));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.max(65, zoomLevel - 10));
  };

  return (
    <div
      className={`inline-flex items-center bg-[#f0ede4] border border-[#d5d0c2] rounded-lg p-0.5 shadow-xs select-none ${className}`}
      role="toolbar"
      aria-label="Timetable Screen View Zoom Controls"
    >
      {/* Zoom Out */}
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 65}
            className="w-7 h-7 flex items-center justify-center rounded text-[#4c4950] hover:text-[#252b67] hover:bg-white active:scale-95 disabled:opacity-35 disabled:pointer-events-none transition cursor-pointer"
            aria-label="Zoom out screen view"
          >
            <ZoomOut size={14} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-[11px] py-1 px-2">
          Zoom Out (Ctrl -)
        </TooltipContent>
      </Tooltip>

      {/* Current Zoom Percentage / Reset */}
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onResetZoom}
            className="px-2 h-7 flex items-center gap-1 font-mono text-[11px] font-bold text-[#252b67] hover:bg-white rounded transition cursor-pointer"
            aria-label={`Current view zoom is ${zoomLevel}%. Click to reset to 100%.`}
          >
            <span>{zoomLevel}%</span>
            {zoomLevel !== 100 && <RotateCcw size={10} className="text-[#e3a62f] opacity-80" />}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-[11px] py-1 px-2">
          Reset View to 100%
        </TooltipContent>
      </Tooltip>

      {/* Zoom In */}
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 140}
            className="w-7 h-7 flex items-center justify-center rounded text-[#4c4950] hover:text-[#252b67] hover:bg-white active:scale-95 disabled:opacity-35 disabled:pointer-events-none transition cursor-pointer"
            aria-label="Zoom in screen view"
          >
            <ZoomIn size={14} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-[11px] py-1 px-2">
          Zoom In (Ctrl +)
        </TooltipContent>
      </Tooltip>

      {/* Fit to Screen (auto adjust width) */}
      {onFitToScreen && (
        <>
          <div className="w-px h-4 bg-[#d5d0c2] mx-0.5" />
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onFitToScreen}
                className={`h-7 px-2 flex items-center gap-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                  isFitToScreen
                    ? "bg-[#252b67] text-[#e3a62f] shadow-xs"
                    : "text-[#4c4950] hover:text-[#252b67] hover:bg-white"
                }`}
                aria-label="Auto-fit timetable matrix to screen width"
              >
                <Maximize2 size={12} />
                <span className="hidden sm:inline">Fit View</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[11px] py-1 px-2">
              Fit all 8 periods seamlessly on screen (No horizontal scroll)
            </TooltipContent>
          </Tooltip>
        </>
      )}
    </div>
  );
}

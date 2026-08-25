"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PhotoLightboxModalProps {
  photos: string[];
  initialIndex?: number;
  userName?: string;
  onClose: () => void;
}

export default function PhotoLightboxModal({
  photos,
  initialIndex = 0,
  userName = "Member",
  onClose,
}: PhotoLightboxModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  const activePhoto = photos[currentIndex] || "";

  const handleNext = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const handlePrev = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, onClose]);

  const handleZoom = (delta: number) => {
    setZoom((prev) => {
      const next = Math.min(3, Math.max(1, prev + delta));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || zoom <= 1) return;
    setPan({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col justify-between select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 z-20 bg-gradient-to-b from-black/80 to-transparent">
        <div className="text-white">
          <h3 className="font-bold text-base">{userName}</h3>
          <p className="text-xs text-gray-400">
            Photo {currentIndex + 1} of {photos.length}
          </p>
        </div>

        {/* Zoom & Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleZoom(-0.25)}
            disabled={zoom <= 1}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-white/80 font-mono min-w-[42px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => handleZoom(0.25)}
            disabled={zoom >= 3}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          {zoom > 1 && (
            <button
              onClick={handleResetZoom}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors ml-1"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors ml-4"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Photo Viewport */}
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden p-4 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={() => (zoom > 1 ? handleResetZoom() : handleZoom(0.5))}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={activePhoto}
            alt={userName}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: zoom, x: pan.x, y: pan.y }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            draggable={false}
            className="max-h-[80vh] max-w-[90vw] object-contain rounded-xl shadow-2xl transition-transform"
          />
        </AnimatePresence>

        {/* Carousel Navigation Arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-4 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 transition-all shadow-lg hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-4 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 transition-all shadow-lg hover:scale-105 active:scale-95"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {photos.length > 1 && (
        <div className="p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-center items-center gap-2 overflow-x-auto">
          {photos.map((p, i) => (
            <button
              key={i}
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
                setCurrentIndex(i);
              }}
              className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                i === currentIndex
                  ? "border-brand-500 scale-105 shadow-md"
                  : "border-transparent opacity-50 hover:opacity-100"
              }`}
            >
              <img src={p} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

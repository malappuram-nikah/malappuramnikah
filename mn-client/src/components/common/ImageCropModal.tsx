"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, ZoomIn, ZoomOut, Check, RotateCw, Crop } from "lucide-react";
import { applyWatermarkToImage } from "@/lib/watermark-utils";

interface ImageCropModalProps {
  imageSrc: string;
  onCropComplete: (croppedDataUrl: string) => void;
  onCancel: () => void;
  aspectRatio?: number; // width / height, default 3/4
}

export default function ImageCropModal({
  imageSrc,
  onCropComplete,
  onCancel,
  aspectRatio = 3 / 4,
}: ImageCropModalProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [aspect, setAspect] = useState<"portrait" | "square">("portrait");
  const [isProcessing, setIsProcessing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const currentAspectRatio = aspect === "portrait" ? 3 / 4 : 1;

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle Touch Dragging
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleZoom = (delta: number) => {
    setScale((prev) => Math.min(3, Math.max(0.5, prev + delta)));
  };

  const handleCrop = async () => {
    if (!imgRef.current || !containerRef.current) return;
    setIsProcessing(true);

    try {
      const img = imgRef.current;
      const cropContainer = containerRef.current;

      const cropRect = cropContainer.getBoundingClientRect();
      const outputWidth = 800;
      const outputHeight = Math.round(outputWidth / currentAspectRatio);

      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) throw new Error("Could not get canvas context");

      // Clear background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outputWidth, outputHeight);

      // Render image transformed
      ctx.save();
      ctx.translate(outputWidth / 2, outputHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);

      // Ratio between canvas pixels and screen pixels
      const scaleFactor = outputWidth / cropRect.width;

      const drawWidth = img.width * scale * scaleFactor;
      const drawHeight = img.height * scale * scaleFactor;
      const drawX = position.x * scaleFactor - drawWidth / 2;
      const drawY = position.y * scaleFactor - drawHeight / 2;

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();

      const rawCropped = canvas.toDataURL("image/jpeg", 0.95);

      // Apply watermark automatically
      const watermarked = await applyWatermarkToImage(rawCropped, "Malappuram Nikah");
      onCropComplete(watermarked);
    } catch (err) {
      console.error("Cropping failed:", err);
      onCropComplete(imageSrc);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crop className="w-5 h-5 text-brand-600" />
            <h3 className="font-bold text-gray-900 text-base">Adjust & Crop Photo</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="p-4 bg-gray-900 flex-1 flex flex-col items-center justify-center min-h-[320px] select-none relative overflow-hidden">
          <div
            ref={containerRef}
            className="relative overflow-hidden border-2 border-white/80 shadow-2xl rounded-2xl cursor-grab active:cursor-grabbing bg-black/50"
            style={{
              width: aspect === "portrait" ? "240px" : "280px",
              height: aspect === "portrait" ? "320px" : "280px",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Grid Overlay Guide */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none z-10 opacity-30">
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-white" />
              <div className="border-r border-white" />
              <div />
            </div>

            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop target"
              draggable={false}
              className="absolute pointer-events-none transition-transform duration-75 origin-center max-w-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                left: "50%",
                top: "50%",
                marginLeft: imgRef.current ? -imgRef.current.width / 2 : 0,
                marginTop: imgRef.current ? -imgRef.current.height / 2 : 0,
              }}
            />
          </div>

          <p className="text-[11px] text-gray-400 mt-3 font-medium">
            Drag to reposition · Use zoom controls below
          </p>
        </div>

        {/* Controls */}
        <div className="p-4 bg-white border-t border-gray-100 space-y-4">
          <div className="flex items-center justify-between gap-4">
            {/* Aspect Ratio Switcher */}
            <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setAspect("portrait")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  aspect === "portrait"
                    ? "bg-white text-brand-700 shadow-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Portrait (3:4)
              </button>
              <button
                type="button"
                onClick={() => setAspect("square")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  aspect === "square"
                    ? "bg-white text-brand-700 shadow-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Square (1:1)
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleZoom(-0.15)}
                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-gray-600 min-w-[40px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => handleZoom(0.15)}
                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 ml-1"
                title="Rotate"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCrop}
              disabled={isProcessing}
              className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-600/20 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {isProcessing ? "Processing..." : "Apply & Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

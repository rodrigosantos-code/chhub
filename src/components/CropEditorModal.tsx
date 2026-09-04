import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Move, Check, RotateCcw } from 'lucide-react';
import { CropData, RatioImageKey } from '../types';

interface CropEditorModalProps {
  imageUrl: string;
  imageName: string;
  initialCrop?: CropData;
  initialFocalPoint?: { x: number; y: number };
  /** If set, crop is constrained to this ratio and can only be saved for it */
  forRatio?: RatioImageKey;
  onSave: (
    crop: CropData,
    focalPoint: { x: number; y: number },
    target: 'general' | RatioImageKey
  ) => void;
  onClose: () => void;
}

const RATIO_CONSTRAINTS: Record<string, number> = {
  square: 1,
  portrait_4_5: 4 / 5,
  portrait_9_16: 9 / 16,
  landscape: 16 / 9,
};

const RATIO_LABELS: Record<string, string> = {
  free: 'Free',
  square: '1:1',
  portrait_4_5: '4:5',
  portrait_9_16: '9:16',
  landscape: '16:9',
};

export const CropEditorModal: React.FC<CropEditorModalProps> = ({
  imageUrl,
  imageName,
  initialCrop,
  initialFocalPoint,
  forRatio,
  onSave,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ w: 0, h: 0 });
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0, offsetX: 0, offsetY: 0 });

  // Crop state (normalized 0-1)
  const [crop, setCrop] = useState<CropData>(
    initialCrop || { x: 0, y: 0, width: 1, height: 1 }
  );
  const [focalPoint, setFocalPoint] = useState(
    initialFocalPoint || { x: 0.5, y: 0.5 }
  );
  const [ratioConstraint, setRatioConstraint] = useState<string>(forRatio || 'free');
  const [dragMode, setDragMode] = useState<'none' | 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br' | 'focal'>('none');
  const dragStartRef = useRef({ x: 0, y: 0, crop: crop, fp: focalPoint });

  // Load image to get natural dimensions
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSize({ w: img.naturalWidth, h: img.naturalHeight });
      setImageLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Calculate display size to fit the modal
  useEffect(() => {
    if (!containerRef.current || !imageLoaded) return;
    const container = containerRef.current;
    const maxW = container.clientWidth;
    const maxH = container.clientHeight;
    const imgRatio = imageSize.w / imageSize.h;
    let w: number, h: number;
    if (imgRatio > maxW / maxH) {
      w = maxW;
      h = maxW / imgRatio;
    } else {
      h = maxH;
      w = maxH * imgRatio;
    }
    setDisplaySize({
      w,
      h,
      offsetX: (maxW - w) / 2,
      offsetY: (maxH - h) / 2,
    });
  }, [imageLoaded, imageSize]);

  // Apply ratio constraint when changed
  useEffect(() => {
    if (ratioConstraint === 'free') return;
    const targetRatio = RATIO_CONSTRAINTS[ratioConstraint];
    if (!targetRatio) return;

    setCrop((prev) => {
      const currentRatio = (prev.width * imageSize.w) / (prev.height * imageSize.h);
      if (Math.abs(currentRatio - targetRatio) < 0.01) return prev;

      let newW = prev.width;
      let newH = prev.height;
      const currentPixelW = prev.width * imageSize.w;
      const currentPixelH = prev.height * imageSize.h;

      if (currentRatio > targetRatio) {
        // Too wide — reduce width
        const newPixelW = currentPixelH * targetRatio;
        newW = newPixelW / imageSize.w;
      } else {
        // Too tall — reduce height
        const newPixelH = currentPixelW / targetRatio;
        newH = newPixelH / imageSize.h;
      }

      // Center the new crop within the old one
      let newX = prev.x + (prev.width - newW) / 2;
      let newY = prev.y + (prev.height - newH) / 2;
      newX = Math.max(0, Math.min(1 - newW, newX));
      newY = Math.max(0, Math.min(1 - newH, newY));

      return { x: newX, y: newY, width: newW, height: newH };
    });
  }, [ratioConstraint, imageSize]);

  const toDisplayCoords = useCallback(
    (nx: number, ny: number) => ({
      x: displaySize.offsetX + nx * displaySize.w,
      y: displaySize.offsetY + ny * displaySize.h,
    }),
    [displaySize]
  );

  const toNormalizedCoords = useCallback(
    (px: number, py: number) => ({
      x: Math.max(0, Math.min(1, (px - displaySize.offsetX) / displaySize.w)),
      y: Math.max(0, Math.min(1, (py - displaySize.offsetY) / displaySize.h)),
    }),
    [displaySize]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, mode: typeof dragMode) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = containerRef.current!.getBoundingClientRect();
      dragStartRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        crop: { ...crop },
        fp: { ...focalPoint },
      };
      setDragMode(mode);
    },
    [crop, focalPoint]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragMode === 'none') return;
      const rect = containerRef.current!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const dx = mx - dragStartRef.current.x;
      const dy = my - dragStartRef.current.y;
      const startCrop = dragStartRef.current.crop;

      if (dragMode === 'focal') {
        const norm = toNormalizedCoords(mx, my);
        // Focal point is relative to the crop region
        const fpx = (norm.x - crop.x) / crop.width;
        const fpy = (norm.y - crop.y) / crop.height;
        setFocalPoint({
          x: Math.max(0, Math.min(1, fpx)),
          y: Math.max(0, Math.min(1, fpy)),
        });
        return;
      }

      const dxNorm = dx / displaySize.w;
      const dyNorm = dy / displaySize.h;

      if (dragMode === 'move') {
        let newX = startCrop.x + dxNorm;
        let newY = startCrop.y + dyNorm;
        newX = Math.max(0, Math.min(1 - startCrop.width, newX));
        newY = Math.max(0, Math.min(1 - startCrop.height, newY));
        setCrop({ ...startCrop, x: newX, y: newY });
      } else {
        // Resize from corners
        let newX = startCrop.x;
        let newY = startCrop.y;
        let newW = startCrop.width;
        let newH = startCrop.height;

        if (dragMode === 'resize-br') {
          newW = Math.max(0.05, Math.min(1 - newX, startCrop.width + dxNorm));
          newH = Math.max(0.05, Math.min(1 - newY, startCrop.height + dyNorm));
        } else if (dragMode === 'resize-bl') {
          const right = startCrop.x + startCrop.width;
          newX = Math.max(0, Math.min(right - 0.05, startCrop.x + dxNorm));
          newW = right - newX;
          newH = Math.max(0.05, Math.min(1 - newY, startCrop.height + dyNorm));
        } else if (dragMode === 'resize-tr') {
          const bottom = startCrop.y + startCrop.height;
          newW = Math.max(0.05, Math.min(1 - newX, startCrop.width + dxNorm));
          newY = Math.max(0, Math.min(bottom - 0.05, startCrop.y + dyNorm));
          newH = bottom - newY;
        } else if (dragMode === 'resize-tl') {
          const right = startCrop.x + startCrop.width;
          const bottom = startCrop.y + startCrop.height;
          newX = Math.max(0, Math.min(right - 0.05, startCrop.x + dxNorm));
          newY = Math.max(0, Math.min(bottom - 0.05, startCrop.y + dyNorm));
          newW = right - newX;
          newH = bottom - newY;
        }

        // Apply ratio constraint
        if (ratioConstraint !== 'free') {
          const targetRatio = RATIO_CONSTRAINTS[ratioConstraint];
          const pixelW = newW * imageSize.w;
          const pixelH = newH * imageSize.h;
          const currentRatio = pixelW / pixelH;
          if (Math.abs(currentRatio - targetRatio) > 0.01) {
            // Adjust height to match ratio
            const adjustedPixelH = pixelW / targetRatio;
            newH = adjustedPixelH / imageSize.h;
            if (newY + newH > 1) {
              newH = 1 - newY;
              const adjustedPixelW = (newH * imageSize.h) * targetRatio;
              newW = adjustedPixelW / imageSize.w;
            }
          }
        }

        setCrop({ x: newX, y: newY, width: Math.max(0.05, newW), height: Math.max(0.05, newH) });
      }
    },
    [dragMode, displaySize, crop, toNormalizedCoords, ratioConstraint, imageSize]
  );

  const handleMouseUp = useCallback(() => {
    setDragMode('none');
  }, []);

  const handleReset = () => {
    setCrop({ x: 0, y: 0, width: 1, height: 1 });
    setFocalPoint({ x: 0.5, y: 0.5 });
  };

  const handleSave = (target: 'general' | RatioImageKey) => {
    onSave(crop, focalPoint, target);
    onClose();
  };

  if (!imageLoaded) {
    return (
      <div className="fixed inset-0 z-[999] bg-black/80 flex items-center justify-center">
        <div className="text-white text-sm animate-pulse">Loading image...</div>
      </div>
    );
  }

  // Compute display positions of crop rect
  const cropDisplay = {
    x: displaySize.offsetX + crop.x * displaySize.w,
    y: displaySize.offsetY + crop.y * displaySize.h,
    w: crop.width * displaySize.w,
    h: crop.height * displaySize.h,
  };

  // Focal point in display coords (relative to crop)
  const fpDisplay = {
    x: cropDisplay.x + focalPoint.x * cropDisplay.w,
    y: cropDisplay.y + focalPoint.y * cropDisplay.h,
  };

  const handleSize = 10;

  return (
    <div className="fixed inset-0 z-[999] bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-900/90 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <h3 className="text-white font-bold text-sm">Crop & Focal Point</h3>
          <span className="text-gray-400 text-xs">{imageName}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-2 bg-gray-900/70 border-b border-gray-800">
        {/* Ratio buttons */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-500 font-semibold uppercase mr-1">Ratio:</span>
          {Object.entries(RATIO_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setRatioConstraint(key)}
              disabled={!!forRatio && key !== forRatio && key !== 'free'}
              className={`px-2 py-1 rounded text-[10px] font-medium cursor-pointer transition-colors ${
                ratioConstraint === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-default'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-gray-700" />

        <button
          onClick={handleReset}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>

        <div className="flex-1" />

        {/* Save buttons */}
        {forRatio ? (
          <button
            onClick={() => handleSave(forRatio)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            Save for {RATIO_LABELS[forRatio]}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSave('general')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Save as General
            </button>
            {(['square', 'portrait_4_5', 'portrait_9_16', 'landscape'] as RatioImageKey[]).map((rk) => (
              <button
                key={rk}
                onClick={() => handleSave(rk)}
                className="px-2 py-1.5 rounded-lg text-[10px] font-bold bg-gray-700 text-gray-200 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
              >
                Save for {RATIO_LABELS[rk]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-crosshair select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Image */}
        <img
          src={imageUrl}
          alt={imageName}
          className="absolute pointer-events-none"
          style={{
            left: displaySize.offsetX,
            top: displaySize.offsetY,
            width: displaySize.w,
            height: displaySize.h,
          }}
          draggable={false}
        />

        {/* Darkened overlay outside crop */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(to right,
              rgba(0,0,0,0.7) ${cropDisplay.x}px,
              transparent ${cropDisplay.x}px,
              transparent ${cropDisplay.x + cropDisplay.w}px,
              rgba(0,0,0,0.7) ${cropDisplay.x + cropDisplay.w}px
            )`,
          }}
        />
        {/* Top dark band */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: cropDisplay.x,
            top: 0,
            width: cropDisplay.w,
            height: cropDisplay.y,
            background: 'rgba(0,0,0,0.7)',
          }}
        />
        {/* Bottom dark band */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: cropDisplay.x,
            top: cropDisplay.y + cropDisplay.h,
            width: cropDisplay.w,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
          }}
        />

        {/* Crop border */}
        <div
          className="absolute border-2 border-white/80 pointer-events-none"
          style={{
            left: cropDisplay.x,
            top: cropDisplay.y,
            width: cropDisplay.w,
            height: cropDisplay.h,
          }}
        >
          {/* Rule of thirds grid */}
          <div className="absolute inset-0">
            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20" />
            <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
            <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20" />
          </div>
        </div>

        {/* Move handle (center of crop) */}
        <div
          className="absolute cursor-move"
          style={{
            left: cropDisplay.x + 2,
            top: cropDisplay.y + 2,
            width: cropDisplay.w - 4,
            height: cropDisplay.h - 4,
          }}
          onMouseDown={(e) => handleMouseDown(e, 'move')}
        />

        {/* Corner handles */}
        {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => {
          const isLeft = corner.includes('l');
          const isTop = corner.includes('t');
          return (
            <div
              key={corner}
              className="absolute bg-white border-2 border-blue-500 rounded-sm shadow-md"
              style={{
                width: handleSize,
                height: handleSize,
                left: isLeft ? cropDisplay.x - handleSize / 2 : cropDisplay.x + cropDisplay.w - handleSize / 2,
                top: isTop ? cropDisplay.y - handleSize / 2 : cropDisplay.y + cropDisplay.h - handleSize / 2,
                cursor: corner === 'tl' || corner === 'br' ? 'nwse-resize' : 'nesw-resize',
              }}
              onMouseDown={(e) => handleMouseDown(e, `resize-${corner}` as typeof dragMode)}
            />
          );
        })}

        {/* Focal point */}
        <div
          className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-10"
          style={{ left: fpDisplay.x, top: fpDisplay.y }}
          onMouseDown={(e) => handleMouseDown(e, 'focal')}
        >
          <div className="w-full h-full rounded-full border-2 border-orange-400 bg-orange-500/30 shadow-lg flex items-center justify-center">
            <Move className="w-2.5 h-2.5 text-orange-200" />
          </div>
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] text-orange-300 font-bold whitespace-nowrap">
            FOCAL
          </div>
        </div>

        {/* Info box */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-3 py-1.5 rounded-lg text-[10px] text-gray-300 flex items-center gap-3 backdrop-blur-sm">
          <span>Crop: {Math.round(crop.x * 100)}%, {Math.round(crop.y * 100)}% → {Math.round(crop.width * 100)}% × {Math.round(crop.height * 100)}%</span>
          <span className="text-gray-500">|</span>
          <span className="text-orange-300">Focal: {Math.round(focalPoint.x * 100)}%, {Math.round(focalPoint.y * 100)}%</span>
        </div>
      </div>
    </div>
  );
};

import React, { useRef, useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize,
  ArrowRightLeft,
  CheckCircle2,
  Layers,
  Ruler,
  EyeOff,
} from 'lucide-react';
import {
  ASPECT_RATIOS,
  AspectRatioKey,
  AssetGroup,
  GeneratedVariation,
  MasterTemplate,
  ResolvedLayerValue,
  TemplateLayer,
} from '../types';
import { renderVariationOnCanvas } from '../utils/canvasRenderer';

interface CanvasAreaProps {
  template: MasterTemplate;
  assetGroup: AssetGroup;
  selectedRatio: AspectRatioKey;
  variations: GeneratedVariation[];
  currentVariationIndex: number;
  selectedLayerId: string | null;
  onSelectVariationIndex: (index: number) => void;
  onSelectRatio: (ratio: AspectRatioKey) => void;
  onSelectLayer: (layerId: string | null) => void;
  onUpdateLayerPosition: (
    layerId: string,
    ratio: AspectRatioKey,
    updates: Partial<TemplateLayer['positionsByRatio'][AspectRatioKey]>
  ) => void;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  template,
  assetGroup,
  selectedRatio,
  variations,
  currentVariationIndex,
  selectedLayerId,
  onSelectVariationIndex,
  onSelectRatio,
  onSelectLayer,
  onUpdateLayerPosition,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [showRulers, setShowRulers] = useState<boolean>(true);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; layerX: number; layerY: number; layerW: number; layerH: number } | null>(null);

  // Custom draggable guides
  const [customGuides, setCustomGuides] = useState<{ id: string; axis: 'h' | 'v'; position: number }[]>([]);
  const [draggingGuide, setDraggingGuide] = useState<{ id: string; axis: 'h' | 'v'; startY: number; startX: number; canvasRect: DOMRect } | null>(null);

  const meta = ASPECT_RATIOS[selectedRatio] || ASPECT_RATIOS['1:1'];
  const currentVariation = variations[currentVariationIndex] || variations[0];

  // Render on canvas whenever variation, template, ratio or asset group changes
  useEffect(() => {
    if (!canvasRef.current || !currentVariation) return;
    renderVariationOnCanvas(canvasRef.current, currentVariation, template, selectedRatio, 1080);
  }, [currentVariation, template, selectedRatio, assetGroup]);

  // Adjust zoom to fit container on mount or ratio change
  useEffect(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const padding = 64;
    const availableW = clientWidth - padding;
    const availableH = clientHeight - padding;

    const scaleW = availableW / meta.width;
    const scaleH = availableH / meta.height;
    const fitScale = Math.min(scaleW, scaleH, 0.7);
    setZoomScale(fitScale);
  }, [selectedRatio]);

  // Handle Layer Selection & Dragging on Canvas Overlay
  const selectedLayer = template.layers.find((l) => l.id === selectedLayerId);
  const selectedPos = selectedLayer
    ? selectedLayer.positionsByRatio[selectedRatio] || selectedLayer.positionsByRatio['1:1']
    : null;

  const handleMouseDown = (e: React.MouseEvent, layer: TemplateLayer, isResizeHandle = false) => {
    e.stopPropagation();
    onSelectLayer(layer.id);

    const pos = layer.positionsByRatio[selectedRatio] || layer.positionsByRatio['1:1'];
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      layerX: pos.x,
      layerY: pos.y,
      layerW: pos.width,
      layerH: pos.height,
    });

    if (isResizeHandle) {
      setIsResizing(true);
    } else {
      setIsDragging(true);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStart || !selectedLayerId) return;

      const deltaX = (e.clientX - dragStart.x) / zoomScale;
      const deltaY = (e.clientY - dragStart.y) / zoomScale;

      const deltaPercentX = (deltaX / meta.width) * 100;
      const deltaPercentY = (deltaY / meta.height) * 100;

      if (isDragging) {
        const isBackground = selectedLayer?.folderType === 'background';
        const newX = isBackground
          ? Math.max(0, Math.min(100 - dragStart.layerW, dragStart.layerX + deltaPercentX))
          : Math.round((dragStart.layerX + deltaPercentX) * 100) / 100;
        const newY = isBackground
          ? Math.max(0, Math.min(100 - dragStart.layerH, dragStart.layerY + deltaPercentY))
          : Math.round((dragStart.layerY + deltaPercentY) * 100) / 100;
        onUpdateLayerPosition(selectedLayerId, selectedRatio, { x: newX, y: newY });
      } else if (isResizing) {
        const newW = Math.max(5, dragStart.layerW + deltaPercentX);
        const newH = Math.max(5, dragStart.layerH + deltaPercentY);
        onUpdateLayerPosition(selectedLayerId, selectedRatio, { width: newW, height: newH });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setDragStart(null);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, selectedLayerId, selectedLayer, selectedRatio, meta, zoomScale, onUpdateLayerPosition]);

  // Guide drag from ruler
  useEffect(() => {
    if (!draggingGuide) return;
    const handleGuideMove = (e: MouseEvent) => {
      const rect = draggingGuide.canvasRect;
      if (draggingGuide.axis === 'h') {
        const relY = e.clientY - rect.top;
        const pct = (relY / rect.height) * 100;
        setCustomGuides((prev) =>
          prev.map((g) => (g.id === draggingGuide.id ? { ...g, position: Math.round(pct * 10) / 10 } : g))
        );
      } else {
        const relX = e.clientX - rect.left;
        const pct = (relX / rect.width) * 100;
        setCustomGuides((prev) =>
          prev.map((g) => (g.id === draggingGuide.id ? { ...g, position: Math.round(pct * 10) / 10 } : g))
        );
      }
    };
    const handleGuideUp = (e: MouseEvent) => {
      const rect = draggingGuide.canvasRect;
      // Remove if dragged outside canvas bounds
      const inside = draggingGuide.axis === 'h'
        ? e.clientY >= rect.top && e.clientY <= rect.bottom
        : e.clientX >= rect.left && e.clientX <= rect.right;
      if (!inside) {
        setCustomGuides((prev) => prev.filter((g) => g.id !== draggingGuide.id));
      }
      setDraggingGuide(null);
      document.body.style.cursor = '';
    };
    document.body.style.cursor = draggingGuide.axis === 'h' ? 'row-resize' : 'col-resize';
    window.addEventListener('mousemove', handleGuideMove);
    window.addEventListener('mouseup', handleGuideUp);
    return () => {
      window.removeEventListener('mousemove', handleGuideMove);
      window.removeEventListener('mouseup', handleGuideUp);
    };
  }, [draggingGuide]);

  const startGuideDrag = (axis: 'h' | 'v', e: React.MouseEvent) => {
    e.stopPropagation();
    const canvasEl = canvasWrapperRef.current;
    if (!canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();
    const id = `guide_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const pct = axis === 'h'
      ? ((e.clientY - rect.top) / rect.height) * 100
      : ((e.clientX - rect.left) / rect.width) * 100;
    setCustomGuides((prev) => [...prev, { id, axis, position: Math.round(pct * 10) / 10 }]);
    setDraggingGuide({ id, axis, startY: e.clientY, startX: e.clientX, canvasRect: rect });
  };

  return (
    <main
      id="main-canvas-panel"
      className="flex-1 flex flex-col h-full bg-[#F0F1F3] overflow-hidden relative select-none"
    >
      {/* Canvas Top Bar: Ratio Tabs & Variation Navigation */}
      <div className="h-12 border-b border-gray-100 bg-white px-5 flex items-center justify-between gap-4 z-10">
        {/* Aspect Ratio Tabs */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold text-gray-400 mr-1 hidden sm:inline">
            Formato:
          </span>
          {template.activeAspectRatios.map((rKey) => {
            const isSelected = selectedRatio === rKey;
            const rMeta = ASPECT_RATIOS[rKey];
            return (
              <button
                key={rKey}
                onClick={() => onSelectRatio(rKey)}
                className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <span>{rMeta.label}</span>
                <span className={`text-[10px] font-mono ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                  {rMeta.width}×{rMeta.height}
                </span>
              </button>
            );
          })}
        </div>

        {/* Variation Navigator */}
        <div className="flex items-center gap-2">
          {variations.length > 0 ? (
            <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-xs">
              <span className="text-[11px] text-gray-500 font-medium">
                Variation{' '}
                <span className="text-blue-600 font-mono font-bold">
                  #{currentVariationIndex + 1}
                </span>{' '}
                de <span className="font-mono text-gray-700">{variations.length}</span>
              </span>

              <div className="flex items-center gap-1">
                <button
                  disabled={currentVariationIndex === 0}
                  onClick={() => onSelectVariationIndex(Math.max(0, currentVariationIndex - 1))}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent text-gray-700 transition-colors"
                  title="Variation anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <button
                  disabled={currentVariationIndex >= variations.length - 1}
                  onClick={() =>
                    onSelectVariationIndex(Math.min(variations.length - 1, currentVariationIndex + 1))
                  }
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent text-gray-700 transition-colors"
                  title="Next variation"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <span className="text-xs text-amber-600 font-medium">0 variations (check folders)</span>
          )}

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-gray-200 shadow-xs">
            <button
              onClick={() => setZoomScale((s) => Math.max(0.15, s - 0.08))}
              className="p-1 rounded hover:bg-gray-100 text-gray-700"
              title="Alejar"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-gray-500 px-1 w-10 text-center">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => setZoomScale((s) => Math.min(1.2, s + 0.08))}
              className="p-1 rounded hover:bg-gray-100 text-gray-700"
              title="Acercar"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Rulers Toggle */}
          <button
            onClick={() => setShowRulers((v) => !v)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              showRulers
                ? 'bg-blue-50 border-blue-200 text-blue-600'
                : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600'
            }`}
            title={showRulers ? 'Hide guides' : 'Show guides'}
          >
            <Ruler className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Variation Resolved Highlights Banner */}
      {currentVariation && currentVariation.branchDescription && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-1.5 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2 truncate">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="font-semibold text-blue-700">Conditional Resolution:</span>
            <span className="text-blue-900/90 truncate">{currentVariation.branchDescription}</span>
          </div>

          {/* Contrast badges if any */}
          {(Object.values(currentVariation.resolvedLayers) as ResolvedLayerValue[]).some((l) => l.contrastCorrected) && (
            <span className="flex items-center gap-1 bg-blue-100/80 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-200">
              <ArrowRightLeft className="w-3 h-3" />
              Contrast automatically adjusted
            </span>
          )}
        </div>
      )}

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        onClick={() => onSelectLayer(null)}
        className="flex-1 overflow-auto flex items-center justify-center p-8 relative bg-[#E5E7EB]"
        style={{
          backgroundImage:
            'radial-gradient(#CBD5E1 1.5px, transparent 1.5px), radial-gradient(#CBD5E1 1.5px, transparent 1.5px)',
          backgroundSize: '32px 32px',
          backgroundPosition: '0 0, 16px 16px',
        }}
      >
        <div
          ref={canvasWrapperRef}
          className="relative shadow-2xl transition-transform origin-center"
          style={{
            width: `${meta.width * zoomScale}px`,
            height: `${meta.height * zoomScale}px`,
          }}
        >
          {/* Horizontal Ruler (Top) — drag down to create horizontal guide */}
          {showRulers && (
            <div
              className="absolute -top-5 left-0 h-5 bg-white/90 backdrop-blur-sm border-b border-gray-300 select-none overflow-hidden z-20 cursor-row-resize"
              style={{ width: `${meta.width * zoomScale}px` }}
              onMouseDown={(e) => startGuideDrag('h', e)}
            >
              {Array.from({ length: 21 }, (_, i) => {
                const pct = i * 5;
                const isMajor = pct % 10 === 0;
                return (
                  <div
                    key={`h-${pct}`}
                    className="absolute top-0 flex flex-col items-center"
                    style={{ left: `${pct}%` }}
                  >
                    <div
                      className={`w-px ${
                        isMajor ? 'h-5 bg-gray-400' : 'h-2.5 bg-gray-300'
                      }`}
                    />
                    {isMajor && (
                      <span className="absolute top-0.5 text-[8px] font-mono text-gray-500 leading-none" style={{ transform: 'translateX(-50%)' }}>
                        {pct}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Vertical Ruler (Left) — drag right to create vertical guide */}
          {showRulers && (
            <div
              className="absolute top-0 -left-5 w-5 bg-white/90 backdrop-blur-sm border-r border-gray-300 select-none overflow-hidden z-20 cursor-col-resize"
              style={{ height: `${meta.height * zoomScale}px` }}
              onMouseDown={(e) => startGuideDrag('v', e)}
            >
              {Array.from({ length: 21 }, (_, i) => {
                const pct = i * 5;
                const isMajor = pct % 10 === 0;
                return (
                  <div
                    key={`v-${pct}`}
                    className="absolute left-0 flex items-center"
                    style={{ top: `${pct}%` }}
                  >
                    <div
                      className={`h-px ${
                        isMajor ? 'w-5 bg-gray-400' : 'w-2.5 bg-gray-300'
                      }`}
                    />
                    {isMajor && (
                      <span className="absolute left-0.5 text-[8px] font-mono text-gray-500 leading-none" style={{ transform: 'translateY(-50%) rotate(-90deg)', transformOrigin: '0 50%', whiteSpace: 'nowrap', marginLeft: '2px' }}>
                        {pct}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Corner square (intersection of rulers) */}
          {showRulers && (
            <div className="absolute -top-5 -left-5 w-5 h-5 bg-white/90 backdrop-blur-sm border-b border-r border-gray-300 z-20" />
          )}

          {/* Guide lines overlay (dashed lines at 25%, 50%, 75%) */}
          {showRulers && (
            <div className="absolute inset-0 pointer-events-none z-[5]">
              {[25, 50, 75].map((pct) => (
                <React.Fragment key={`guides-${pct}`}>
                  {/* Vertical guide */}
                  <div
                    className="absolute top-0 bottom-0 w-px"
                    style={{
                      left: `${pct}%`,
                      background: pct === 50 ? 'rgba(59,130,246,0.25)' : 'rgba(148,163,184,0.2)',
                      backgroundImage: pct === 50
                        ? 'repeating-linear-gradient(to bottom, rgba(59,130,246,0.25) 0px, rgba(59,130,246,0.25) 4px, transparent 4px, transparent 8px)'
                        : 'repeating-linear-gradient(to bottom, rgba(148,163,184,0.2) 0px, rgba(148,163,184,0.2) 4px, transparent 4px, transparent 8px)',
                      backgroundSize: '1px 8px',
                      backgroundColor: 'transparent',
                    }}
                  />
                  {/* Horizontal guide */}
                  <div
                    className="absolute left-0 right-0 h-px"
                    style={{
                      top: `${pct}%`,
                      background: pct === 50 ? 'rgba(59,130,246,0.25)' : 'rgba(148,163,184,0.2)',
                      backgroundImage: pct === 50
                        ? 'repeating-linear-gradient(to right, rgba(59,130,246,0.25) 0px, rgba(59,130,246,0.25) 4px, transparent 4px, transparent 8px)'
                        : 'repeating-linear-gradient(to right, rgba(148,163,184,0.2) 0px, rgba(148,163,184,0.2) 4px, transparent 4px, transparent 8px)',
                      backgroundSize: '8px 1px',
                      backgroundColor: 'transparent',
                    }}
                  />
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Custom Guides (user-created by dragging from rulers) */}
          {showRulers && customGuides.map((guide) => (
            guide.axis === 'h' ? (
              <div
                key={guide.id}
                className="absolute left-0 right-0 z-[35] group"
                style={{ top: `${guide.position}%` }}
              >
                <div
                  className="h-px w-full"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(to right, #06B6D4 0px, #06B6D4 6px, transparent 6px, transparent 12px)',
                    backgroundSize: '12px 1px',
                  }}
                />
                <div
                  className="absolute -top-2 left-0 right-0 h-4 cursor-row-resize"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setCustomGuides((prev) => prev.filter((g) => g.id !== guide.id));
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const canvasEl = canvasWrapperRef.current;
                    if (!canvasEl) return;
                    setDraggingGuide({ id: guide.id, axis: 'h', startY: e.clientY, startX: e.clientX, canvasRect: canvasEl.getBoundingClientRect() });
                  }}
                />
                <span className="absolute -left-1 -top-2.5 text-[8px] font-mono text-cyan-600 bg-white/80 px-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {guide.position}%
                </span>
              </div>
            ) : (
              <div
                key={guide.id}
                className="absolute top-0 bottom-0 z-[35] group"
                style={{ left: `${guide.position}%` }}
              >
                <div
                  className="w-px h-full"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(to bottom, #06B6D4 0px, #06B6D4 6px, transparent 6px, transparent 12px)',
                    backgroundSize: '1px 12px',
                  }}
                />
                <div
                  className="absolute top-0 -left-2 w-4 h-full cursor-col-resize"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setCustomGuides((prev) => prev.filter((g) => g.id !== guide.id));
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const canvasEl = canvasWrapperRef.current;
                    if (!canvasEl) return;
                    setDraggingGuide({ id: guide.id, axis: 'v', startY: e.clientY, startX: e.clientX, canvasRect: canvasEl.getBoundingClientRect() });
                  }}
                />
                <span className="absolute top-0 -left-1 -top-3 text-[8px] font-mono text-cyan-600 bg-white/80 px-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {guide.position}%
                </span>
              </div>
            )
          ))}

          {/* HTML5 Canvas Rendering */}
          <canvas
            ref={canvasRef}
            width={meta.width}
            height={meta.height}
            className="w-full h-full block rounded-lg shadow-2xl bg-white select-none pointer-events-none border-4 border-white"
          />

          {/* Empty Template Placeholder */}
          {template.layers.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-20 pointer-events-none bg-white/70 backdrop-blur-xs rounded-lg">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-3 shadow-xs">
                <Layers className="w-6 h-6" />
              </div>
              <div className="font-bold text-gray-900 text-sm mb-1">
                Blank Canvas ({meta.label})
              </div>
              <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                Add layers from the left panel (Backgrounds, Logos, Products or Texts) to start composing your design.
              </p>
            </div>
          )}

          {/* Interactive Bounding Box Overlays for Layers */}
          {template.layers.map((layer) => {
            if (!layer.visible) return null;
            const isSelected = layer.id === selectedLayerId;
            const pos = layer.positionsByRatio[selectedRatio] || layer.positionsByRatio['1:1'];

            return (
              <div
                key={layer.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectLayer(layer.id);
                }}
                onMouseDown={(e) => handleMouseDown(e, layer, false)}
                className={`absolute cursor-move transition-colors group ${
                  isSelected
                    ? 'ring-2 ring-blue-500 bg-blue-500/10'
                    : 'hover:ring-1 hover:ring-blue-400/60'
                }`}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  width: `${pos.width}%`,
                  height: `${pos.height}%`,
                  zIndex: isSelected ? 30 : 10,
                }}
              >
                {/* Layer Name Label on Hover or Select */}
                {(isSelected || false) && (
                  <div className="absolute -top-5 left-0 bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap shadow-xs pointer-events-none flex items-center gap-1">
                    <span>{layer.name}</span>
                    {layer.folderType.startsWith('logo') && pos.scale && pos.scale !== 100 && (
                      <span className="bg-blue-800/80 px-1 py-0.2 rounded text-[9px] font-mono">
                        Scale: {pos.scale}%
                      </span>
                    )}
                    <span className="text-blue-200 font-mono text-[9px]">
                      ({Math.round(pos.width)}% × {Math.round(pos.height)}%)
                    </span>
                  </div>
                )}

                {/* Anchor Point Visual Indicator on Canvas */}
                {isSelected && (layer.folderType.startsWith('logo') || layer.folderType.startsWith('texto')) && (
                  <div
                    className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 z-40 flex items-center justify-center"
                    style={{
                      left:
                        (pos.anchorPoint || 'center').includes('left')
                          ? '0%'
                          : (pos.anchorPoint || 'center').includes('right')
                          ? '100%'
                          : '50%',
                      top:
                        (pos.anchorPoint || 'center').includes('top')
                          ? '0%'
                          : (pos.anchorPoint || 'center').includes('bottom')
                          ? '100%'
                          : '50%',
                    }}
                    title={`Anchor point: ${pos.anchorPoint || 'center'}`}
                  >
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white bg-blue-600 shadow-md ring-1 ring-blue-400 flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-white" />
                    </div>
                  </div>
                )}

                {/* Resize Handle (Bottom-Right corner) */}
                {isSelected && (
                  <div
                    onMouseDown={(e) => handleMouseDown(e, layer, true)}
                    className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-sm cursor-nwse-resize shadow-xs"
                  />
                )}

                {/* Focal Point Visual Indicator on Canvas (background only) */}
                {isSelected && layer.folderType === 'background' && (
                  <div
                    className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 z-40"
                    style={{
                      left: `${(pos.focalPoint?.x ?? 0.5) * 100}%`,
                      top: `${(pos.focalPoint?.y ?? 0.5) * 100}%`,
                    }}
                    title={`Subject position: ${Math.round((pos.focalPoint?.x ?? 0.5) * 100)}%, ${Math.round((pos.focalPoint?.y ?? 0.5) * 100)}%`}
                  >
                    <div className="w-3 h-3 rounded-full border-2 border-orange-500 bg-orange-400/30 shadow-md ring-1 ring-orange-300 flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-orange-600" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
};

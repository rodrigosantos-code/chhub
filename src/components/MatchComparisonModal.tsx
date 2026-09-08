import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Eye, Layers, RotateCcw, Check, AlertTriangle } from 'lucide-react';
import { AssetItem } from '../types';
import { analyzeAlpha, drawNormalized, normalizeImageToDataUrl, AlphaAnalysis } from '../utils/alphaAnalysis';

interface MatchComparisonModalProps {
  items: AssetItem[];
  folderLabel: string;
  onClose: () => void;
  onApplyNormalized: (updatedItems: AssetItem[]) => void;
}

const CANVAS_SIZE = 500;
const TARGET_RADIUS = 120;

type BlendMode = 'normal' | 'difference';

interface AnalyzedItem {
  item: AssetItem;
  analysis: AlphaAnalysis;
  img: HTMLImageElement;
  normalizedUrl: string;
}

export const MatchComparisonModal: React.FC<MatchComparisonModalProps> = ({
  items,
  folderLabel,
  onClose,
  onApplyNormalized,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [analyzedItems, setAnalyzedItems] = useState<AnalyzedItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [itemA, setItemA] = useState<string>('');
  const [itemB, setItemB] = useState<string>('');
  const [opacity, setOpacity] = useState(0.5);
  const [blendMode, setBlendMode] = useState<BlendMode>('normal');
  const [applied, setApplied] = useState(false);

  // Analyze + auto-normalize all items on mount
  useEffect(() => {
    let cancelled = false;
    setIsAnalyzing(true);

    const run = async () => {
      const results: AnalyzedItem[] = [];

      // Step 1: Analyze all items
      for (const item of items) {
        if (!item.url) continue;
        try {
          const analysis = await analyzeAlpha(item.url);
          if (cancelled) return;

          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = item.url;
          });
          if (cancelled) return;

          results.push({ item, analysis, img, normalizedUrl: '' });
        } catch (err) {
          console.warn(`[Matcheo] Failed to analyze ${item.name}:`, err);
        }
      }

      if (cancelled || results.length === 0) return;

      // Step 2: Compute target radius (average RMS across all items)
      const avgRadius =
        results.reduce((sum, r) => sum + r.analysis.rmsRadius, 0) / results.length;
      // Use a fraction of the average image dimension as target
      const avgDim = results.reduce((sum, r) => sum + Math.min(r.analysis.width, r.analysis.height), 0) / results.length;
      const targetRadius = avgDim * 0.25; // 25% of average smallest dimension

      // Step 3: Generate normalized versions
      for (const r of results) {
        r.normalizedUrl = normalizeImageToDataUrl(r.img, r.analysis, targetRadius);
      }

      if (!cancelled) {
        setAnalyzedItems(results);
        if (results.length >= 1) setItemA(results[0].item.id);
        if (results.length >= 2) setItemB(results[1].item.id);
        setIsAnalyzing(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [items]);

  // Draw comparison using NORMALIZED versions
  const drawComparison = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Checkerboard background
    const sq = 20;
    for (let y = 0; y < CANVAS_SIZE; y += sq) {
      for (let x = 0; x < CANVAS_SIZE; x += sq) {
        ctx.fillStyle = ((x / sq + y / sq) % 2 === 0) ? '#f0f0f0' : '#e0e0e0';
        ctx.fillRect(x, y, sq, sq);
      }
    }

    const aData = analyzedItems.find((r) => r.item.id === itemA);
    const bData = analyzedItems.find((r) => r.item.id === itemB);

    // Draw normalized A
    if (aData) {
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      const avgDim = analyzedItems.reduce((sum, r) => sum + Math.min(r.analysis.width, r.analysis.height), 0) / analyzedItems.length;
      const targetRadius = avgDim * 0.25;
      drawNormalized(ctx, aData.img, aData.analysis, CANVAS_SIZE, TARGET_RADIUS);
    }

    // Draw normalized B
    if (bData && itemA !== itemB) {
      ctx.globalAlpha = opacity;
      ctx.globalCompositeOperation = blendMode === 'difference' ? 'difference' : 'source-over';
      drawNormalized(ctx, bData.img, bData.analysis, CANVAS_SIZE, TARGET_RADIUS);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // Crosshair
    ctx.strokeStyle = 'rgba(255, 100, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_SIZE / 2, 0);
    ctx.lineTo(CANVAS_SIZE / 2, CANVAS_SIZE);
    ctx.moveTo(0, CANVAS_SIZE / 2);
    ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [itemA, itemB, opacity, blendMode, analyzedItems]);

  useEffect(() => {
    drawComparison();
  }, [drawComparison]);

  const handleApply = () => {
    const updatedItems = items.map((item) => {
      const analyzed = analyzedItems.find((a) => a.item.id === item.id);
      if (analyzed && analyzed.normalizedUrl) {
        return { ...item, url: analyzed.normalizedUrl };
      }
      return item;
    });
    onApplyNormalized(updatedItems);
    setApplied(true);
    // Auto-close after brief feedback
    setTimeout(() => onClose(), 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-600" />
              Matcheo Visual — {folderLabel}
            </h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Las imágenes se normalizan automáticamente por centroide y tamaño (canal alfa)
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {isAnalyzing ? (
            <div className="flex items-center justify-center py-12 text-gray-500 text-sm gap-2">
              <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              Analizando y normalizando {items.length} imagen(es)...
            </div>
          ) : (
            <>
              {/* Thumbnails — before vs after */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block">
                  Resultado de normalización ({analyzedItems.length} imágenes)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {analyzedItems.map((a) => (
                    <div key={a.item.id} className="bg-gray-50 border border-gray-200 rounded-lg p-1.5 text-center">
                      <div className="flex gap-1 mb-1">
                        <div className="flex-1 relative">
                          <img src={a.item.url} alt="" className="w-full aspect-square object-contain bg-gray-100 rounded" />
                          <span className="absolute top-0.5 left-0.5 bg-gray-800/70 text-white text-[8px] px-1 rounded">Orig.</span>
                        </div>
                        <div className="flex-1 relative">
                          <img src={a.normalizedUrl} alt="" className="w-full aspect-square object-contain bg-gray-100 rounded" />
                          <span className="absolute top-0.5 left-0.5 bg-violet-600/80 text-white text-[8px] px-1 rounded">Norm.</span>
                        </div>
                      </div>
                      <div className="text-[9px] text-gray-600 font-medium truncate">{a.item.name}</div>
                      <div className="text-[8px] text-gray-400">
                        C: {Math.round(a.analysis.centroidX * 100)}%,{Math.round(a.analysis.centroidY * 100)}%
                        | R: {Math.round(a.analysis.rmsRadius)}px
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comparison selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Imagen A (base)</label>
                  <select
                    value={itemA}
                    onChange={(e) => setItemA(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium text-gray-800 cursor-pointer"
                  >
                    {analyzedItems.map((a) => (
                      <option key={a.item.id} value={a.item.id}>{a.item.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Imagen B (superpuesta)</label>
                  <select
                    value={itemB}
                    onChange={(e) => setItemB(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium text-gray-800 cursor-pointer"
                  >
                    {analyzedItems.map((a) => (
                      <option key={a.item.id} value={a.item.id}>{a.item.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Canvas */}
              <div className="flex justify-center">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  className="rounded-xl border border-gray-300 shadow-inner"
                  style={{ width: Math.min(CANVAS_SIZE, 400), height: Math.min(CANVAS_SIZE, 400) }}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    Opacidad B: {Math.round(opacity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    className="w-full accent-violet-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-gray-200">
                  <button
                    onClick={() => setBlendMode('normal')}
                    className={`px-3 py-1.5 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                      blendMode === 'normal'
                        ? 'bg-violet-600 text-white font-bold shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => setBlendMode('difference')}
                    className={`px-3 py-1.5 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                      blendMode === 'difference'
                        ? 'bg-violet-600 text-white font-bold shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Diferencia
                  </button>
                </div>

                <button
                  onClick={() => { setOpacity(0.5); setBlendMode('normal'); }}
                  className="p-2 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700 cursor-pointer"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Apply button */}
              <div className="flex items-center justify-between bg-violet-50 border border-violet-200 rounded-xl p-3">
                <div className="text-[11px] text-violet-700">
                  <strong>¿Aplicar normalización?</strong> Se reemplazarán las imágenes originales con las versiones centradas y escaladas.
                </div>
                {applied ? (
                  <div className="flex items-center gap-1.5 text-green-700 font-bold text-xs bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                    <Check className="w-4 h-4" />
                    Aplicado
                  </div>
                ) : (
                  <button
                    onClick={handleApply}
                    className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-xs shrink-0"
                  >
                    <Check className="w-4 h-4" />
                    Aplicar Matcheo
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

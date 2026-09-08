import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Eye, Layers, RotateCcw } from 'lucide-react';
import { AssetItem } from '../types';
import { analyzeAlpha, drawNormalized, AlphaAnalysis } from '../utils/alphaAnalysis';

interface MatchComparisonModalProps {
  items: AssetItem[];
  folderLabel: string;
  onClose: () => void;
}

const CANVAS_SIZE = 500;
const TARGET_RADIUS = 120; // normalized RMS radius in canvas pixels

type BlendMode = 'normal' | 'difference';

export const MatchComparisonModal: React.FC<MatchComparisonModalProps> = ({
  items,
  folderLabel,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [analyses, setAnalyses] = useState<Map<string, AlphaAnalysis>>(new Map());
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const [itemA, setItemA] = useState<string>(items[0]?.id || '');
  const [itemB, setItemB] = useState<string>(items[1]?.id || '');
  const [opacity, setOpacity] = useState(0.5);
  const [blendMode, setBlendMode] = useState<BlendMode>('normal');
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  // Analyze all items on mount
  useEffect(() => {
    let cancelled = false;
    setIsAnalyzing(true);

    const analyze = async () => {
      const newAnalyses = new Map<string, AlphaAnalysis>();
      const newImages = new Map<string, HTMLImageElement>();

      for (const item of items) {
        if (!item.url) continue;
        try {
          const analysis = await analyzeAlpha(item.url);
          if (cancelled) return;
          newAnalyses.set(item.id, analysis);

          // Pre-load image
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = item.url;
          });
          if (cancelled) return;
          newImages.set(item.id, img);
        } catch (err) {
          console.warn(`[MatchComparison] Failed to analyze ${item.name}:`, err);
        }
      }

      if (!cancelled) {
        setAnalyses(newAnalyses);
        setLoadedImages(newImages);
        setIsAnalyzing(false);
      }
    };

    analyze();
    return () => { cancelled = true; };
  }, [items]);

  // Draw comparison
  const drawComparison = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw checkerboard background for transparency
    const sq = 20;
    for (let y = 0; y < CANVAS_SIZE; y += sq) {
      for (let x = 0; x < CANVAS_SIZE; x += sq) {
        ctx.fillStyle = ((x / sq + y / sq) % 2 === 0) ? '#f0f0f0' : '#e0e0e0';
        ctx.fillRect(x, y, sq, sq);
      }
    }

    const analysisA = analyses.get(itemA);
    const analysisB = analyses.get(itemB);
    const imgA = loadedImages.get(itemA);
    const imgB = loadedImages.get(itemB);

    if (!analysisA || !imgA) return;

    // Draw A at full opacity
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    drawNormalized(ctx, imgA, analysisA, CANVAS_SIZE, TARGET_RADIUS);

    // Draw B with blend
    if (analysisB && imgB && itemA !== itemB) {
      ctx.globalAlpha = opacity;
      ctx.globalCompositeOperation = blendMode === 'difference' ? 'difference' : 'source-over';
      drawNormalized(ctx, imgB, analysisB, CANVAS_SIZE, TARGET_RADIUS);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // Draw crosshair at center
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
  }, [itemA, itemB, opacity, blendMode, analyses, loadedImages]);

  useEffect(() => {
    drawComparison();
  }, [drawComparison]);

  const validItems = items.filter((i) => i.url);

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
              Compara el centrado y tamaño de las imágenes normalizadas por su canal alfa
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
              Analizando canal alfa de {items.length} imagen(es)...
            </div>
          ) : (
            <>
              {/* Item selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Imagen A (base)</label>
                  <select
                    value={itemA}
                    onChange={(e) => setItemA(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium text-gray-800 cursor-pointer"
                  >
                    {validItems.map((i) => (
                      <option key={i.id} value={i.id}>{i.name}</option>
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
                    {validItems.map((i) => (
                      <option key={i.id} value={i.id}>{i.name}</option>
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
                  style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
                {/* Opacity slider */}
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

                {/* Blend mode */}
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

                {/* Reset */}
                <button
                  onClick={() => { setOpacity(0.5); setBlendMode('normal'); }}
                  className="p-2 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700 cursor-pointer"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Analysis info */}
              <div className="grid grid-cols-2 gap-3">
                {[itemA, itemB].map((itemId, idx) => {
                  const analysis = analyses.get(itemId);
                  const item = items.find((i) => i.id === itemId);
                  if (!analysis || !item) return null;
                  return (
                    <div key={itemId} className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-[10px] text-gray-600 space-y-0.5">
                      <div className="font-bold text-gray-800 text-xs">{idx === 0 ? 'A' : 'B'}: {item.name}</div>
                      <div>Centroide: <span className="font-mono font-bold text-gray-700">{Math.round(analysis.centroidX * 100)}%, {Math.round(analysis.centroidY * 100)}%</span></div>
                      <div>Radio RMS: <span className="font-mono font-bold text-gray-700">{Math.round(analysis.rmsRadius)}px</span></div>
                      <div>Tamaño: <span className="font-mono text-gray-700">{analysis.width}×{analysis.height}</span></div>
                    </div>
                  );
                })}
              </div>

              <div className="text-[10px] text-gray-500 bg-gray-50 p-2.5 rounded border border-gray-200 leading-relaxed">
                <strong>Cómo funciona:</strong> Cada imagen se analiza por su canal alfa. Se calcula el <strong>centroide</strong> (promedio ponderado de píxeles opacos) y el <strong>radio RMS</strong> (tamaño del contenido). Ambas se normalizan al mismo tamaño y posición central para comparar visualmente. En modo <strong>Diferencia</strong>, las zonas coincidentes se ven negras.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Download,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  FileArchive,
  Calculator,
  Grid,
  Maximize2,
  ArrowRight,
  Folder,
} from 'lucide-react';
import {
  ASPECT_RATIOS,
  AssetGroup,
  GeneratedVariation,
  MasterTemplate,
  ResolvedLayerValue,
  VariationCalculationReport,
} from '../../types';
import { exportAllVariationsZip, getRatioFolderName } from '../../utils/canvasRenderer';

interface ExportTabProps {
  template: MasterTemplate;
  assetGroup: AssetGroup;
  variations: GeneratedVariation[];
  report: VariationCalculationReport;
  currentVariationIndex: number;
  onSelectVariationIndex: (index: number) => void;
  projectName: string;
}

export const ExportTab: React.FC<ExportTabProps> = ({
  template,
  assetGroup,
  variations,
  report,
  currentVariationIndex,
  onSelectVariationIndex,
  projectName,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number; message: string } | null>(null);
  const [exportComplete, setExportComplete] = useState(false);

  const numVariations = report.totalVariationsCount;
  const numFormats = template.activeAspectRatios.length;
  const totalFiles = numVariations * numFormats;

  const handleExportZip = async () => {
    if (variations.length === 0 || report.errors.length > 0) return;

    try {
      setIsExporting(true);
      setExportComplete(false);

      const zipBlob = await exportAllVariationsZip(
        template,
        assetGroup,
        variations,
        projectName,
        (current, total, message) => {
          setExportProgress({ current, total, message });
        }
      );

      // Download file in browser
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      const safeProject = projectName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const safeAssetGroup = assetGroup.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      link.download = `${safeProject}_${safeAssetGroup}_${numVariations}vars.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportComplete(true);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-3 text-xs space-y-4 bg-white text-gray-800">
      {/* Error alert if any */}
      {report.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-red-900">Error de dinamización</div>
            <ul className="list-disc list-inside text-[11px] text-red-700 mt-1 space-y-0.5">
              {report.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Main Metric Banner (Section 9.1 & 9.2) */}
      <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="text-[10px] uppercase font-bold text-blue-600 tracking-wider flex items-center gap-1.5 mb-1">
            <Calculator className="w-3.5 h-3.5" />
            Cálculo Oficial de Exportación (Sección 9)
          </div>

          <div className="text-2xl font-black text-gray-900 font-mono tracking-tight flex items-baseline gap-2">
            <span>{numVariations} variaciones</span>
            <span className="text-gray-400 text-base font-normal">×</span>
            <span className="text-gray-700 text-base font-semibold">{numFormats} formatos</span>
            <span className="text-gray-400 text-base font-normal">=</span>
            <span className="text-blue-600 text-xl font-bold">{totalFiles} archivos finales</span>
          </div>

          <p className="text-[11px] text-gray-600 mt-1">
            Exportación organizada <strong className="text-gray-900 font-semibold">por ratios</strong>: una carpeta para cada relación de aspecto (Cuadrado, Retrato, Landscape), conteniendo todas las variaciones generadas.
          </p>

          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[10px] text-gray-500 font-medium">Estructura de carpetas:</span>
            {template.activeAspectRatios.map((ratioKey) => {
              const meta = ASPECT_RATIOS[ratioKey];
              const folderName = getRatioFolderName(ratioKey, template.activeAspectRatios);
              return (
                <span
                  key={ratioKey}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-mono shadow-2xs"
                >
                  <Folder className="w-3 h-3 text-blue-600" />
                  /{folderName}/ ({meta.width}×{meta.height})
                </span>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div>
          <button
            id="export-zip-btn"
            disabled={isExporting || numVariations === 0 || report.errors.length > 0}
            onClick={handleExportZip}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm disabled:opacity-40 disabled:hover:bg-blue-600 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Conjunto Completo (ZIP)</span>
          </button>
          {exportComplete && (
            <div className="text-[11px] text-green-700 flex items-center gap-1 mt-1 justify-end font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>¡Archivo ZIP descargado con éxito!</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar during ZIP Generation */}
      {isExporting && exportProgress && (
        <div className="bg-gray-50 border border-blue-200 p-3 rounded-lg space-y-2">
          <div className="flex justify-between text-xs text-blue-700 font-medium">
            <span>{exportProgress.message}</span>
            <span className="font-mono">
              {exportProgress.current} / {exportProgress.total} archivos
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-150"
              style={{
                width: `${Math.round((exportProgress.current / exportProgress.total) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Mathematical Breakdown (Section 8) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Phase 1: Base Combinations */}
        <div className="bg-white border border-gray-200 p-3 rounded-lg space-y-2 shadow-xs">
          <div className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-[10px] font-bold border border-gray-200">
              1
            </span>
            <span>Fase 1 — Combinaciones Base (Cartesiano)</span>
          </div>
          <p className="text-[11px] text-gray-500">
            Producto cartesiano de capas no condicionales ({report.baseLayers.map((l) => l.folderType).join(' × ')}):
          </p>
          <div className="bg-gray-50 px-2.5 py-1.5 rounded font-mono text-blue-900 font-bold text-xs flex items-center justify-between border border-gray-200">
            <span>Base Combinations:</span>
            <span>{report.baseCombinationsCount} combinaciones</span>
          </div>
        </div>

        {/* Phase 2: Conditional Branches */}
        <div className="bg-white border border-gray-200 p-3 rounded-lg space-y-2 shadow-xs">
          <div className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-[10px] font-bold border border-gray-200">
              2
            </span>
            <span>Fase 2 — Resolución de Ramas Condicionales</span>
          </div>
          <p className="text-[11px] text-gray-500">
            Suma de productos por rama condicional resuelta deterministamente tras evaluar contraste:
          </p>
          <div className="space-y-1">
            {report.branchSummary.map((b, i) => (
              <div
                key={i}
                className="bg-gray-50 px-2 py-1 rounded text-[10px] text-gray-700 flex justify-between border border-gray-200 font-mono"
              >
                <span className="truncate pr-2">{b.description}</span>
                <span className="font-bold text-purple-700">{b.multiplier} vars</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Variation Gallery Preview (Inspector) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-gray-700 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Grid className="w-3.5 h-3.5 text-blue-600" />
            Galería de Variaciones Generadas ({variations.length})
          </span>
          <span className="text-[10px] text-gray-400">
            Haz clic en una miniatura para verla en el canvas interactivo
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1.5 bg-gray-50 rounded-lg border border-gray-200">
          {variations.map((v, i) => {
            const isSelected = i === currentVariationIndex;
            const layerValues = Object.values(v.resolvedLayers) as ResolvedLayerValue[];
            const bgResolved = layerValues.find((l) => l.folderUsed === 'background');
            const textResolved = layerValues.find((l) => l.textValue);
            const logoResolved = layerValues.find((l) => l.folderUsed.startsWith('logo'));

            return (
              <div
                key={v.index}
                onClick={() => onSelectVariationIndex(i)}
                className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-400 shadow-xs'
                    : 'border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="font-mono font-bold text-blue-600">Var #{v.index}</span>
                  {logoResolved?.contrastCorrected && (
                    <span className="text-[8px] bg-blue-100 text-blue-800 px-1 rounded font-medium">
                      Contraste
                    </span>
                  )}
                </div>

                <div className="text-[9px] text-gray-800 truncate font-semibold">
                  {textResolved?.textValue || 'Sin texto'}
                </div>

                <div className="text-[9px] text-gray-500 truncate mt-0.5">
                  Fondo: {bgResolved?.assetItem?.name || 'Fondo'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  X,
  Download,
  Layers,
  Package,
  CheckSquare,
  Square,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Project, MasterTemplate, AssetGroup, GeneratedVariation } from '../types';
import { calculateVariationReport, generateAllVariations } from '../utils/variationCalculator';
import { exportAllVariationsZip } from '../utils/canvasRenderer';

interface BulkExportModalProps {
  project: Project;
  onClose: () => void;
}

interface ExportJobStatus {
  templateId: string;
  assetGroupId: string;
  templateName: string;
  assetGroupName: string;
  status: 'pending' | 'running' | 'done' | 'error';
  progress?: { current: number; total: number; message: string };
  error?: string;
}

export const BulkExportModal: React.FC<BulkExportModalProps> = ({
  project,
  onClose,
}) => {
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());
  const [selectedAssetGroupIds, setSelectedAssetGroupIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [jobs, setJobs] = useState<ExportJobStatus[]>([]);
  const [completedCount, setCompletedCount] = useState(0);

  const toggleTemplate = (id: string) => {
    setSelectedTemplateIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAssetGroup = (id: string) => {
    setSelectedAssetGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllTemplates = () => {
    if (selectedTemplateIds.size === project.templates.length) {
      setSelectedTemplateIds(new Set());
    } else {
      setSelectedTemplateIds(new Set(project.templates.map((t) => t.id)));
    }
  };

  const selectAllAssetGroups = () => {
    if (selectedAssetGroupIds.size === project.assetGroups.length) {
      setSelectedAssetGroupIds(new Set());
    } else {
      setSelectedAssetGroupIds(new Set(project.assetGroups.map((a) => a.id)));
    }
  };

  // Calculate preview stats
  const previewStats = useMemo(() => {
    const templates = project.templates.filter((t) => selectedTemplateIds.has(t.id));
    const assetGroups = project.assetGroups.filter((a) => selectedAssetGroupIds.has(a.id));

    let totalVariations = 0;
    let totalFiles = 0;
    const combos: { tpl: MasterTemplate; ag: AssetGroup; varCount: number; fileCount: number }[] = [];

    for (const tpl of templates) {
      for (const ag of assetGroups) {
        const report = calculateVariationReport(tpl, ag);
        const varCount = report.totalVariationsCount;
        const fileCount = varCount * tpl.activeAspectRatios.length;
        totalVariations += varCount;
        totalFiles += fileCount;
        combos.push({ tpl, ag, varCount, fileCount });
      }
    }

    return {
      templateCount: templates.length,
      assetGroupCount: assetGroups.length,
      comboCount: combos.length,
      totalVariations,
      totalFiles,
      combos,
    };
  }, [project, selectedTemplateIds, selectedAssetGroupIds]);

  const handleBulkExport = async () => {
    if (previewStats.combos.length === 0) return;

    setIsExporting(true);
    setCompletedCount(0);

    const initialJobs: ExportJobStatus[] = previewStats.combos.map(({ tpl, ag }) => ({
      templateId: tpl.id,
      assetGroupId: ag.id,
      templateName: tpl.name,
      assetGroupName: ag.name,
      status: 'pending' as const,
    }));
    setJobs(initialJobs);

    let done = 0;

    for (let i = 0; i < previewStats.combos.length; i++) {
      const { tpl, ag } = previewStats.combos[i];

      // Update job to running
      setJobs((prev) =>
        prev.map((j, idx) => (idx === i ? { ...j, status: 'running' } : j))
      );

      try {
        // Generate variations for this combo
        const report = calculateVariationReport(tpl, ag);
        const variations = generateAllVariations(tpl, ag);

        // Export to ZIP
        const zipBlob = await exportAllVariationsZip(
          tpl,
          ag,
          variations,
          project.name,
          (current, total, message) => {
            setJobs((prev) =>
              prev.map((j, idx) =>
                idx === i ? { ...j, progress: { current, total, message } } : j
              )
            );
          }
        );

        // Download
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        const safeTpl = tpl.name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
        const safeAg = ag.name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
        link.download = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${safeTpl}_${safeAg}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Mark done
        setJobs((prev) =>
          prev.map((j, idx) => (idx === i ? { ...j, status: 'done' } : j))
        );
      } catch (err) {
        setJobs((prev) =>
          prev.map((j, idx) =>
            idx === i ? { ...j, status: 'error', error: (err as Error).message } : j
          )
        );
      }

      done++;
      setCompletedCount(done);
    }

    // Keep modal open so user can see results
  };

  const allDone = isExporting && completedCount === previewStats.combos.length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[760px] max-h-[85vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-violet-50 to-purple-50">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Download className="w-5 h-5 text-violet-600" />
              Bulk Export — {project.name}
            </h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Select templates and asset groups to export in mass
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {!isExporting ? (
            <div className="grid grid-cols-2 gap-6">
              {/* Templates column */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    Templates
                  </div>
                  <button
                    onClick={selectAllTemplates}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    {selectedTemplateIds.size === project.templates.length ? 'Deselect all' : 'Select all'}
                  </button>
                </div>
                <div className="space-y-1.5">
                  {project.templates.map((tpl) => {
                    const isSelected = selectedTemplateIds.has(tpl.id);
                    return (
                      <button
                        key={tpl.id}
                        onClick={() => toggleTemplate(tpl.id)}
                        className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer text-left ${
                          isSelected
                            ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200'
                            : 'bg-gray-50 border-gray-100 hover:border-gray-300'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-300 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold text-gray-800 truncate">{tpl.name}</div>
                          <div className="text-[10px] text-gray-400">
                            {tpl.layers.length} layers • {tpl.activeAspectRatios.join(', ')}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Asset Groups column */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-emerald-500" />
                    Asset Groups
                  </div>
                  <button
                    onClick={selectAllAssetGroups}
                    className="text-[10px] text-emerald-600 hover:text-emerald-800 font-semibold cursor-pointer"
                  >
                    {selectedAssetGroupIds.size === project.assetGroups.length ? 'Deselect all' : 'Select all'}
                  </button>
                </div>
                <div className="space-y-1.5">
                  {project.assetGroups.map((ag) => {
                    const isSelected = selectedAssetGroupIds.has(ag.id);
                    const totalAssets = ag.folders.background.length +
                      ag.folders.logo_1.length + ag.folders.logo_2.length + ag.folders.logo_3.length +
                      ag.folders.product_image_1.length + ag.folders.product_image_2.length + ag.folders.product_image_3.length;
                    return (
                      <button
                        key={ag.id}
                        onClick={() => toggleAssetGroup(ag.id)}
                        className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer text-left ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-200'
                            : 'bg-gray-50 border-gray-100 hover:border-gray-300'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-300 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold text-gray-800 truncate">{ag.name}</div>
                          <div className="text-[10px] text-gray-400">
                            {totalAssets} assets
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Export progress */
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-600 mb-3">
                Exporting {completedCount} / {jobs.length} combinations...
              </div>
              {jobs.map((job, idx) => (
                <div
                  key={`${job.templateId}_${job.assetGroupId}`}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    job.status === 'running'
                      ? 'bg-blue-50 border-blue-200'
                      : job.status === 'done'
                      ? 'bg-emerald-50 border-emerald-200'
                      : job.status === 'error'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <div className="shrink-0">
                    {job.status === 'running' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                    {job.status === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {job.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                    {job.status === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-gray-800">
                      {job.templateName} × {job.assetGroupName}
                    </div>
                    {job.progress && job.status === 'running' && (
                      <div className="mt-1">
                        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${(job.progress.current / job.progress.total) * 100}%` }}
                          />
                        </div>
                        <div className="text-[9px] text-gray-400 mt-0.5">{job.progress.message}</div>
                      </div>
                    )}
                    {job.error && (
                      <div className="text-[10px] text-red-500 mt-0.5">{job.error}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          {!isExporting ? (
            <>
              {/* Preview stats */}
              <div className="text-[11px] text-gray-500">
                {previewStats.comboCount > 0 ? (
                  <span>
                    <strong className="text-gray-700">{previewStats.comboCount}</strong> combination{previewStats.comboCount !== 1 ? 's' : ''} •{' '}
                    <strong className="text-gray-700">{previewStats.totalVariations}</strong> variations •{' '}
                    <strong className="text-gray-700">{previewStats.totalFiles}</strong> total files
                  </span>
                ) : (
                  <span className="text-gray-400">Select at least 1 template and 1 asset group</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkExport}
                  disabled={previewStats.comboCount === 0}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export {previewStats.comboCount} ZIP{previewStats.comboCount !== 1 ? 's' : ''}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-[11px] text-gray-500">
                {allDone ? (
                  <span className="text-emerald-600 font-semibold">✓ All exports complete!</span>
                ) : (
                  <span>Please wait while files are being generated...</span>
                )}
              </div>
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors"
              >
                {allDone ? 'Close' : 'Close (exports will stop)'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Type,
  Maximize2,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Sliders,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Upload,
  Crosshair,
  Link2,
  ChevronDown,
  ChevronRight,
  Pentagon,
} from 'lucide-react';
import {
  ASPECT_RATIOS,
  AspectRatioKey,
  AssetGroup,
  FolderType,
  GeneratedVariation,
  MasterTemplate,
  TemplateLayer,
  TextDynamizationSettings,
  AnchorPoint,
  ShapeConfig,
  ShapeType,
} from '../types';

const ANCHOR_POINTS: { key: AnchorPoint; label: string; tooltip: string }[] = [
  { key: 'top-left', label: '↖', tooltip: 'Arriba Izquierda' },
  { key: 'top-center', label: '↑', tooltip: 'Arriba Centro' },
  { key: 'top-right', label: '↗', tooltip: 'Arriba Derecha' },
  { key: 'middle-left', label: '←', tooltip: 'Centro Izquierda' },
  { key: 'center', label: '•', tooltip: 'Centro (Por defecto)' },
  { key: 'middle-right', label: '→', tooltip: 'Centro Derecha' },
  { key: 'bottom-left', label: '↙', tooltip: 'Abajo Izquierda' },
  { key: 'bottom-center', label: '↓', tooltip: 'Abajo Centro' },
  { key: 'bottom-right', label: '↘', tooltip: 'Abajo Derecha' },
];

const ANCHOR_LABELS: Record<AnchorPoint, string> = {
  'top-left': 'Arriba Izquierda',
  'top-center': 'Arriba Centro',
  'top-right': 'Arriba Derecha',
  'middle-left': 'Centro Izquierda',
  'center': 'Centro (Por defecto)',
  'middle-right': 'Centro Derecha',
  'bottom-left': 'Abajo Izquierda',
  'bottom-center': 'Abajo Centro',
  'bottom-right': 'Abajo Derecha',
};
import { getFolderItems } from '../utils/variationCalculator';
import { readMultipleImageFiles, readTextFiles } from '../utils/fileUploader';

interface LeftPanelProps {
  template: MasterTemplate;
  assetGroup: AssetGroup;
  selectedRatio: AspectRatioKey;
  selectedLayerId: string | null;
  currentVariation: GeneratedVariation | null;
  onSelectRatio: (ratio: AspectRatioKey) => void;
  onToggleActiveRatio: (ratio: AspectRatioKey) => void;
  onAddLayer: (folderType: FolderType) => void;
  onUpdateLayerPosition: (
    layerId: string,
    ratio: AspectRatioKey,
    updates: Partial<TemplateLayer['positionsByRatio'][AspectRatioKey]>
  ) => void;
  onDeleteLayer: (layerId: string) => void;
  onUpdateTextDynamization?: (
    layerId: string,
    updates: Partial<TextDynamizationSettings>
  ) => void;
  onUpdateLayer?: (layerId: string, updates: Partial<TemplateLayer>) => void;
  onUpdateAssetGroup?: (updatedGroup: AssetGroup) => void;
}

const FIXED_FOLDER_DEFS: {
  type: FolderType;
  title: string;
  category: 'background' | 'logo' | 'product' | 'text' | 'form';
  desc: string;
}[] = [
  { type: 'background', title: 'Background', category: 'background', desc: 'Background images' },
  { type: 'logo_1', title: 'Logo 1 (Logotype)', category: 'logo', desc: 'Primary logotype variants' },
  { type: 'logo_2', title: 'Logo 2 (Symbol)', category: 'logo', desc: 'Isotype or symbol variants' },
  { type: 'logo_3', title: 'Logo 3', category: 'logo', desc: 'Third logotype or variant' },
  { type: 'product_image_1', title: 'Overlay 1', category: 'product', desc: 'First overlay image (product, graphic, etc.)' },
  { type: 'product_image_2', title: 'Overlay 2', category: 'product', desc: 'Second overlay image' },
  { type: 'product_image_3', title: 'Overlay 3', category: 'product', desc: 'Third overlay image' },
  { type: 'texto_1', title: 'Text 1 (Headline)', category: 'text', desc: 'Text file with phrases' },
  { type: 'texto_2', title: 'Text 2 (Subtitle)', category: 'text', desc: 'Secondary text file' },
  { type: 'texto_3', title: 'Text 3', category: 'text', desc: 'Third text field' },
  { type: 'texto_4', title: 'Text 4', category: 'text', desc: 'Fourth text field' },
  { type: 'form_1', title: 'Form 1', category: 'form', desc: 'Shape (rectangle, circle, etc.)' },
  { type: 'form_2', title: 'Form 2', category: 'form', desc: 'Shape (rectangle, circle, etc.)' },
  { type: 'form_3', title: 'Form 3', category: 'form', desc: 'Shape (rectangle, circle, etc.)' },
];

export const LeftPanel: React.FC<LeftPanelProps> = ({
  template,
  assetGroup,
  selectedRatio,
  selectedLayerId,
  currentVariation,
  onSelectRatio,
  onToggleActiveRatio,
  onAddLayer,
  onUpdateLayerPosition,
  onDeleteLayer,
  onUpdateTextDynamization,
  onUpdateLayer,
  onUpdateAssetGroup,
}) => {
  const [dragOverSlot, setDragOverSlot] = useState<FolderType | null>(null);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [linkedWH, setLinkedWH] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    background: false,
    logo: false,
    product: false,
    text: false,
    form: false,
  });
  const [objectsPanelOpen, setObjectsPanelOpen] = useState(false);

  const selectedLayer = template.layers.find((l) => l.id === selectedLayerId);
  const layerPosition = selectedLayer
    ? selectedLayer.positionsByRatio[selectedRatio] || selectedLayer.positionsByRatio['1:1']
    : null;

  const handleSlotMultiUpload = async (
    slotType: FolderType,
    category: 'background' | 'logo' | 'product' | 'text' | 'form',
    files: FileList | File[] | null
  ) => {
    if (!files || files.length === 0 || category === 'form' || !onUpdateAssetGroup) return;

    if (category === 'text') {
      const phrases = await readTextFiles(files);
      if (phrases.length > 0) {
        const key = slotType as 'texto_1' | 'texto_2' | 'texto_3' | 'texto_4';
        const existing = assetGroup.folders[key].variations;
        const combined = Array.from(new Set([...existing, ...phrases]));
        onUpdateAssetGroup({
          ...assetGroup,
          folders: {
            ...assetGroup.folders,
            [key]: {
              ...assetGroup.folders[key],
              content: combined.join(', '),
              variations: combined,
            },
          },
        });
        setUploadFeedback(`+${phrases.length} phrases to ${slotType}`);
        setTimeout(() => setUploadFeedback(null), 3000);
      }
    } else {
      const newItems = await readMultipleImageFiles(files, 'auto');
      if (newItems.length > 0) {
        const key = slotType as 'background' | 'logo_1' | 'logo_2' | 'logo_3' | 'product_image_1' | 'product_image_2' | 'product_image_3';
        onUpdateAssetGroup({
          ...assetGroup,
          folders: {
            ...assetGroup.folders,
            [key]: [...assetGroup.folders[key], ...newItems],
          },
        });
        setUploadFeedback(`+${newItems.length} images to ${slotType}`);
        setTimeout(() => setUploadFeedback(null), 3000);
      }
    }
  };

  return (
    <aside
      id="left-panel-menu"
      className="w-[320px] bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto text-gray-800 select-none text-xs"
    >
      {/* 1. Aspect Ratio Controller (Section 4.3) */}
      <div className="p-4 border-b border-gray-100 bg-white/95 sticky top-0 z-20 backdrop-blur space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-700 uppercase tracking-wider text-[11px] flex items-center gap-2">
            <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
            Editing Format
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 font-mono text-blue-700 font-bold border border-blue-200">
            {template.activeAspectRatios.length} activo{template.activeAspectRatios.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Selected ratio selector */}
        <select
          value={selectedRatio}
          onChange={(e) => onSelectRatio(e.target.value as AspectRatioKey)}
          className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 font-bold outline-none focus:border-blue-500 cursor-pointer shadow-xs"
        >
          {template.activeAspectRatios.map((rKey) => {
            const meta = ASPECT_RATIOS[rKey];
            return (
              <option key={rKey} value={rKey}>
                {meta.label} ({meta.width}×{meta.height})
              </option>
            );
          })}
        </select>

        {/* Expandable toggle to manage which formats are active */}
        <div className="pt-1">
          <details className="group">
            <summary className="text-[11px] text-blue-600 hover:text-blue-700 cursor-pointer font-medium list-none flex items-center justify-between">
              <span>Manage formats ({template.activeAspectRatios.length}/{Object.keys(ASPECT_RATIOS).length} max)</span>
              <span className="text-[10px] text-gray-400 group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <div className="mt-2 space-y-1 bg-gray-50 p-2 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
              {(Object.keys(ASPECT_RATIOS) as AspectRatioKey[]).map((rKey) => {
                const meta = ASPECT_RATIOS[rKey];
                const isActive = template.activeAspectRatios.includes(rKey);

                return (
                  <label
                    key={rKey}
                    className="flex items-center justify-between p-1.5 rounded hover:bg-gray-100 cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => onToggleActiveRatio(rKey)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <div>
                        <div className="font-medium text-gray-800">{meta.label}</div>
                        <div className="text-[9px] text-gray-400 leading-tight">{meta.description}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 shrink-0 ml-2">
                      {meta.width}×{meta.height}
                    </span>
                  </label>
                );
              })}
            </div>
          </details>
        </div>
      </div>

      {/* 2. Add Objects / Fixed Folders (Section 3 & 4.1) */}
      <div className="p-4 border-b border-gray-100">
        <button
          onClick={() => setObjectsPanelOpen(!objectsPanelOpen)}
          className="w-full flex items-center justify-between mb-1 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <span className="font-semibold text-gray-700 uppercase tracking-wider text-[11px] flex items-center gap-2">
            {objectsPanelOpen ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
            <Plus className="w-4 h-4 text-blue-600" />
            Add Objects to Canvas
          </span>
          <span className="text-[10px] text-gray-400 font-mono">{FIXED_FOLDER_DEFS.length} slots</span>
        </button>

        {objectsPanelOpen && (
        <div className="mt-2">

        {uploadFeedback && (
          <div className="mb-2 p-1.5 rounded bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-semibold text-center animate-fade-in">
            {uploadFeedback}
          </div>
        )}

        {/* Grouped by category */}
        {[
          { key: 'background', label: 'Background', color: 'amber' },
          { key: 'logo', label: 'Logos', color: 'blue' },
          { key: 'product', label: 'Overlays', color: 'violet' },
          { key: 'text', label: 'Texts', color: 'emerald' },
          { key: 'form', label: 'Forms', color: 'pink' },
        ].map((group) => {
          const groupSlots = FIXED_FOLDER_DEFS.filter((s) => s.category === group.key);
          const isFormGroup = group.key === 'form';
          const totalCount = isFormGroup ? 0 : groupSlots.reduce((acc, s) => acc + getFolderItems(assetGroup, s.type).count, 0);
          const isExpanded = expandedCategories[group.key] ?? true;
          const colorMap: Record<string, { dot: string; text: string; bg: string; border: string }> = {
            amber: { dot: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
            blue: { dot: 'bg-blue-400', text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
            violet: { dot: 'bg-violet-400', text: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
            emerald: { dot: 'bg-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
            pink: { dot: 'bg-pink-400', text: 'text-pink-700', bg: 'bg-pink-50', border: 'border-pink-200' },
          };
          const cc = colorMap[group.color];

          return (
            <div key={group.key} className="mb-1">
              <button
                onClick={() => setExpandedCategories((prev) => ({ ...prev, [group.key]: !prev[group.key] }))}
                className="w-full flex items-center gap-2 py-1.5 px-1 rounded hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {isExpanded ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
                <div className={`w-2 h-2 rounded-full ${cc.dot}`} />
                <span className={`text-[11px] font-bold uppercase tracking-wider ${cc.text}`}>{group.label}</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${cc.bg} ${cc.text} ${cc.border} border ml-auto`}>{totalCount}</span>
              </button>

              {isExpanded && (
                <div className="space-y-1 mt-1 ml-2">
                  {groupSlots.map((slot) => {
            const { count } = getFolderItems(assetGroup, slot.type);
            const isDragging = dragOverSlot === slot.type;

            return (
              <div
                key={slot.type}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverSlot(slot.type);
                }}
                onDragLeave={() => setDragOverSlot(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverSlot(null);
                  if (e.dataTransfer.files) {
                    handleSlotMultiUpload(slot.type, slot.category, e.dataTransfer.files);
                  }
                }}
                className={`w-full p-2.5 rounded-lg border transition-all flex items-center justify-between group ${
                  isDragging
                    ? 'bg-blue-100 border-2 border-dashed border-blue-500 scale-[1.02]'
                    : slot.category === 'background'
                    ? 'bg-white hover:bg-amber-50/40 border-gray-200 hover:border-amber-300 border-l-[3px] border-l-amber-400'
                    : slot.category === 'logo'
                    ? 'bg-white hover:bg-blue-50/40 border-gray-200 hover:border-blue-300 border-l-[3px] border-l-blue-400'
                    : slot.category === 'product'
                    ? 'bg-white hover:bg-violet-50/40 border-gray-200 hover:border-violet-300 border-l-[3px] border-l-violet-400'
                    : slot.category === 'form'
                    ? 'bg-white hover:bg-pink-50/40 border-gray-200 hover:border-pink-300 border-l-[3px] border-l-pink-400'
                    : 'bg-white hover:bg-emerald-50/40 border-gray-200 hover:border-emerald-300 border-l-[3px] border-l-emerald-400'
                }`}
              >
                <button
                  onClick={() => onAddLayer(slot.type)}
                  className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
                >
                  {(() => {
                    const folderInfo = getFolderItems(assetGroup, slot.type);
                    const firstAsset = folderInfo.items?.[0];

                    // Category color mapping
                    const categoryColors: Record<string, { bg: string; border: string; text: string; hoverBg: string; hoverText: string }> = {
                      background: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', hoverBg: 'group-hover:bg-amber-100', hoverText: 'group-hover:text-amber-700' },
                      logo: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', hoverBg: 'group-hover:bg-blue-100', hoverText: 'group-hover:text-blue-700' },
                      product: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-500', hoverBg: 'group-hover:bg-violet-100', hoverText: 'group-hover:text-violet-700' },
                      text: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', hoverBg: 'group-hover:bg-emerald-100', hoverText: 'group-hover:text-emerald-700' },
                      form: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-600', hoverBg: 'group-hover:bg-pink-100', hoverText: 'group-hover:text-pink-700' },
                    };
                    const cc = categoryColors[slot.category];

                    if (slot.category === 'form') {
                      return (
                        <div className={`w-7 h-7 rounded-md ${cc.bg} flex items-center justify-center ${cc.text} ${cc.hoverBg} ${cc.hoverText} border ${cc.border} transition-colors shrink-0`}>
                          <Pentagon className="w-3.5 h-3.5" />
                        </div>
                      );
                    }
                    if (slot.category === 'text') {
                      return (
                        <div className={`w-7 h-7 rounded-md ${cc.bg} flex items-center justify-center ${cc.text} ${cc.hoverBg} ${cc.hoverText} border ${cc.border} transition-colors shrink-0`}>
                          <Type className="w-3.5 h-3.5" />
                        </div>
                      );
                    }
                    if (firstAsset?.url) {
                      return (
                        <div className={`w-7 h-7 rounded-md bg-gray-50 border ${cc.border} overflow-hidden shrink-0 ring-1 ring-inset ring-${slot.category === 'background' ? 'amber' : slot.category === 'logo' ? 'blue' : 'violet'}-100`}>
                          <img src={firstAsset.url} alt={firstAsset.name} className="w-full h-full object-cover" />
                        </div>
                      );
                    }
                    return (
                      <div className={`w-7 h-7 rounded-md ${cc.bg} flex items-center justify-center ${cc.text} ${cc.hoverBg} ${cc.hoverText} border border-dashed ${cc.border} transition-colors shrink-0`}>
                        <ImageIcon className="w-3.5 h-3.5" />
                      </div>
                    );
                  })()}
                  <div className="truncate">
                    <div className="font-medium text-gray-800 text-xs truncate">{slot.title}</div>
                    <div className="text-[10px] text-gray-400 truncate">{slot.desc}</div>
                  </div>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  {slot.category !== 'form' && (
                    <>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          count > 0 ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-600 border border-red-200'
                        }`}
                      >
                        {count}
                      </span>

                      {/* Batch Upload Button for this slot */}
                      <label
                        className="w-5 h-5 rounded hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center text-gray-400 cursor-pointer transition-colors"
                        title={`Upload multiple images or files to ${slot.title}`}
                      >
                        <Upload className="w-3 h-3" />
                        <input
                          type="file"
                          multiple
                          accept={slot.category === 'text' ? '.txt,text/plain' : 'image/png,image/jpeg,image/svg+xml,image/webp,image/gif'}
                          className="hidden"
                          onChange={(e) => {
                            handleSlotMultiUpload(slot.type, slot.category, e.target.files);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </>
                  )}

                  {/* Add Layer to Canvas Button */}
                  <button
                    onClick={() => onAddLayer(slot.type)}
                    className="w-5 h-5 rounded bg-gray-100 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-gray-400 transition-colors cursor-pointer"
                    title="Add layer to canvas"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
                </div>
              )}
            </div>
          );
        })}
        </div>
        )}
      </div>

      {/* 3. Selected Layer Position Controls for Active Ratio (Section 4.3) */}
      <div className="p-4 flex-1">
        {selectedLayer && layerPosition ? (() => {
          // Helper: update a property across ALL ratios (for font, weight, color)
          const updateAllRatios = (updates: Record<string, any>) => {
            if (!onUpdateLayer) return;
            const newPositions = { ...selectedLayer.positionsByRatio };
            for (const ratioKey of Object.keys(newPositions) as AspectRatioKey[]) {
              newPositions[ratioKey] = { ...newPositions[ratioKey], ...updates };
            }
            onUpdateLayer(selectedLayer.id, { positionsByRatio: newPositions });
          };
          return (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-gray-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                Adjust: {selectedLayer.name}
              </span>
              <button
                onClick={() => onDeleteLayer(selectedLayer.id)}
                className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                title="Delete layer from template"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-blue-50/60 p-2.5 rounded-lg border border-blue-100 mb-3 text-[11px]">
              <div className="flex justify-between text-gray-600 mb-1">
                <span>Current adjusted format:</span>
                <span className="font-mono font-bold text-blue-600">{selectedRatio}</span>
              </div>
              <p className="text-[10px] text-gray-500">
                Position and size changes apply exclusively to this aspect ratio.
              </p>
            </div>

            {/* Numeric Coordinates — X/Y represent the anchor point position */}
            {(() => {
              const ap = layerPosition.anchorPoint || 'center';
              // Compute anchor offset within box
              const anchorOffX = ap.includes('left') ? 0 : ap.includes('right') ? layerPosition.width : layerPosition.width / 2;
              const anchorOffY = ap.includes('top') ? 0 : ap.includes('bottom') ? layerPosition.height : layerPosition.height / 2;
              const anchorX = layerPosition.x + anchorOffX;
              const anchorY = layerPosition.y + anchorOffY;

              const setAnchorX = (val: number) => {
                onUpdateLayerPosition(selectedLayer.id, selectedRatio, {
                  x: val - anchorOffX,
                });
              };
              const setAnchorY = (val: number) => {
                onUpdateLayerPosition(selectedLayer.id, selectedRatio, {
                  y: val - anchorOffY,
                });
              };

              return (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="text-[10px] text-gray-500 font-semibold uppercase block mb-1">
                      X — Anchor (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={Math.round(anchorX * 10) / 10}
                      onChange={(e) => setAnchorX(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-gray-900 font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 font-semibold uppercase block mb-1">
                      Y — Anchor (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={Math.round(anchorY * 10) / 10}
                      onChange={(e) => setAnchorY(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-gray-900 font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 font-semibold uppercase block mb-1">
                      Width (%)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      value={Math.round(layerPosition.width)}
                      onChange={(e) => {
                        const newW = Math.max(5, parseFloat(e.target.value) || 10);
                        if (linkedWH) {
                          const ratio = layerPosition.height / layerPosition.width;
                          onUpdateLayerPosition(selectedLayer.id, selectedRatio, {
                            width: newW,
                            height: Math.round(newW * ratio),
                          });
                        } else {
                          onUpdateLayerPosition(selectedLayer.id, selectedRatio, { width: newW });
                        }
                      }}
                      className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-gray-900 font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="relative">
                    <label className="text-[10px] text-gray-500 font-semibold uppercase block mb-1">
                      Height (%)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      value={Math.round(layerPosition.height)}
                      onChange={(e) => {
                        const newH = Math.max(5, parseFloat(e.target.value) || 10);
                        if (linkedWH) {
                          const ratio = layerPosition.width / layerPosition.height;
                          onUpdateLayerPosition(selectedLayer.id, selectedRatio, {
                            height: newH,
                            width: Math.round(newH * ratio),
                          });
                        } else {
                          onUpdateLayerPosition(selectedLayer.id, selectedRatio, { height: newH });
                        }
                      }}
                      className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-gray-900 font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                    {/* Link W/H toggle */}
                    <button
                      type="button"
                      onClick={() => setLinkedWH(!linkedWH)}
                      className={`absolute -left-5 top-6 w-4 h-4 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                        linkedWH
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                      }`}
                      title={linkedWH ? 'Unlink width/height' : 'Link width/height (uniform scale)'}
                    >
                      <Link2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Object Fit for Image Layers */}
            {!selectedLayer.folderType.startsWith('texto') && (
              <div className="mb-3">
                <label className="text-[10px] text-gray-500 font-semibold uppercase block mb-1">
                  Image Fit (Object-Fit)
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() =>
                      onUpdateLayerPosition(selectedLayer.id, selectedRatio, { objectFit: 'contain' })
                    }
                    className={`py-1 rounded border text-center font-medium transition-colors ${
                      layerPosition.objectFit === 'contain'
                        ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Contain
                  </button>
                  <button
                    onClick={() =>
                      onUpdateLayerPosition(selectedLayer.id, selectedRatio, { objectFit: 'cover' })
                    }
                    className={`py-1 rounded border text-center font-medium transition-colors ${
                      layerPosition.objectFit === 'cover' || !layerPosition.objectFit
                        ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Cover (Cubrir)
                  </button>
                </div>
              </div>
            )}

            {/* Scale Section (for logos and overlays) */}
            {(selectedLayer.folderType.startsWith('logo') || selectedLayer.folderType.startsWith('product_image')) && (
              <div className="mb-3 p-2.5 bg-blue-50/60 rounded-lg border border-blue-200 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-blue-900 font-bold uppercase flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                    {selectedLayer.folderType.startsWith('logo') ? 'Escala del Logotipo' : 'Escala del Overlay'}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-xs text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 shadow-2xs">
                      {layerPosition.scale !== undefined ? layerPosition.scale : 100}%
                    </span>
                    {(layerPosition.scale !== undefined && layerPosition.scale !== 100) && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateLayerPosition(selectedLayer.id, selectedRatio, { scale: 100 })
                        }
                        className="text-[9px] text-blue-600 hover:text-blue-800 underline font-semibold cursor-pointer"
                        title="Restablecer al 100% de serie"
                      >
                        100% serie
                      </button>
                    )}
                  </div>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="20"
                  max="250"
                  step="5"
                  value={layerPosition.scale !== undefined ? layerPosition.scale : 100}
                  onChange={(e) =>
                    onUpdateLayerPosition(selectedLayer.id, selectedRatio, {
                      scale: parseInt(e.target.value) || 100,
                    })
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                />

                {/* Preset Chips */}
                <div className="flex items-center justify-between gap-1 pt-0.5">
                  {[50, 75, 100, 125, 150, 200].map((preset) => {
                    const isCurrent = (layerPosition.scale ?? 100) === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() =>
                          onUpdateLayerPosition(selectedLayer.id, selectedRatio, { scale: preset })
                        }
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-blue-600 text-white font-bold shadow-2xs'
                            : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                      >
                        {preset}%
                      </button>
                    );
                  })}
                </div>
                <p className="text-[9px] text-gray-500 leading-tight">
                  100% = base design size. Scales relative to the anchor point.
                </p>
              </div>
            )}

            {/* Anchor Point Section (Logos, Overlays, and Texts) */}
            {(selectedLayer.folderType.startsWith('logo') || selectedLayer.folderType.startsWith('product_image') || selectedLayer.folderType.startsWith('texto')) && (
              <div className="mb-3 p-2.5 bg-gray-50 rounded-lg border border-gray-200 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] text-gray-700 font-bold uppercase flex items-center gap-1.5">
                    <Crosshair className="w-3.5 h-3.5 text-blue-600" />
                    Anchor Point
                  </label>
                  <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shadow-2xs">
                    {ANCHOR_LABELS[layerPosition.anchorPoint || 'center']}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* 3x3 Anchor Matrix */}
                  <div className="grid grid-cols-3 gap-1 p-1 bg-white rounded-md border border-gray-200 shadow-2xs shrink-0">
                    {ANCHOR_POINTS.map((ap) => {
                      const isSelected = (layerPosition.anchorPoint || 'center') === ap.key;
                      return (
                        <button
                          key={ap.key}
                          type="button"
                          onClick={() =>
                            onUpdateLayerPosition(selectedLayer.id, selectedRatio, {
                              anchorPoint: ap.key,
                            })
                          }
                          title={`Anchor point: ${ap.tooltip}`}
                          className={`w-6 h-6 rounded flex items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-xs scale-105 ring-1 ring-blue-400'
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          <div
                            className={`rounded-full transition-all ${
                              isSelected
                                ? 'w-2 h-2 bg-white'
                                : 'w-1.5 h-1.5 bg-gray-400 group-hover:bg-gray-600'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <div className="text-[10px] text-gray-500 leading-tight">
                    Default is <strong className="text-gray-700 font-semibold">center</strong>.
                    Determines alignment and reference point for scaling and positioning.
                  </div>
                </div>
              </div>
            )}

            {/* Subject Position in Composition (background and overlay layers) */}
            {(selectedLayer.folderType === 'background' || selectedLayer.folderType.startsWith('product_image')) && (() => {
              const fp = layerPosition.focalPoint || { x: 0.5, y: 0.5 };
              // Show detected asset focal point for reference
              const resolvedLayer = currentVariation?.resolvedLayers[selectedLayer.id];
              const currentAsset = resolvedLayer?.assetItem;
              const detectedFP = currentAsset?.focalPoint;

              return (
                <div className="mb-3 p-2.5 bg-gray-50 rounded-lg border border-gray-200 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] text-gray-700 font-bold uppercase flex items-center gap-1.5">
                      <Crosshair className="w-3.5 h-3.5 text-orange-500" />
                      Subject Position
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 shadow-2xs">
                        {Math.round(fp.x * 100)}%, {Math.round(fp.y * 100)}%
                      </span>
                      {(fp.x !== 0.5 || fp.y !== 0.5) && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateLayerPosition(selectedLayer.id, selectedRatio, {
                              focalPoint: { x: 0.5, y: 0.5 },
                            })
                          }
                          className="text-[9px] text-orange-600 hover:text-orange-800 underline font-semibold cursor-pointer"
                          title="Restablecer al centro"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Detected asset focal point info */}
                  {detectedFP && currentAsset && (
                    <div className="flex items-center gap-2 mb-2 px-1 py-1 bg-blue-50/50 rounded border border-blue-100">
                      {currentAsset.url && (
                        <div className="w-5 h-5 rounded border border-gray-200 overflow-hidden shrink-0">
                          <img src={currentAsset.url} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <span className="text-[9px] text-blue-600">
                        Sujeto detectado en <strong>{Math.round(detectedFP.x * 100)}%, {Math.round(detectedFP.y * 100)}%</strong>
                      </span>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    {/* Interactive 2D Pad */}
                    <div
                      className="relative w-24 h-24 bg-white rounded-md border border-gray-300 cursor-crosshair shrink-0 shadow-inner overflow-hidden"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const fx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                        const fy = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
                        onUpdateLayerPosition(selectedLayer.id, selectedRatio, {
                          focalPoint: { x: Math.round(fx * 100) / 100, y: Math.round(fy * 100) / 100 },
                        });
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const pad = e.currentTarget;
                        const updateFP = (ev: MouseEvent) => {
                          const rect = pad.getBoundingClientRect();
                          const fx = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
                          const fy = Math.max(0, Math.min(1, (ev.clientY - rect.top) / rect.height));
                          onUpdateLayerPosition(selectedLayer.id, selectedRatio, {
                            focalPoint: { x: Math.round(fx * 100) / 100, y: Math.round(fy * 100) / 100 },
                          });
                        };
                        const stopDrag = () => {
                          document.removeEventListener('mousemove', updateFP);
                          document.removeEventListener('mouseup', stopDrag);
                        };
                        document.addEventListener('mousemove', updateFP);
                        document.addEventListener('mouseup', stopDrag);
                      }}
                      title="Click or drag to position where you want the subject"
                    >
                      {/* Grid lines for reference */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute left-1/3 top-0 bottom-0 w-px bg-gray-200" />
                        <div className="absolute left-2/3 top-0 bottom-0 w-px bg-gray-200" />
                        <div className="absolute top-1/3 left-0 right-0 h-px bg-gray-200" />
                        <div className="absolute top-2/3 left-0 right-0 h-px bg-gray-200" />
                      </div>
                      {/* Crosshair indicator */}
                      <div
                        className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 z-10"
                        style={{
                          left: `${fp.x * 100}%`,
                          top: `${fp.y * 100}%`,
                        }}
                      >
                        <div className="absolute w-5 h-px bg-orange-500 -left-2.5 top-0" />
                        <div className="absolute h-5 w-px bg-orange-500 left-0 -top-2.5" />
                        <div className="w-2.5 h-2.5 rounded-full border-2 border-orange-500 bg-white shadow-sm -ml-[5px] -mt-[5px]" />
                      </div>
                    </div>

                    <div className="text-[10px] text-gray-500 leading-tight space-y-1.5">
                      <p>
                        Indicate where you want the <strong className="text-gray-700">subject</strong> to appear in the composition.
                      </p>
                      <p>
                        The subject is detected <strong className="text-orange-700">automatically</strong> when uploading each image.
                        The image will zoom if necessary to cover the canvas.
                      </p>
                    </div>
                  </div>

                  {/* Quick Presets */}
                  <div className="flex items-center gap-1 mt-2">
                    {[
                      { label: '← Izq', x: 0.2, y: 0.5 },
                      { label: '↑ Arriba', x: 0.5, y: 0.2 },
                      { label: '• Centro', x: 0.5, y: 0.5 },
                      { label: '↓ Abajo', x: 0.5, y: 0.8 },
                      { label: 'Der →', x: 0.8, y: 0.5 },
                    ].map((preset) => {
                      const isCurrent = Math.abs(fp.x - preset.x) < 0.05 && Math.abs(fp.y - preset.y) < 0.05;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() =>
                            onUpdateLayerPosition(selectedLayer.id, selectedRatio, {
                              focalPoint: { x: preset.x, y: preset.y },
                            })
                          }
                          className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-colors cursor-pointer ${
                            isCurrent
                              ? 'bg-orange-500 text-white font-bold shadow-2xs'
                              : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* ===== FORM (Shape) CONFIG ===== */}
            {selectedLayer.folderType.startsWith('form') && selectedLayer.shapeConfig && (() => {
              const sc = selectedLayer.shapeConfig;
              const updateShape = (patch: Partial<ShapeConfig>) => {
                onUpdateLayer?.(selectedLayer.id, {
                  shapeConfig: { ...sc, ...patch },
                });
              };
              return (
                <div className="space-y-3 pt-1 border-t border-gray-200">
                  <label className="text-[10px] text-pink-600 font-bold uppercase tracking-wider">Shape Config</label>

                  {/* Shape Type */}
                  <div>
                    <label className="text-[10px] text-gray-500 font-semibold uppercase mb-1 block">Shape</label>
                    <div className="flex gap-1 flex-wrap">
                      {(['rectangle', 'circle', 'ellipse', 'triangle', 'line'] as ShapeType[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => updateShape({ shapeType: s })}
                          className={`px-2 py-1 rounded text-[10px] font-medium capitalize cursor-pointer transition-colors ${
                            sc.shapeType === s
                              ? 'bg-pink-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fill Color */}
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-gray-500 font-semibold uppercase w-16">Fill</label>
                    <input
                      type="color"
                      value={sc.fillColor}
                      onChange={(e) => updateShape({ fillColor: e.target.value })}
                      className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-gray-500">{sc.fillColor}</span>
                  </div>

                  {/* Stroke */}
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-gray-500 font-semibold uppercase w-16">Stroke</label>
                    <input
                      type="color"
                      value={sc.strokeColor === 'transparent' ? '#000000' : sc.strokeColor}
                      onChange={(e) => updateShape({ strokeColor: e.target.value })}
                      className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={sc.strokeWidth}
                      onChange={(e) => updateShape({ strokeWidth: Number(e.target.value) })}
                      className="w-14 px-1.5 py-0.5 text-[10px] rounded border border-gray-300"
                    />
                    <span className="text-[10px] text-gray-400">px</span>
                  </div>

                  {/* Border Radius (rectangle only) */}
                  {sc.shapeType === 'rectangle' && (
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] text-gray-500 font-semibold uppercase w-16">Radius</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sc.borderRadius}
                        onChange={(e) => updateShape({ borderRadius: Number(e.target.value) })}
                        className="flex-1 h-1 accent-pink-500"
                      />
                      <span className="text-[10px] font-mono text-gray-500 w-8 text-right">{sc.borderRadius}px</span>
                    </div>
                  )}

                  {/* Opacity */}
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-gray-500 font-semibold uppercase w-16">Opacity</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(sc.opacity * 100)}
                      onChange={(e) => updateShape({ opacity: Number(e.target.value) / 100 })}
                      className="flex-1 h-1 accent-pink-500"
                    />
                    <span className="text-[10px] font-mono text-gray-500 w-8 text-right">{Math.round(sc.opacity * 100)}%</span>
                  </div>

                  {/* Contrast Colors */}
                  <div className="pt-2 border-t border-gray-100">
                    <label className="text-[10px] text-pink-600 font-bold uppercase tracking-wider mb-2 block">Contrast Colors</label>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 w-20">On dark bg:</span>
                        <input
                          type="color"
                          value={sc.darkBgColor}
                          onChange={(e) => updateShape({ darkBgColor: e.target.value })}
                          className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-gray-500">{sc.darkBgColor}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 w-20">On light bg:</span>
                        <input
                          type="color"
                          value={sc.lightBgColor}
                          onChange={(e) => updateShape({ lightBgColor: e.target.value })}
                          className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-gray-500">{sc.lightBgColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {(selectedLayer.folderType.startsWith('texto')) && (
              <div className="space-y-3 pt-1 border-t border-gray-200">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-[10px] text-gray-500 font-semibold uppercase">
                      Font Size (Base 1080px)
                    </label>
                    <span className="font-mono text-gray-700 font-medium">{layerPosition.fontSize || 42}px</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="300"
                    value={layerPosition.fontSize || 42}
                    onChange={(e) =>
                      onUpdateLayerPosition(selectedLayer.id, selectedRatio, {
                        fontSize: parseInt(e.target.value),
                      })
                    }
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                {/* Font Family Selector */}
                <div>
                  <label className="text-[10px] text-gray-500 font-semibold uppercase block mb-1">
                    Typography
                  </label>
                  <select
                    value={layerPosition.fontFamily || 'Inter'}
                    onChange={(e) =>
                      updateAllRatios({ fontFamily: e.target.value })
                    }
                    className="w-full text-xs px-2 py-1.5 rounded border border-gray-200 bg-white text-gray-800 font-medium shadow-xs cursor-pointer focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                    style={{ fontFamily: layerPosition.fontFamily || 'Inter' }}
                  >
                    {[
                      'Inter', 'Roboto', 'Montserrat', 'Playfair Display', 'Oswald',
                      'Lato', 'Poppins', 'Raleway', 'Open Sans', 'Bebas Neue',
                      'DM Sans', 'Space Grotesk', 'Outfit', 'Barlow Condensed', 'Archivo Black',
                    ].map((font) => (
                      <option key={font} value={font} style={{ fontFamily: font }}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Line Height & Letter Spacing */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <label className="text-[10px] text-gray-500 font-semibold uppercase">
                        Interlineado
                      </label>
                      <span className="font-mono text-[10px] text-gray-600">{(layerPosition.lineHeight ?? 1.35).toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.8"
                      max="2.5"
                      step="0.05"
                      value={layerPosition.lineHeight ?? 1.35}
                      onChange={(e) =>
                        onUpdateLayerPosition(selectedLayer.id, selectedRatio, {
                          lineHeight: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <label className="text-[10px] text-gray-500 font-semibold uppercase">
                        Espaciado
                      </label>
                      <span className="font-mono text-[10px] text-gray-600">{layerPosition.letterSpacing ?? 0}px</span>
                    </div>
                    <input
                      type="range"
                      min="-2"
                      max="10"
                      step="0.5"
                      value={layerPosition.letterSpacing ?? 0}
                      onChange={(e) =>
                        onUpdateLayerPosition(selectedLayer.id, selectedRatio, {
                          letterSpacing: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Text Transform */}
                <div>
                  <label className="text-[10px] text-gray-500 font-semibold uppercase block mb-1">
                    Transformar
                  </label>
                  <div className="flex items-center gap-1 bg-white p-1 rounded border border-gray-200 shadow-xs">
                    {([
                      { value: 'none' as const, label: 'Aa' },
                      { value: 'uppercase' as const, label: 'AA' },
                      { value: 'lowercase' as const, label: 'aa' },
                    ]).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() =>
                          onUpdateLayerPosition(selectedLayer.id, selectedRatio, { textTransform: opt.value })
                        }
                        className={`flex-1 px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                          (layerPosition.textTransform || 'none') === opt.value
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-gray-400 hover:text-gray-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500 font-semibold uppercase block mb-1">
                      Text Color
                    </label>
                    <div className="flex items-center gap-2 bg-white p-1 rounded border border-gray-200 shadow-xs">
                      <input
                        type="color"
                        value={layerPosition.textColor || '#0F172A'}
                        onChange={(e) =>
                          updateAllRatios({ textColor: e.target.value })
                        }
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <span className="font-mono text-[10px] text-gray-700 uppercase">
                        {layerPosition.textColor || '#0F172A'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 font-semibold uppercase block mb-1">
                      Alignment
                    </label>
                    <div className="flex items-center gap-1 bg-white p-1 rounded border border-gray-200 justify-around shadow-xs">
                      <button
                        onClick={() =>
                          onUpdateLayerPosition(selectedLayer.id, selectedRatio, { textAlign: 'left' })
                        }
                        className={`p-1 rounded transition-colors ${
                          layerPosition.textAlign === 'left' ? 'text-blue-600 bg-blue-50 font-bold' : 'text-gray-400 hover:text-gray-700'
                        }`}
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          onUpdateLayerPosition(selectedLayer.id, selectedRatio, { textAlign: 'center' })
                        }
                        className={`p-1 rounded transition-colors ${
                          layerPosition.textAlign === 'center' || !layerPosition.textAlign
                            ? 'text-blue-600 bg-blue-50 font-bold'
                            : 'text-gray-400 hover:text-gray-700'
                        }`}
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          onUpdateLayerPosition(selectedLayer.id, selectedRatio, { textAlign: 'right' })
                        }
                        className={`p-1 rounded transition-colors ${
                          layerPosition.textAlign === 'right' ? 'text-blue-600 bg-blue-50 font-bold' : 'text-gray-400 hover:text-gray-700'
                        }`}
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Font Weight */}
                <div>
                  <label className="text-[10px] text-gray-500 font-semibold uppercase block mb-1">
                    Peso
                  </label>
                  <div className="flex items-center gap-1 bg-white p-1 rounded border border-gray-200 shadow-xs">
                    {([
                      { value: 'normal' as const, label: 'Regular' },
                      { value: 'medium' as const, label: 'Medium' },
                      { value: 'bold' as const, label: 'Bold' },
                      { value: 'black' as const, label: 'Black' },
                    ]).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() =>
                          updateAllRatios({ fontWeight: opt.value })
                        }
                        className={`flex-1 px-1.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                          (layerPosition.fontWeight || 'bold') === opt.value
                            ? 'text-blue-600 bg-blue-50 font-bold'
                            : 'text-gray-400 hover:text-gray-700'
                        }`}
                        style={{ fontWeight: opt.value === 'black' ? 900 : opt.value }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="text-[10px] text-gray-500 font-semibold uppercase">
                    Sombra de Lectura
                  </label>
                  <input
                    type="checkbox"
                    checked={!!layerPosition.textShadow}
                    onChange={(e) =>
                      onUpdateLayerPosition(selectedLayer.id, selectedRatio, {
                        textShadow: e.target.checked,
                      })
                    }
                    className="accent-blue-600 cursor-pointer"
                  />
                </div>

                {onUpdateTextDynamization && (
                  <div className="mt-2.5 p-2 bg-blue-50/70 rounded border border-blue-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-900">Color por Contraste</span>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedLayer.textDynamization?.contrastColorEnabled ?? true}
                          onChange={(e) =>
                            onUpdateTextDynamization(selectedLayer.id, {
                              contrastColorEnabled: e.target.checked,
                            })
                          }
                          className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="text-[10px] text-blue-700 font-semibold">
                          {(selectedLayer.textDynamization?.contrastColorEnabled ?? true) ? 'Active' : 'Inactive'}
                        </span>
                      </label>
                    </div>

                    {(selectedLayer.textDynamization?.contrastColorEnabled ?? true) && (
                      <div className="flex items-center justify-between pt-0.5">
                        <span className="text-[10px] text-gray-600">Cambiar a:</span>
                        <div className="flex items-center gap-1.5 bg-white px-1.5 py-0.5 rounded border border-blue-200 shadow-2xs">
                          <input
                            type="color"
                            value={selectedLayer.textDynamization?.contrastTextColor || '#FFFFFF'}
                            onChange={(e) =>
                              onUpdateTextDynamization(selectedLayer.id, {
                                contrastTextColor: e.target.value,
                              })
                            }
                            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                          />
                          <span className="font-mono text-[9px] text-gray-700 uppercase">
                            {selectedLayer.textDynamization?.contrastTextColor || '#FFFFFF'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          );
        })() : (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-gray-200 rounded-lg text-gray-400 bg-gray-50/40">
            <Sliders className="w-6 h-6 text-gray-300 mb-2" />
            <p className="font-semibold text-gray-600">No layer selected</p>
            <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
              Click on any layer in the canvas or in the bottom tab to edit its properties for the active format.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

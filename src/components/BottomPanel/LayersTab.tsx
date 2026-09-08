import React from 'react';
import {
  Layers,
  Eye,
  EyeOff,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Type,
  Image as ImageIcon,
  Folder,
  Upload,
  Lock,
  Unlock,
} from 'lucide-react';
import { AssetGroup, AssetItem, FolderType, TemplateLayer } from '../../types';
import { getFolderItems } from '../../utils/variationCalculator';
import { readMultipleImageFiles, readTextFiles } from '../../utils/fileUploader';

interface LayersTabProps {
  layers: TemplateLayer[];
  selectedLayerId: string | null;
  assetGroup?: AssetGroup;
  isCarousel?: boolean;
  slideCount?: number;
  currentSlideIndex?: number;
  onUpdateAssetGroup?: (group: AssetGroup) => void;
  onSelectLayer: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onMoveLayer: (layerId: string, direction: 'up' | 'down') => void;
  onDeleteLayer: (layerId: string) => void;
  onToggleCarouselFixed?: (layerId: string) => void;
  onToggleSlideAssignment?: (layerId: string, slideIndex: number) => void;
}

export const LayersTab: React.FC<LayersTabProps> = ({
  layers,
  selectedLayerId,
  assetGroup,
  isCarousel,
  slideCount,
  currentSlideIndex,
  onUpdateAssetGroup,
  onSelectLayer,
  onToggleVisibility,
  onMoveLayer,
  onDeleteLayer,
  onToggleCarouselFixed,
  onToggleSlideAssignment,
}) => {
  if (layers.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-xs">
        No layers in this template. Add layers from the left panel.
      </div>
    );
  }

  // In carousel mode, filter layers: fixed always show, variable only on assigned slides
  const visibleLayers = isCarousel
    ? layers.filter((l) => {
        if (l.carouselFixed) return true; // fixed always visible
        const assigned = l.visibleOnSlides ?? [0];
        return assigned.includes(currentSlideIndex ?? 0);
      })
    : layers;

  // Display top of stack (highest z-index) first
  const displayLayers = [...visibleLayers].reverse();

  return (
    <div className="h-full overflow-y-auto px-5 py-3 space-y-1.5 text-xs bg-white text-gray-800">
      <div className="flex items-center justify-between text-[10px] uppercase font-bold text-gray-400 tracking-wider pb-1 border-b border-gray-100">
        <span>
          Stacking Order (z-index: Top → Bottom)
          {isCarousel && (
            <span className="ml-2 text-violet-500 normal-case">
              · Slide {(currentSlideIndex ?? 0) + 1}
            </span>
          )}
        </span>
        <span>{visibleLayers.length} layers{isCarousel && ` / ${layers.length} total`}</span>
      </div>

      {displayLayers.map((layer, index) => {
        const isSelected = layer.id === selectedLayerId;
        const actualIndex = layers.findIndex((l) => l.id === layer.id);
        const isTop = actualIndex === layers.length - 1;
        const isBottom = actualIndex === 0;

        return (
          <div
            key={layer.id}
            onClick={() => onSelectLayer(layer.id)}
            className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
              isSelected
                ? 'bg-blue-50/70 border-blue-400 text-gray-900 ring-1 ring-blue-400/40 shadow-xs'
                : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {/* Layer Thumbnail */}
              {(() => {
                const isText = layer.folderType.startsWith('texto');
                if (isText) {
                  return (
                    <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-gray-500 border border-gray-200 shrink-0">
                      <Type className="w-3.5 h-3.5" />
                    </div>
                  );
                }
                // Get the first asset from the folder as a thumbnail
                const folderInfo = assetGroup ? getFolderItems(assetGroup, layer.folderType) : null;
                const firstAsset = folderInfo?.items?.[0];
                if (firstAsset?.url) {
                  return (
                    <div className="w-8 h-8 rounded-md bg-gray-50 border border-gray-200 overflow-hidden shrink-0">
                      <img
                        src={firstAsset.url}
                        alt={firstAsset.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  );
                }
                return (
                  <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 border border-dashed border-gray-300 shrink-0">
                    <ImageIcon className="w-3.5 h-3.5" />
                  </div>
                );
              })()}

              <div>
                <div className="font-bold text-gray-800 flex items-center gap-1.5">
                  <span>{layer.name}</span>
                  {!layer.visible && (
                    <span className="text-[9px] bg-gray-100 text-gray-500 px-1 rounded">
                      Oculta
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-gray-400 flex items-center gap-1 font-mono">
                    <Folder className="w-3 h-3 text-gray-400" />
                    {layer.folderType}
                  </span>

                  <span className="text-[10px] text-gray-300">•</span>

                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                      layer.conditionalRule
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : layer.dynamizationType === 'by_contrast'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : layer.dynamizationType === 'none'
                        ? 'bg-gray-200 text-gray-500'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {layer.dynamizationType === 'none'
                      ? 'Static'
                      : layer.dynamizationType === 'by_contrast'
                      ? 'By Contrast'
                      : 'By Folder'}
                    {layer.conditionalRule ? ' + Condition' : ''}
                  </span>

                  {/* Carousel Fixed/Variable badge */}
                  {isCarousel && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCarouselFixed?.(layer.id);
                      }}
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 cursor-pointer transition-colors ${
                        layer.carouselFixed
                          ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                          : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                      }`}
                      title={layer.carouselFixed ? 'Fija: igual en todos los slides' : 'Variable: cambia por slide'}
                    >
                      {layer.carouselFixed ? (
                        <><Lock className="w-2.5 h-2.5" /> Fija</>
                      ) : (
                        <><Unlock className="w-2.5 h-2.5" /> Variable</>
                      )}
                    </button>
                  )}

                  {/* Slide assignment pills for variable layers */}
                  {isCarousel && !layer.carouselFixed && slideCount && (
                    <div className="flex items-center gap-0.5 ml-1" onClick={(e) => e.stopPropagation()}>
                      {Array.from({ length: slideCount }, (_, i) => {
                        const assignedSlides = layer.visibleOnSlides ?? [0];
                        const isAssigned = assignedSlides.includes(i);
                        const isCurrent = i === (currentSlideIndex ?? 0);
                        return (
                          <button
                            key={i}
                            onClick={() => onToggleSlideAssignment?.(layer.id, i)}
                            className={`w-5 h-5 rounded text-[8px] font-bold cursor-pointer transition-all ${
                              isAssigned
                                ? isCurrent
                                  ? 'bg-violet-600 text-white shadow-sm scale-110'
                                  : 'bg-violet-100 text-violet-700 border border-violet-300'
                                : 'bg-gray-100 text-gray-400 border border-gray-200 hover:bg-gray-200'
                            }`}
                            title={`Slide ${i + 1}: ${isAssigned ? 'Asignada' : 'No asignada'}`}
                          >
                            {i + 1}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {/* Move up / down (stack order) */}
              <button
                disabled={isTop}
                onClick={() => onMoveLayer(layer.id, 'up')}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-20 transition-colors"
                title="Move up in stacking order"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>

              <button
                disabled={isBottom}
                onClick={() => onMoveLayer(layer.id, 'down')}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-20 transition-colors"
                title="Bajar en orden de apilado"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>

              <div className="h-4 w-px bg-gray-200 mx-1" />

              {/* Batch Upload to Layer Folder */}
              {onUpdateAssetGroup && assetGroup && (
                <label
                  className="p-1 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                  title={`Upload multiple images or files to ${layer.folderType}`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    multiple
                    accept={
                      layer.folderType.startsWith('texto')
                        ? '.txt,text/plain'
                        : 'image/png,image/jpeg,image/svg+xml,image/webp,image/gif'
                    }
                    className="hidden"
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files || files.length === 0) return;
                      if (layer.folderType.startsWith('texto')) {
                        const phrases = await readTextFiles(files);
                        if (phrases.length > 0) {
                          const key = layer.folderType;
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
                        }
                      } else {
                        const newItems = await readMultipleImageFiles(files, 'auto');
                        if (newItems.length > 0) {
                          onUpdateAssetGroup({
                            ...assetGroup,
                            folders: {
                              ...assetGroup.folders,
                              [layer.folderType]: [
                                ...assetGroup.folders[layer.folderType],
                                ...newItems,
                              ],
                            },
                          });
                        }
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
              )}

              {/* Visibility */}
              <button
                onClick={() => onToggleVisibility(layer.id)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                title={layer.visible ? 'Hide layer' : 'Show layer'}
              >
                {layer.visible ? (
                  <Eye className="w-3.5 h-3.5 text-gray-600" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                )}
              </button>

              {/* Delete */}
              <button
                onClick={() => onDeleteLayer(layer.id)}
                className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                title="Delete layer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

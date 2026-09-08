import React, { useState } from 'react';
import { Layers, Sparkles, Download, AlertCircle } from 'lucide-react';
import { LayersTab } from './LayersTab';
import { DynamizationTab } from './DynamizationTab';
import { ExportTab } from './ExportTab';
import {
  AssetGroup,
  ConditionalRule,
  DynamizationType,
  GeneratedVariation,
  MasterTemplate,
  TemplateLayer,
  TextDynamizationSettings,
  VariationCalculationReport,
} from '../../types';

export type BottomPanelTab = 'layers' | 'dynamization' | 'export';

interface BottomPanelProps {
  template: MasterTemplate;
  assetGroup: AssetGroup;
  variations: GeneratedVariation[];
  report: VariationCalculationReport;
  selectedLayerId: string | null;
  currentVariationIndex: number;
  onSelectLayer: (layerId: string | null) => void;
  onToggleVisibility: (layerId: string) => void;
  onMoveLayer: (layerId: string, direction: 'up' | 'down') => void;
  onDeleteLayer: (layerId: string) => void;
  onUpdateLayerDynamization: (
    layerId: string,
    dynamizationType: DynamizationType,
    conditionalRule?: ConditionalRule,
    textDynamization?: TextDynamizationSettings
  ) => void;
  onUpdateTextDynamization: (
    layerId: string,
    updates: Partial<TextDynamizationSettings>
  ) => void;
  onSelectVariationIndex: (index: number) => void;
  onUpdateAssetGroup?: (group: AssetGroup) => void;
  onToggleCarouselFixed?: (layerId: string) => void;
  onToggleSlideAssignment?: (layerId: string, slideIndex: number) => void;
  currentSlideIndex?: number;
  projectName: string;
  height?: number;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  template,
  assetGroup,
  variations,
  report,
  selectedLayerId,
  currentVariationIndex,
  onSelectLayer,
  onToggleVisibility,
  onMoveLayer,
  onDeleteLayer,
  onUpdateLayerDynamization,
  onUpdateTextDynamization,
  onSelectVariationIndex,
  projectName,
  onUpdateAssetGroup,
  onToggleCarouselFixed,
  onToggleSlideAssignment,
  currentSlideIndex,
  height,
}) => {
  const [activeTab, setActiveTab] = useState<BottomPanelTab>('layers');

  return (
    <div
      id="bottom-editor-panel"
      className="bg-white border-t border-gray-100 flex flex-col z-20 select-none text-xs flex-shrink-0"
      style={{ height: height ? `${height}px` : '14rem' }}
    >
      {/* 3 Tabs Navigation Bar (Section 4.1) */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 bg-white">
        <div className="flex items-center gap-1">
          {/* 1. Layers */}
          <button
            id="tab-btn-layers"
            onClick={() => setActiveTab('layers')}
            className={`px-4 py-2.5 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'layers'
                ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1. Layers</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-600 font-mono">
              {template.layers.length}
            </span>
          </button>

          {/* 2. Dynamization */}
          <button
            id="tab-btn-dynamization"
            onClick={() => setActiveTab('dynamization')}
            className={`px-4 py-2.5 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'dynamization'
                ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>2. Dynamization</span>
            {report.errors.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>

          {/* 3. Export */}
          <button
            id="tab-btn-export"
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2.5 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'export'
                ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>3. Export</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100/70 text-blue-700 font-mono font-bold">
              {report.totalVariationsCount} vars
            </span>
          </button>
        </div>

        {/* Quick summary status */}
        <div className="text-[11px] text-gray-500 hidden sm:flex items-center gap-3">
          {report.errors.length > 0 ? (
            <span className="text-red-600 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {report.errors[0]}
            </span>
          ) : (
            <span>
              {report.totalVariationsCount} variations × {template.activeAspectRatios.length} formats ={' '}
              <strong className="text-blue-900 font-mono font-semibold">
                {report.totalVariationsCount * template.activeAspectRatios.length} files
              </strong>
            </span>
          )}
        </div>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'layers' && (
          <LayersTab
            layers={template.layers}
            selectedLayerId={selectedLayerId}
            assetGroup={assetGroup}
            isCarousel={template.templateType === 'carousel'}
            slideCount={template.slideCount}
            currentSlideIndex={currentSlideIndex}
            onUpdateAssetGroup={onUpdateAssetGroup}
            onSelectLayer={onSelectLayer}
            onToggleVisibility={onToggleVisibility}
            onMoveLayer={onMoveLayer}
            onDeleteLayer={onDeleteLayer}
            onToggleCarouselFixed={onToggleCarouselFixed}
            onToggleSlideAssignment={onToggleSlideAssignment}
          />
        )}

        {activeTab === 'dynamization' && (
          <DynamizationTab
            template={template}
            assetGroup={assetGroup}
            selectedLayerId={selectedLayerId}
            onSelectLayer={onSelectLayer}
            onUpdateLayerDynamization={onUpdateLayerDynamization}
            onUpdateTextDynamization={onUpdateTextDynamization}
            currentSlideIndex={currentSlideIndex}
          />
        )}

        {activeTab === 'export' && (
          <ExportTab
            template={template}
            assetGroup={assetGroup}
            variations={variations}
            report={report}
            currentVariationIndex={currentVariationIndex}
            onSelectVariationIndex={onSelectVariationIndex}
            projectName={projectName}
          />
        )}
      </div>
    </div>
  );
};

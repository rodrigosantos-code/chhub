import React, { useState } from 'react';
import {
  Building2,
  Layers,
  FolderTree,
  Plus,
  ChevronRight,
  Image as ImageIcon,
  Type,
  Palette,
  Package,
  Settings,
  Edit3,
  LayoutGrid,
} from 'lucide-react';
import { Project, MasterTemplate, AssetGroup, ASPECT_RATIOS } from '../types';

interface HomeDashboardProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onOpenTemplate: (projectId: string, templateId: string) => void;
  onOpenAssetGroup: (projectId: string, assetGroupId: string) => void;
  onNewProject: () => void;
  onManageBrand: (projectId: string) => void;
  onOpenProjectManager: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onOpenTemplate,
  onOpenAssetGroup,
  onNewProject,
  onManageBrand,
  onOpenProjectManager,
}) => {
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-slate-50 to-gray-100 overflow-hidden">
      {/* Top bar */}
      <div className="bg-white/80 backdrop-blur border-b border-gray-200 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
            <LayoutGrid className="w-5 h-5 text-blue-600" />
            All Brands
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {projects.length} brand{projects.length !== 1 ? 's' : ''} • Click to expand
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenProjectManager}
            className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-gray-300 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Manage Brands
          </button>
          <button
            onClick={onNewProject}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            New Brand
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-4">
          {projects.map((project) => {
            const isExpanded = expandedProjectId === project.id;
            const templateCount = project.templates.length;
            const assetGroupCount = project.assetGroups.length;

            return (
              <div
                key={project.id}
                className={`bg-white rounded-xl border transition-all duration-200 ${
                  isExpanded
                    ? 'border-blue-200 shadow-lg shadow-blue-100/50 ring-1 ring-blue-100'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {/* Brand header */}
                <button
                  onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
                  className="w-full px-5 py-4 flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      isExpanded ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-blue-50'
                    }`}>
                      <Building2 className={`w-5 h-5 ${isExpanded ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'}`} />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                        {project.name}
                        {project.id === activeProjectId && (
                          <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">ACTIVE</span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {templateCount} template{templateCount !== 1 ? 's' : ''} • {assetGroupCount} asset group{assetGroupCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-100">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-4">

                      {/* Templates column */}
                      <div>
                        <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5 mb-2.5">
                          <Layers className="w-3.5 h-3.5 text-blue-500" />
                          Templates ({templateCount})
                        </div>
                        <div className="space-y-1.5">
                          {project.templates.map((tpl) => (
                            <button
                              key={tpl.id}
                              onClick={() => onOpenTemplate(project.id, tpl.id)}
                              className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 transition-all cursor-pointer group text-left"
                            >
                              <div className="w-8 h-8 rounded-md bg-white border border-gray-200 flex items-center justify-center shrink-0">
                                <Layers className="w-4 h-4 text-blue-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[12px] font-semibold text-gray-800 group-hover:text-blue-700 truncate">
                                  {tpl.name}
                                </div>
                                <div className="text-[10px] text-gray-400 flex items-center gap-2 mt-0.5">
                                  <span>{tpl.layers.length} layers</span>
                                  <span>•</span>
                                  <span>{tpl.activeAspectRatios.join(', ')}</span>
                                </div>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                            </button>
                          ))}
                          {templateCount === 0 && (
                            <div className="text-[11px] text-gray-400 italic py-3 text-center">No templates yet</div>
                          )}
                        </div>
                      </div>

                      {/* Asset Groups column */}
                      <div>
                        <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5 mb-2.5">
                          <FolderTree className="w-3.5 h-3.5 text-emerald-500" />
                          Asset Groups ({assetGroupCount})
                        </div>
                        <div className="space-y-1.5">
                          {project.assetGroups.map((ag) => {
                            const bgCount = ag.folders.background?.length || 0;
                            const logoCount = (ag.folders.logo_1?.length || 0) + (ag.folders.logo_2?.length || 0) + (ag.folders.logo_3?.length || 0);
                            const productCount = (ag.folders.product_image_1?.length || 0) + (ag.folders.product_image_2?.length || 0) + (ag.folders.product_image_3?.length || 0);
                            const textCount = [ag.folders.texto_1, ag.folders.texto_2, ag.folders.texto_3, ag.folders.texto_4]
                              .filter((t: any) => {
                                if (t?.files && Array.isArray(t.files)) return t.files.some((f: any) => f.variations?.length > 0);
                                return t?.variations?.length > 0;
                              }).length;

                            return (
                              <button
                                key={ag.id}
                                onClick={() => onOpenAssetGroup(project.id, ag.id)}
                                className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 hover:bg-emerald-50 border border-gray-100 hover:border-emerald-200 transition-all cursor-pointer group text-left"
                              >
                                <div className="w-8 h-8 rounded-md bg-white border border-gray-200 flex items-center justify-center shrink-0">
                                  <Package className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[12px] font-semibold text-gray-800 group-hover:text-emerald-700 truncate">
                                    {ag.name}
                                  </div>
                                  <div className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    {bgCount > 0 && (
                                      <span className="flex items-center gap-0.5">
                                        <ImageIcon className="w-2.5 h-2.5" />{bgCount} bg
                                      </span>
                                    )}
                                    {logoCount > 0 && (
                                      <span className="flex items-center gap-0.5">
                                        <Palette className="w-2.5 h-2.5" />{logoCount} logos
                                      </span>
                                    )}
                                    {productCount > 0 && (
                                      <span className="flex items-center gap-0.5">
                                        <ImageIcon className="w-2.5 h-2.5" />{productCount} prod
                                      </span>
                                    )}
                                    {textCount > 0 && (
                                      <span className="flex items-center gap-0.5">
                                        <Type className="w-2.5 h-2.5" />{textCount} text
                                      </span>
                                    )}
                                    {bgCount === 0 && logoCount === 0 && productCount === 0 && textCount === 0 && (
                                      <span className="italic">Empty</span>
                                    )}
                                  </div>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                              </button>
                            );
                          })}
                          {assetGroupCount === 0 && (
                            <div className="text-[11px] text-gray-400 italic py-3 text-center">No asset groups yet</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom actions */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                      <button
                        onClick={() => onManageBrand(project.id)}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        Manage Brand
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {projects.length === 0 && (
            <div className="text-center py-20">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium">No brands yet</p>
              <button
                onClick={onNewProject}
                className="mt-3 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Create your first brand
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

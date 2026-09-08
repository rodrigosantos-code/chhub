import React, { useState } from 'react';
import { MasterTemplate, Project } from '../types';
import { Layers, Plus, Copy, Trash2, Edit3, Check, X, Eye } from 'lucide-react';

interface TemplatesOverviewProps {
  project: Project;
  onOpenTemplate: (templateId: string) => void;
  onCreateTemplate: () => void;
  onDuplicateTemplate: (templateId: string) => void;
  onDeleteTemplate: (templateId: string) => void;
  onRenameTemplate: (templateId: string, newName: string) => void;
}

export const TemplatesOverview: React.FC<TemplatesOverviewProps> = ({
  project,
  onOpenTemplate,
  onCreateTemplate,
  onDuplicateTemplate,
  onDeleteTemplate,
  onRenameTemplate,
}) => {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const startRename = (tpl: MasterTemplate) => {
    setRenamingId(tpl.id);
    setRenameValue(tpl.name);
  };

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      onRenameTemplate(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-slate-50 to-gray-100 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                Templates
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {project.templates.length} template{project.templates.length !== 1 ? 's' : ''} in {project.name}
              </p>
            </div>
            <button
              onClick={onCreateTemplate}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Template
            </button>
          </div>

          {/* Grid */}
          {project.templates.length === 0 ? (
            <div className="text-center py-20">
              <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <div className="text-gray-500 text-sm font-medium">No templates yet</div>
              <div className="text-gray-400 text-xs mt-1">Create your first template to start designing</div>
              <button
                onClick={onCreateTemplate}
                className="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center gap-2 mx-auto transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create Template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {project.templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer overflow-hidden"
                  onClick={() => onOpenTemplate(tpl.id)}
                >
                  {/* Preview area */}
                  <div className="h-36 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative">
                    <div className="text-center">
                      <Layers className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                      <div className="text-[10px] text-gray-400">{tpl.layers.length} layers</div>
                    </div>
                    {/* Quick actions overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-xs font-semibold text-blue-600">Open</span>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    {renamingId === tpl.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename();
                            if (e.key === 'Escape') setRenamingId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 text-sm font-semibold border border-blue-300 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-blue-400"
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); commitRename(); }}
                          className="p-1 rounded hover:bg-emerald-50 text-emerald-600 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setRenamingId(null); }}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-sm font-semibold text-gray-900 truncate flex items-center gap-1.5">
                        {tpl.name}
                        {tpl.templateType === 'carousel' && (
                          <span className="text-[9px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-bold shrink-0">
                            Carrusel · {tpl.slideCount} slides
                          </span>
                        )}
                      </div>
                    )}

                    {/* Ratios */}
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {tpl.activeAspectRatios.map((r) => (
                        <span key={r} className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[9px] font-bold">
                          {r}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); startRename(tpl); }}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                        title="Rename"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDuplicateTemplate(tpl.id); }}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {project.templates.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete "${tpl.name}"?`)) onDeleteTemplate(tpl.id);
                          }}
                          className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer ml-auto"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Add template card */}
              <button
                onClick={onCreateTemplate}
                className="bg-white/50 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[220px] group"
              >
                <Plus className="w-8 h-8 text-gray-300 group-hover:text-blue-500 transition-colors" />
                <span className="text-xs text-gray-400 group-hover:text-blue-600 font-medium mt-1.5 transition-colors">
                  New Template
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

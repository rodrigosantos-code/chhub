import React, { useState, useRef, useEffect } from 'react';
import {
  FolderTree,
  Layers,
  Sparkles,
  ChevronDown,
  Plus,
  Building2,
  Check,
  FolderOpen,
  Settings,
  Undo2,
  Redo2,
} from 'lucide-react';
import { AssetGroup, MasterTemplate, Project } from '../types';

interface HeaderProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onOpenProjectManager: () => void;
  onNewProject: () => void;

  activeTemplate: MasterTemplate;
  activeAssetGroup: AssetGroup;
  onSelectTemplate: (templateId: string) => void;
  onSelectAssetGroup: (assetGroupId: string) => void;
  onOpenAssetManager: () => void;
  onNewTemplate: () => void;
  onRenameTemplate: (templateId: string, newName: string) => void;
  onNewAssetGroup: () => void;
  totalVariationsCount: number;

  activeMode: 'templates' | 'asset_groups';
  onChangeMode: (mode: 'templates' | 'asset_groups') => void;

  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onOpenProjectManager,
  onNewProject,
  activeTemplate,
  activeAssetGroup,
  onSelectTemplate,
  onSelectAssetGroup,
  onOpenAssetManager,
  onNewTemplate,
  onRenameTemplate,
  onNewAssetGroup,
  totalVariationsCount,
  activeMode,
  onChangeMode,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) => {
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [renamingTemplateId, setRenamingTemplateId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [showAssetGroupMenu, setShowAssetGroupMenu] = useState(false);

  const currentProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  // Close menus on outside click
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowProjectMenu(false);
        setShowTemplateMenu(false);
        setShowAssetGroupMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      id="app-header"
      ref={menuRef}
      className="bg-white text-gray-900 border-b border-gray-100 px-5 py-3 flex flex-wrap items-center justify-between gap-3 select-none z-30"
    >
      {/* Left side: Brand + Project Selection + View Switcher */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Brand */}
        <div className="flex items-center gap-2 pr-1">
          <span className="font-extrabold text-sm tracking-tight text-gray-900">
            CH<span className="text-blue-600">hub</span>
          </span>
        </div>

        <div className="h-5 w-px bg-gray-200 hidden sm:block" />

        {/* 1. Project Selector (Debería dejarme elegir el proyecto) */}
        <div className="relative">
          <button
            id="project-selector-btn"
            onClick={() => {
              setShowProjectMenu(!showProjectMenu);
              setShowTemplateMenu(false);
              setShowAssetGroupMenu(false);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            title="Cambiar proyecto o marca"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="max-w-[140px] truncate">
              {currentProject ? currentProject.name : 'Seleccionar Proyecto'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          </button>

          {/* Project Dropdown */}
          {showProjectMenu && (
            <div className="absolute left-0 mt-1.5 w-72 bg-white border border-gray-200 rounded-xl shadow-2xl py-1.5 z-50 text-xs">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-gray-400 tracking-wider border-b border-gray-100 flex items-center justify-between">
                <span>Proyectos de Marca</span>
                <span className="font-mono">{projects.length}</span>
              </div>

              <div className="max-h-60 overflow-y-auto py-1">
                {projects.map((proj) => {
                  const isSelected = proj.id === activeProjectId;
                  return (
                    <button
                      key={proj.id}
                      onClick={() => {
                        onSelectProject(proj.id);
                        setShowProjectMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-50/70 text-blue-700 font-bold' : 'text-gray-700'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="truncate">{proj.name}</div>
                        <div className="text-[10px] text-gray-400 font-normal truncate">
                          {proj.templates.length} plantillas · {proj.assetGroups.length} grupos
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-gray-100 mt-1 pt-1.5 px-2 space-y-1">
                <button
                  onClick={() => {
                    setShowProjectMenu(false);
                    onNewProject();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-blue-600 hover:bg-blue-50 flex items-center gap-2 font-medium cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear Nuevo Proyecto</span>
                </button>
                <button
                  onClick={() => {
                    setShowProjectMenu(false);
                    onOpenProjectManager();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-gray-600 hover:bg-gray-100 flex items-center gap-2 font-medium cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-gray-500" />
                  <span>Gestionar todos los proyectos</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-gray-200 hidden sm:block" />

        {/* 2. Mode Selector: Plantillas vs Asset Groups */}
        <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
          <button
            onClick={() => onChangeMode('templates')}
            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'templates'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Plantillas</span>
            <span className="text-[10px] font-mono font-normal opacity-70">
              ({currentProject ? currentProject.templates.length : 0})
            </span>
          </button>

          <button
            onClick={() => onChangeMode('asset_groups')}
            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'asset_groups'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5 text-emerald-600" />
            <span>Recursos</span>
            <span className="text-[10px] font-mono font-normal opacity-70">
              ({currentProject ? currentProject.assetGroups.length : 0})
            </span>
          </button>
        </div>

        {/* 3. Contextual Dropdown according to Active Mode */}
        {activeMode === 'templates' && currentProject && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Template Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowTemplateMenu(!showTemplateMenu);
                  setShowAssetGroupMenu(false);
                  setShowProjectMenu(false);
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 text-xs font-medium transition-colors shadow-xs cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span className="max-w-[130px] truncate">{activeTemplate.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {showTemplateMenu && (
                <div className="absolute left-0 mt-1.5 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl py-1.5 z-50 text-xs">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-gray-400 tracking-wider border-b border-gray-100">
                    Plantillas del Proyecto
                  </div>
                  <div className="max-h-56 overflow-y-auto py-1">
                    {currentProject.templates.map((t) => (
                      <div
                        key={t.id}
                        className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer ${
                          t.id === activeTemplate.id
                            ? 'text-blue-600 font-bold bg-blue-50/60'
                            : 'text-gray-700'
                        }`}
                        onClick={() => {
                          if (renamingTemplateId) return;
                          onSelectTemplate(t.id);
                          if (t.id !== activeTemplate.id) setShowTemplateMenu(false);
                        }}
                      >
                        {renamingTemplateId === t.id ? (
                          <input
                            autoFocus
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => {
                              if (renameValue.trim()) onRenameTemplate(t.id, renameValue.trim());
                              setRenamingTemplateId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (renameValue.trim()) onRenameTemplate(t.id, renameValue.trim());
                                setRenamingTemplateId(null);
                              } else if (e.key === 'Escape') {
                                setRenamingTemplateId(null);
                              }
                            }}
                            className="flex-1 bg-white border border-blue-400 rounded px-1.5 py-0.5 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <>
                            <span
                              className="truncate flex-1"
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                setRenamingTemplateId(t.id);
                                setRenameValue(t.name);
                              }}
                            >
                              {t.name}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRenamingTemplateId(t.id);
                                setRenameValue(t.name);
                              }}
                              className="opacity-0 group-hover:opacity-100 hover:text-blue-600 text-gray-400 p-0.5 rounded transition-all cursor-pointer"
                              title="Renombrar"
                              style={{ opacity: 1 }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                            </button>
                          </>
                        )}
                        {t.id === activeTemplate.id && <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />}
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 mt-1 pt-1.5 px-2">
                    <button
                      onClick={() => {
                        setShowTemplateMenu(false);
                        onNewTemplate();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded text-xs text-blue-600 hover:bg-blue-50 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nueva Plantilla</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Linked Asset Group */}
            <div className="relative flex items-center gap-1.5">
              <span className="text-[11px] text-gray-400 hidden md:inline">Alimentado por:</span>
              <button
                onClick={() => {
                  setShowAssetGroupMenu(!showAssetGroupMenu);
                  setShowTemplateMenu(false);
                  setShowProjectMenu(false);
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 text-xs font-medium transition-colors shadow-xs cursor-pointer"
              >
                <FolderTree className="w-3.5 h-3.5 text-emerald-600" />
                <span className="max-w-[130px] truncate">{activeAssetGroup.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              <button
                onClick={onOpenAssetManager}
                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                title="Abrir carpetas de este Asset Group"
              >
                <FolderOpen className="w-3.5 h-3.5" />
              </button>

              {showAssetGroupMenu && (
                <div className="absolute left-0 mt-1.5 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl py-1.5 z-50 text-xs">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-gray-400 tracking-wider border-b border-gray-100">
                    Grupos de Recursos
                  </div>
                  <div className="max-h-56 overflow-y-auto py-1">
                    {currentProject.assetGroups.map((ag) => (
                      <button
                        key={ag.id}
                        onClick={() => {
                          onSelectAssetGroup(ag.id);
                          setShowAssetGroupMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${
                          ag.id === activeAssetGroup.id
                            ? 'text-emerald-700 font-bold bg-emerald-50/60'
                            : 'text-gray-700'
                        }`}
                      >
                        <span className="truncate">{ag.name}</span>
                        {ag.id === activeAssetGroup.id && (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 mt-1 pt-1.5 px-2">
                    <button
                      onClick={() => {
                        setShowAssetGroupMenu(false);
                        onNewAssetGroup();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded text-xs text-blue-600 hover:bg-blue-50 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nuevo Asset Group</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeMode === 'asset_groups' && currentProject && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500 font-medium">Grupo actual:</span>
            <div className="relative">
              <button
                onClick={() => {
                  setShowAssetGroupMenu(!showAssetGroupMenu);
                  setShowProjectMenu(false);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 text-xs font-semibold shadow-xs cursor-pointer"
              >
                <FolderTree className="w-3.5 h-3.5 text-emerald-600" />
                <span className="max-w-[150px] truncate">{activeAssetGroup.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {showAssetGroupMenu && (
                <div className="absolute left-0 mt-1.5 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl py-1.5 z-50 text-xs">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-gray-400 tracking-wider border-b border-gray-100">
                    Grupos de Recursos
                  </div>
                  <div className="max-h-56 overflow-y-auto py-1">
                    {currentProject.assetGroups.map((ag) => (
                      <button
                        key={ag.id}
                        onClick={() => {
                          onSelectAssetGroup(ag.id);
                          setShowAssetGroupMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${
                          ag.id === activeAssetGroup.id
                            ? 'text-emerald-700 font-bold bg-emerald-50/60'
                            : 'text-gray-700'
                        }`}
                      >
                        <span className="truncate">{ag.name}</span>
                        {ag.id === activeAssetGroup.id && (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 mt-1 pt-1.5 px-2">
                    <button
                      onClick={() => {
                        setShowAssetGroupMenu(false);
                        onNewAssetGroup();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded text-xs text-blue-600 hover:bg-blue-50 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nuevo Asset Group</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onNewAssetGroup}
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-medium flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Plus className="w-3 h-3 text-blue-600" />
              <span>Nuevo Grupo</span>
            </button>
          </div>
        )}
      </div>

      {/* Right side: Variations Counter and Project Status */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo Buttons */}
        <div className="flex items-center gap-0.5 bg-gray-50 p-0.5 rounded-lg border border-gray-200">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-md hover:bg-white hover:shadow-xs text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all cursor-pointer disabled:cursor-default"
            title="Deshacer (Ctrl+Z / ⌘Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-md hover:bg-white hover:shadow-xs text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all cursor-pointer disabled:cursor-default"
            title="Rehacer (Ctrl+Shift+Z / ⌘⇧Z)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeMode === 'templates' && (
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-gray-500 font-medium">Variaciones:</span>
            <span
              className={`font-mono font-bold ${
                totalVariationsCount > 0 ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              {totalVariationsCount}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};

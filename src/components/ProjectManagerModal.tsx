import React, { useState } from 'react';
import { Building2, Check, FolderTree, Layers, Plus, Trash2, X, Edit2 } from 'lucide-react';
import { Project } from '../types';

interface ProjectManagerModalProps {
  isOpen: boolean;
  projects: Project[];
  activeProjectId: string;
  onClose: () => void;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (name: string, description: string) => void;
  onUpdateProject: (projectId: string, name: string, description: string) => void;
  onDeleteProject: (projectId: string) => void;
  onLoadDemoProject?: () => void;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  projects,
  activeProjectId,
  onClose,
  onSelectProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onLoadDemoProject,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    onCreateProject(newProjectName.trim(), newProjectDesc.trim() || 'Proyecto de marca');
    setNewProjectName('');
    setNewProjectDesc('');
    setIsCreating(false);
  };

  const handleStartEdit = (p: Project) => {
    setEditingProjectId(p.id);
    setEditName(p.name);
    setEditDesc(p.description);
  };

  const handleSaveEdit = (projectId: string) => {
    if (!editName.trim()) return;
    onUpdateProject(projectId, editName.trim(), editDesc.trim());
    setEditingProjectId(null);
  };

  return (
    <div
      id="project-manager-modal"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 select-none"
    >
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden text-gray-800 text-xs">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-sm">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-gray-900">
                  Proyectos de Marcas
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                  CHhub
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Cada proyecto contiene sus propios Asset Groups y Plantillas Master.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {/* Projects List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Tus Proyectos ({projects.length})
              </span>
              {!isCreating && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Proyecto</span>
                </button>
              )}
            </div>

            {/* Create Project Form */}
            {isCreating && (
              <form
                onSubmit={handleCreate}
                className="p-3 bg-blue-50/50 border border-blue-200 rounded-lg space-y-3"
              >
                <div className="font-bold text-gray-900 text-xs">
                  Crear Nuevo Proyecto de Marca
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-600 block mb-1 uppercase">
                    Nombre del Proyecto / Marca *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="ej. Café Gourmet, Ropa Urbana, etc."
                    className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-600 block mb-1 uppercase">
                    Descripción (opcional)
                  </label>
                  <input
                    type="text"
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    placeholder="ej. Campaña publicitaria para redes sociales"
                    className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!newProjectName.trim()}
                    className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs disabled:opacity-40 cursor-pointer shadow-xs"
                  >
                    Crear y Abrir
                  </button>
                </div>
              </form>
            )}

            {/* Existing Projects */}
            <div className="space-y-2">
              {projects.map((p) => {
                const isActive = p.id === activeProjectId;
                const isEditing = editingProjectId === p.id;

                if (isEditing) {
                  return (
                    <div
                      key={p.id}
                      className="p-3 rounded-lg border border-blue-300 bg-blue-50/30 space-y-2"
                    >
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-900 font-bold outline-none focus:border-blue-500"
                      />
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Descripción"
                        className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-600 outline-none focus:border-blue-500"
                      />
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => setEditingProjectId(null)}
                          className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleSaveEdit(p.id)}
                          className="px-2.5 py-1 rounded bg-blue-600 text-white font-bold text-xs"
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectProject(p.id);
                      onClose();
                    }}
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isActive
                        ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-xs truncate">
                            {p.name}
                          </span>
                          {isActive && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-600 text-white">
                              Activo
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate">
                          {p.description || 'Sin descripción'}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3 text-blue-600" />
                            {p.templates.length} {p.templates.length === 1 ? 'Plantilla' : 'Plantillas'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <FolderTree className="w-3 h-3 text-emerald-600" />
                            {p.assetGroups.length} {p.assetGroups.length === 1 ? 'Asset Group' : 'Asset Groups'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleStartEdit(p)}
                        className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        title="Editar nombre"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {projects.length > 1 && (
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Seguro que deseas eliminar el proyecto "${p.name}"?`)) {
                              onDeleteProject(p.id);
                            }
                          }}
                          className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar proyecto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optional Demo Project Loader */}
          {onLoadDemoProject && (
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
              <span>¿Quieres ver cómo funciona con un ejemplo?</span>
              <button
                type="button"
                onClick={() => {
                  onLoadDemoProject();
                  onClose();
                }}
                className="text-blue-600 hover:underline font-medium cursor-pointer"
              >
                Cargar proyecto de ejemplo
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 flex justify-end bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

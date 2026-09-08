import React, { useState } from 'react';
import { AssetGroup, Project, AssetItem } from '../types';
import { FolderTree, Plus, Copy, Trash2, Edit3, Check, X, Eye, Image as ImageIcon, Type } from 'lucide-react';

interface AssetsOverviewProps {
  project: Project;
  onOpenAssetGroup: (assetGroupId: string) => void;
  onCreateAssetGroup: () => void;
  onDuplicateAssetGroup: (assetGroupId: string) => void;
  onDeleteAssetGroup: (assetGroupId: string) => void;
  onRenameAssetGroup: (assetGroupId: string, newName: string) => void;
}

export const AssetsOverview: React.FC<AssetsOverviewProps> = ({
  project,
  onOpenAssetGroup,
  onCreateAssetGroup,
  onDuplicateAssetGroup,
  onDeleteAssetGroup,
  onRenameAssetGroup,
}) => {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const startRename = (ag: AssetGroup) => {
    setRenamingId(ag.id);
    setRenameValue(ag.name);
  };

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      onRenameAssetGroup(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  const countAssets = (ag: AssetGroup) => {
    let images = 0;
    let texts = 0;
    const imageFolders: (keyof typeof ag.folders)[] = ['background', 'logo_1', 'logo_2', 'logo_3', 'product_image_1', 'product_image_2', 'product_image_3'];
    const textFolders: (keyof typeof ag.folders)[] = ['texto_1', 'texto_2', 'texto_3', 'texto_4'];
    for (const k of imageFolders) {
      images += (ag.folders[k] as AssetItem[]).length;
    }
    for (const k of textFolders) {
      const folder = ag.folders[k] as { files: { variations: string[] }[] };
      texts += folder.files.reduce((sum, f) => sum + f.variations.length, 0);
    }
    return { images, texts };
  };

  // Get first background image as preview
  const getPreviewUrl = (ag: AssetGroup): string | null => {
    const bg = ag.folders.background;
    if (bg.length > 0 && bg[0].url) return bg[0].url;
    const logo = ag.folders.logo_1;
    if (logo.length > 0 && logo[0].url) return logo[0].url;
    return null;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-slate-50 to-gray-100 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-emerald-600" />
                Asset Groups
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {project.assetGroups.length} group{project.assetGroups.length !== 1 ? 's' : ''} in {project.name}
              </p>
            </div>
            <button
              onClick={onCreateAssetGroup}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Asset Group
            </button>
          </div>

          {/* Grid */}
          {project.assetGroups.length === 0 ? (
            <div className="text-center py-20">
              <FolderTree className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <div className="text-gray-500 text-sm font-medium">No asset groups yet</div>
              <div className="text-gray-400 text-xs mt-1">Create your first asset group to organize your assets</div>
              <button
                onClick={onCreateAssetGroup}
                className="mt-4 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center gap-2 mx-auto transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create Asset Group
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {project.assetGroups.map((ag) => {
                const { images, texts } = countAssets(ag);
                const previewUrl = getPreviewUrl(ag);

                return (
                  <div
                    key={ag.id}
                    className="bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all group cursor-pointer overflow-hidden"
                    onClick={() => onOpenAssetGroup(ag.id)}
                  >
                    {/* Preview area */}
                    <div className="h-36 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative overflow-hidden">
                      {previewUrl ? (
                        <img src={previewUrl} alt={ag.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <FolderTree className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                          <div className="text-[10px] text-gray-400">No assets</div>
                        </div>
                      )}
                      {/* Quick actions overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-xs font-semibold text-emerald-600">Open</span>
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      {renamingId === ag.id ? (
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
                            className="flex-1 text-sm font-semibold border border-emerald-300 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-emerald-400"
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
                        <div className="text-sm font-semibold text-gray-900 truncate">{ag.name}</div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <ImageIcon className="w-3 h-3" />
                          <span>{images} images</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <Type className="w-3 h-3" />
                          <span>{texts} texts</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={(e) => { e.stopPropagation(); startRename(ag); }}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                          title="Rename"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDuplicateAssetGroup(ag.id); }}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {project.assetGroups.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete "${ag.name}"?`)) onDeleteAssetGroup(ag.id);
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
                );
              })}

              {/* Add asset group card */}
              <button
                onClick={onCreateAssetGroup}
                className="bg-white/50 rounded-xl border-2 border-dashed border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[220px] group"
              >
                <Plus className="w-8 h-8 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                <span className="text-xs text-gray-400 group-hover:text-emerald-600 font-medium mt-1.5 transition-colors">
                  New Asset Group
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Folder,
  FileText,
  Upload,
  Plus,
  Trash2,
  ArrowRightLeft,
  Sun,
  Moon,
  Check,
  X,
  Type,
  FolderTree,
  Sparkles,
  Loader2,
  CheckCircle2,
  ImagePlus,
  Square,
  Smartphone,
  Monitor,
  Copy,
  Image as ImageIcon,
  Crosshair,
} from 'lucide-react';
import { AssetItem, AssetGroup, FolderType, Tone, RatioImages } from '../types';
import { readMultipleImageFiles, readTextFiles } from '../utils/fileUploader';

interface AssetGroupWorkspaceProps {
  assetGroup: AssetGroup;
  allAssetGroups: AssetGroup[];
  onSelectAssetGroup: (id: string) => void;
  onNewAssetGroup: () => void;
  onDuplicateAssetGroup: (sourceGroupId: string) => void;
  onUpdateAssetGroup: (updatedGroup: AssetGroup) => void;
  onBackToEditor: () => void;
}

const FIXED_FOLDER_TABS: { key: FolderType; label: string; shortLabel: string; isText: boolean }[] = [
  { key: 'background', label: 'Fondos', shortLabel: 'BG', isText: false },
  { key: 'logo_1', label: 'Logo Principal', shortLabel: 'L1', isText: false },
  { key: 'logo_2', label: 'Logo Secundario', shortLabel: 'L2', isText: false },
  { key: 'logo_3', label: 'Logo 3', shortLabel: 'L3', isText: false },
  { key: 'product_image_1', label: 'Overlay 1', shortLabel: 'O1', isText: false },
  { key: 'product_image_2', label: 'Overlay 2', shortLabel: 'O2', isText: false },
  { key: 'product_image_3', label: 'Overlay 3', shortLabel: 'O3', isText: false },
  { key: 'texto_1', label: 'Headlines', shortLabel: 'T1', isText: true },
  { key: 'texto_2', label: 'Subtitles', shortLabel: 'T2', isText: true },
];

export const AssetGroupWorkspace: React.FC<AssetGroupWorkspaceProps> = ({
  assetGroup,
  allAssetGroups,
  onSelectAssetGroup,
  onNewAssetGroup,
  onDuplicateAssetGroup,
  onUpdateAssetGroup,
  onBackToEditor,
}) => {
  const [activeTab, setActiveTab] = useState<FolderType>('background');
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetUrl, setNewAssetUrl] = useState('');
  const [newAssetTone, setNewAssetTone] = useState<Tone>('dark');
  const [pairingModalItem, setPairingModalItem] = useState<AssetItem | null>(null);
  const [expandedRatioItemId, setExpandedRatioItemId] = useState<string | null>(null);
  const [expandedFocalItemId, setExpandedFocalItemId] = useState<string | null>(null);
  const [focalImgDims, setFocalImgDims] = useState<{ w: number; h: number } | null>(null);

  // Multi-upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTonePreference, setUploadTonePreference] = useState<Tone | 'auto'>('auto');
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [isMainDragOver, setIsMainDragOver] = useState(false);
  const [dragOverSidebarTab, setDragOverSidebarTab] = useState<FolderType | null>(null);

  const currentTabMeta = FIXED_FOLDER_TABS.find((t) => t.key === activeTab)!;

  // Add Single Item manually
  const handleAddItem = (
    folderKey: 'background' | 'logo_1' | 'logo_2' | 'logo_3' | 'product_image_1' | 'product_image_2' | 'product_image_3' | 'product_image_3'
  ) => {
    if (!newAssetName.trim()) return;

    const newItem: AssetItem = {
      id: `asset_${Date.now()}`,
      name: newAssetName.trim(),
      url:
        newAssetUrl.trim() ||
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" fill="%232563EB"><rect width="400" height="400" fill="%23EFF6FF"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="%232563EB">Recurso</text></svg>',
      tone: newAssetTone,
    };

    onUpdateAssetGroup({
      ...assetGroup,
      folders: {
        ...assetGroup.folders,
        [folderKey]: [...assetGroup.folders[folderKey], newItem],
      },
    });

    setNewAssetName('');
    setNewAssetUrl('');
  };

  // Multi-image file upload (Batch processing)
  const handleMultiFileUpload = async (
    folderKey: 'background' | 'logo_1' | 'logo_2' | 'logo_3' | 'product_image_1' | 'product_image_2' | 'product_image_3' | 'product_image_3',
    files: FileList | File[] | null
  ) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadFeedback(`Procesando ${files.length} imagen(es)...`);

    try {
      const newItems = await readMultipleImageFiles(files, uploadTonePreference);
      if (newItems.length > 0) {
        onUpdateAssetGroup({
          ...assetGroup,
          folders: {
            ...assetGroup.folders,
            [folderKey]: [...assetGroup.folders[folderKey], ...newItems],
          },
        });
        setUploadFeedback(`${newItems.length} image(s) added to ${folderKey}!`);
        setTimeout(() => setUploadFeedback(null), 4000);
      } else {
        setUploadFeedback('No valid image files detected.');
        setTimeout(() => setUploadFeedback(null), 3000);
      }
    } catch (err) {
      console.error('Error uploading multiple images:', err);
      setUploadFeedback('An error occurred while processing images.');
      setTimeout(() => setUploadFeedback(null), 4000);
    } finally {
      setIsUploading(false);
    }
  };

  // Multi-text file upload (.txt)
  const handleTextFileUpload = async (
    folderKey: 'texto_1' | 'texto_2' | 'texto_3' | 'texto_4',
    files: FileList | File[] | null
  ) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadFeedback(`Processing text file(s)...`);

    try {
      const phrases = await readTextFiles(files);
      if (phrases.length > 0) {
        const existing = assetGroup.folders[folderKey].variations;
        const combined = Array.from(new Set([...existing, ...phrases]));
        onUpdateAssetGroup({
          ...assetGroup,
          folders: {
            ...assetGroup.folders,
            [folderKey]: {
              ...assetGroup.folders[folderKey],
              content: combined.join(', '),
              variations: combined,
            },
          },
        });
        setUploadFeedback(`${phrases.length} phrases imported successfully!`);
        setTimeout(() => setUploadFeedback(null), 4000);
      } else {
        setUploadFeedback('No phrases found in the .txt file');
        setTimeout(() => setUploadFeedback(null), 3000);
      }
    } catch (err) {
      console.error('Error importing text file:', err);
      setUploadFeedback('Error reading the .txt file');
      setTimeout(() => setUploadFeedback(null), 4000);
    } finally {
      setIsUploading(false);
    }
  };

  // Remove Item
  const handleRemoveItem = (
    folderKey: 'background' | 'logo_1' | 'logo_2' | 'logo_3' | 'product_image_1' | 'product_image_2' | 'product_image_3' | 'product_image_3',
    itemId: string
  ) => {
    onUpdateAssetGroup({
      ...assetGroup,
      folders: {
        ...assetGroup.folders,
        [folderKey]: assetGroup.folders[folderKey].filter((it) => it.id !== itemId),
      },
    });
  };

  // Toggle tone
  const handleToggleTone = (
    folderKey: 'background' | 'logo_1' | 'logo_2' | 'logo_3' | 'product_image_1' | 'product_image_2' | 'product_image_3' | 'product_image_3',
    itemId: string
  ) => {
    onUpdateAssetGroup({
      ...assetGroup,
      folders: {
        ...assetGroup.folders,
        [folderKey]: assetGroup.folders[folderKey].map((it) =>
          it.id === itemId ? { ...it, tone: it.tone === 'dark' ? 'light' : 'dark' } : it
        ),
      },
    });
  };

  // Pair opposite tone item
  const handlePairOpposite = (
    folderKey: 'logo_1' | 'logo_2' | 'logo_3' | 'product_image_1' | 'product_image_2' | 'product_image_3' | 'product_image_3',
    itemId: string,
    oppositeId: string | undefined
  ) => {
    onUpdateAssetGroup({
      ...assetGroup,
      folders: {
        ...assetGroup.folders,
        [folderKey]: assetGroup.folders[folderKey].map((it) =>
          it.id === itemId ? { ...it, oppositeId } : it
        ),
      },
    });
  };

  // Update Text Folder
  const handleUpdateTextFolder = (folderKey: 'texto_1' | 'texto_2' | 'texto_3' | 'texto_4', rawContent: string) => {
    const variations = rawContent
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    onUpdateAssetGroup({
      ...assetGroup,
      folders: {
        ...assetGroup.folders,
        [folderKey]: {
          ...assetGroup.folders[folderKey],
          content: rawContent,
          variations,
        },
      },
    });
  };

  // Update ratio-specific image for a product image
  const handleUpdateRatioImage = (
    folderKey: 'product_image_1' | 'product_image_2' | 'product_image_3',
    itemId: string,
    ratioMode: keyof RatioImages,
    imageDataUrl: string | undefined
  ) => {
    onUpdateAssetGroup({
      ...assetGroup,
      folders: {
        ...assetGroup.folders,
        [folderKey]: assetGroup.folders[folderKey].map((it) => {
          if (it.id !== itemId) return it;
          const currentRatioUrls = it.ratioUrls || {};
          const newRatioUrls = { ...currentRatioUrls };
          if (imageDataUrl) {
            newRatioUrls[ratioMode] = imageDataUrl;
          } else {
            delete newRatioUrls[ratioMode];
          }
          return { ...it, ratioUrls: newRatioUrls };
        }),
      },
    });
  };

  // Read a single file to data URL
  const readFileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F3F4F6] overflow-hidden text-gray-800 text-xs">
      {/* Subheader */}
      <div className="bg-white border-b border-gray-200 px-5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4.5 h-4.5 text-blue-600" />
            <span className="font-bold text-sm text-gray-900">
              Recursos
            </span>
          </div>

          <div className="h-4 w-px bg-gray-200" />

          {/* Switch Asset Group */}
          <div className="flex items-center gap-1.5">
            <select
              value={assetGroup.id}
              onChange={(e) => onSelectAssetGroup(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 font-semibold text-xs text-gray-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 cursor-pointer transition-all"
            >
              {allAssetGroups.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name}
                </option>
              ))}
            </select>

            <button
              onClick={onNewAssetGroup}
              className="p-1.5 rounded-lg bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 text-gray-500 hover:text-blue-600 transition-all cursor-pointer"
              title="Create new asset group"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onDuplicateAssetGroup(assetGroup.id)}
              className="p-1.5 rounded-lg bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 text-gray-500 hover:text-emerald-600 transition-all cursor-pointer"
              title="Duplicate current asset group"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <button
          onClick={onBackToEditor}
          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
        >
          <span>Editor de Plantillas</span>
          <span className="text-blue-200">→</span>
        </button>
      </div>

      {/* Main Content: Left Folder List + Right Folder Content */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Fixed Folders Sidebar */}
        <div className="w-56 bg-white border border-gray-200 rounded-xl p-2 space-y-0.5 shadow-xs overflow-y-auto">
          <div className="px-2.5 py-1.5 text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center justify-between">
            <span>Folders</span>
            <span className="text-[9px] text-blue-500 font-medium">Drag here</span>
          </div>

          {FIXED_FOLDER_TABS.map((tab) => {
            const count = tab.isText
              ? assetGroup.folders[tab.key as 'texto_1' | 'texto_2' | 'texto_3' | 'texto_4'].variations.length
              : (assetGroup.folders[tab.key as keyof typeof assetGroup.folders] as AssetItem[]).length;
            const isSelected = activeTab === tab.key;
            const isDraggingOver = dragOverSidebarTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverSidebarTab(tab.key);
                }}
                onDragLeave={() => setDragOverSidebarTab(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverSidebarTab(null);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    setActiveTab(tab.key);
                    if (tab.isText) {
                      handleTextFileUpload(tab.key as 'texto_1' | 'texto_2' | 'texto_3' | 'texto_4', e.dataTransfer.files);
                    } else {
                      handleMultiFileUpload(
                        tab.key as
                          | 'background'
                          | 'logo_1'
                          | 'logo_2'
                          | 'product_image_1'
                          | 'product_image_2',
                        e.dataTransfer.files
                      );
                    }
                  }
                }}
                className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between transition-all cursor-pointer ${
                  isDraggingOver
                    ? 'bg-blue-100 text-blue-800 border-2 border-dashed border-blue-500 shadow-md scale-[1.02]'
                    : isSelected
                    ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {tab.isText ? (
                    <Type className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  ) : tab.key === 'background' ? (
                    <ImageIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  ) : (
                    <Folder className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  )}
                  <div className="truncate">
                    <span className="text-xs font-medium block truncate">{tab.label}</span>
                    <span className="text-[9px] text-gray-400 font-mono block">{tab.key}</span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0 ${
                    count > 0 ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Detail Pane */}
        <div className="flex-1 bg-white border border-gray-200 rounded-xl p-5 shadow-xs overflow-y-auto space-y-5">
          {/* Text Editor */}
          {currentTabMeta.isText ? (
            <div className="space-y-4 max-w-3xl">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-sm text-gray-900">
                    Text File: <code>{assetGroup.folders[activeTab as 'texto_1' | 'texto_2' | 'texto_3' | 'texto_4'].fileName}</code>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 cursor-pointer font-medium text-xs transition-colors shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Upload .txt file(s)</span>
                    <input
                      type="file"
                      accept=".txt,text/plain"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        handleTextFileUpload(activeTab as 'texto_1' | 'texto_2' | 'texto_3' | 'texto_4', e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2.5 py-1 rounded">
                    {assetGroup.folders[activeTab as 'texto_1' | 'texto_2' | 'texto_3' | 'texto_4'].variations.length} variations
                  </span>
                </div>
              </div>

              {uploadFeedback && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 px-3 py-2 rounded-lg text-xs flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{uploadFeedback}</span>
                </div>
              )}

              <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-lg text-xs text-gray-700 leading-relaxed">
                Enter text variants separated by commas or upload one or more <code>.txt</code>. Each phrase will automatically generate a dynamic variant.
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1.5">
                  Text file content (comma separated)
                </label>
                <textarea
                  rows={4}
                  value={assetGroup.folders[activeTab as 'texto_1' | 'texto_2' | 'texto_3' | 'texto_4'].content}
                  onChange={(e) =>
                    handleUpdateTextFolder(activeTab as 'texto_1' | 'texto_2' | 'texto_3' | 'texto_4', e.target.value)
                  }
                  placeholder="e.g. Summer sale, New collection 2026, 20% off in store..."
                  className="w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-900 font-sans text-xs focus:border-blue-500 outline-none leading-relaxed"
                />
              </div>

              {/* Badges */}
              <div>
                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">
                  Generated variants ({assetGroup.folders[activeTab as 'texto_1' | 'texto_2' | 'texto_3' | 'texto_4'].variations.length}):
                </div>
                {assetGroup.folders[activeTab as 'texto_1' | 'texto_2' | 'texto_3' | 'texto_4'].variations.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {assetGroup.folders[activeTab as 'texto_1' | 'texto_2' | 'texto_3' | 'texto_4'].variations.map((v, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 text-xs flex items-center gap-2"
                      >
                        <span className="text-[10px] font-mono text-blue-600 font-bold">#{i + 1}</span>
                        <span>{v}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    Write comma-separated text above or upload a .txt file to generate variations.
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Image / Logo / Background Editor */
            <div className="space-y-6 max-w-4xl">
              {/* Multi-file Drag & Drop & Upload Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsMainDragOver(true);
                }}
                onDragLeave={() => setIsMainDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsMainDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleMultiFileUpload(
                      activeTab as
                        | 'background'
                        | 'logo_1'
                        | 'logo_2'
                        | 'product_image_1'
                        | 'product_image_2',
                      e.dataTransfer.files
                    );
                  }
                }}
                className={`p-5 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center gap-2.5 ${
                  isMainDragOver
                    ? 'border-blue-500 bg-blue-50/90 scale-[1.01] shadow-md'
                    : 'border-blue-300/80 bg-blue-50/40 hover:bg-blue-50/60'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <div className="font-bold text-gray-900 text-xs flex items-center justify-center gap-1.5">
                    <span>Upload multiple images at once to</span>
                    <code className="font-mono text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded font-bold">
                      {activeTab}
                    </code>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5 max-w-md">
                    Drag multiple images (PNG, JPG, SVG, WebP) here or click the button to select them all at once.
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2.5 mt-1">
                  <label className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Select multiple images...</span>
                    <input
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif,image/avif"
                      className="hidden"
                      onChange={(e) => {
                        handleMultiFileUpload(
                          activeTab as
                            | 'background'
                            | 'logo_1'
                            | 'logo_2'
                            | 'product_image_1'
                            | 'product_image_2',
                          e.target.files
                        );
                        e.target.value = '';
                      }}
                    />
                  </label>

                  {/* Batch Tone Preference */}
                  <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs shadow-2xs">
                    <span className="text-[11px] text-gray-500 font-medium">Asignar Tono:</span>
                    <select
                      value={uploadTonePreference}
                      onChange={(e) => setUploadTonePreference(e.target.value as Tone | 'auto')}
                      className="text-xs font-semibold text-gray-800 bg-transparent outline-none cursor-pointer"
                      title="Auto-detect tone by analyzing file luminosity or set a tone for the batch"
                    >
                      <option value="auto">✨ Auto-detectar (Luminancia)</option>
                      <option value="dark">🌙 Tono Oscuro (Dark)</option>
                      <option value="light">☀️ Tono Claro (Light)</option>
                    </select>
                  </div>
                </div>

                {uploadFeedback && (
                  <div className="mt-1 bg-white border border-blue-300 text-blue-800 font-semibold px-3 py-1 rounded-full text-[11px] shadow-xs flex items-center gap-1.5 animate-fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>{uploadFeedback}</span>
                  </div>
                )}
              </div>

              {/* Add form: Manual single entry / URL */}
              <details className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2 group">
                <summary className="font-semibold text-gray-700 text-xs flex items-center justify-between cursor-pointer list-none">
                  <span className="flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    <span>Or add image individually by URL or custom name</span>
                  </span>
                  <span className="text-[10px] text-gray-400 group-open:rotate-180 transition-transform">▾</span>
                </summary>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Asset name (e.g. White Logo)"
                    value={newAssetName}
                    onChange={(e) => setNewAssetName(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-gray-800 outline-none focus:border-blue-500 text-xs sm:col-span-2"
                  />

                  <select
                    value={newAssetTone}
                    onChange={(e) => setNewAssetTone(e.target.value as Tone)}
                    className="bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-800 text-xs outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="dark">Tono Oscuro (Dark)</option>
                    <option value="light">Tono Claro (Light)</option>
                  </select>

                  <button
                    onClick={() =>
                      handleAddItem(
                        activeTab as
                          | 'background'
                          | 'logo_1'
                          | 'logo_2'
                          | 'product_image_1'
                          | 'product_image_2'
                      )
                    }
                    disabled={!newAssetName.trim()}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </details>

              {/* Files in folder list */}
              <div className="space-y-3">
                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  Files in this folder (
                  {(assetGroup.folders[activeTab as keyof typeof assetGroup.folders] as AssetItem[]).length}
                  )
                </div>

                {(assetGroup.folders[activeTab as keyof typeof assetGroup.folders] as AssetItem[]).length === 0 ? (
                  <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-xs">
                    No files in folder <code>{activeTab}</code>. Upload an image or add an asset above to get started.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(
                      assetGroup.folders[
                        activeTab as
                          | 'background'
                          | 'logo_1'
                          | 'logo_2'
                          | 'product_image_1'
                          | 'product_image_2'
                      ] as AssetItem[]
                    ).map((item) => {
                      const oppositeItem = item.oppositeId
                        ? (
                            assetGroup.folders[
                              activeTab as
                                | 'logo_1'
                                | 'logo_2'
                                | 'product_image_1'
                                | 'product_image_2'
                            ] as AssetItem[]
                          ).find((it) => it.id === item.oppositeId)
                        : null;

                      return (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl bg-white border border-gray-200 hover:border-gray-300 shadow-xs"
                        >
                         <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 truncate">
                            {/* Preview */}
                            {/* Preview with focal point indicator */}
                            <div className="relative w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 p-1">
                              <img
                                src={item.url}
                                alt={item.name}
                                className="w-full h-full object-contain"
                              />
                              {activeTab === 'background' && item.focalPoint && (
                                <div
                                  className="absolute w-1.5 h-1.5 rounded-full bg-orange-500 border border-white shadow-sm pointer-events-none"
                                  style={{
                                    left: `${item.focalPoint.x * 100}%`,
                                    top: `${item.focalPoint.y * 100}%`,
                                    transform: 'translate(-50%, -50%)',
                                  }}
                                  title={`Sujeto: ${Math.round(item.focalPoint.x * 100)}%, ${Math.round(item.focalPoint.y * 100)}%`}
                                />
                              )}
                            </div>

                            <div className="truncate">
                              <div className="font-bold text-gray-900 text-xs truncate">
                                {item.name}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <button
                                  onClick={() =>
                                    handleToggleTone(
                                      activeTab as
                                        | 'background'
                                        | 'logo_1'
                                        | 'logo_2'
                                        | 'product_image_1'
                                        | 'product_image_2',
                                      item.id
                                    )
                                  }
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border transition-colors cursor-pointer ${
                                    item.tone === 'dark'
                                      ? 'bg-gray-100 text-gray-700 border-gray-200'
                                      : 'bg-amber-50 text-amber-800 border-amber-200'
                                  }`}
                                  title="Alternar tono claro/oscuro"
                                >
                                  {item.tone === 'dark' ? (
                                    <>
                                      <Moon className="w-2.5 h-2.5 text-gray-500" />
                                      <span>Oscuro</span>
                                    </>
                                  ) : (
                                    <>
                                      <Sun className="w-2.5 h-2.5 text-amber-600" />
                                      <span>Claro</span>
                                    </>
                                  )}
                                </button>

                                {activeTab !== 'background' && (
                                  <span className="text-[10px] text-gray-500 truncate">
                                    {oppositeItem ? (
                                      <span className="text-blue-600 font-medium">
                                        Contrario: {oppositeItem.name}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">No opposite version</span>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Ratio Images Button (only for product_image folders) */}
                            {(activeTab === 'product_image_1' || activeTab === 'product_image_2' || activeTab === 'product_image_3') && (
                              <button
                                onClick={() =>
                                  setExpandedRatioItemId(
                                    expandedRatioItemId === item.id ? null : item.id
                                  )
                                }
                                className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 border transition-colors cursor-pointer ${
                                  expandedRatioItemId === item.id
                                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                                    : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                                }`}
                                title="Manage images per ratio (Square, Portrait, Landscape)"
                              >
                                <ImagePlus className="w-3 h-3 text-blue-600" />
                                <span className="hidden sm:inline">Ratios</span>
                                {item.ratioUrls && Object.keys(item.ratioUrls).length > 0 && (
                                  <span className="bg-blue-600 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                                    {Object.keys(item.ratioUrls).length}
                                  </span>
                                )}
                              </button>
                            )}

                            {activeTab !== 'background' && (
                              <button
                                onClick={() => setPairingModalItem(item)}
                                className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 border cursor-pointer transition-colors ${
                                  item.oppositeId
                                    ? 'bg-green-50 text-green-700 border-green-300'
                                    : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                                }`}
                                title="Link with opposite version (light or dark)"
                              >
                                <ArrowRightLeft className="w-3 h-3 text-blue-600" />
                                <span className="hidden sm:inline">Vincular</span>
                              </button>
                            )}

                            {/* Negative Fill Color (alternative to pairing) */}
                            {activeTab !== 'background' && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    const folderKey = activeTab as 'background' | 'logo_1' | 'logo_2' | 'logo_3' | 'product_image_1' | 'product_image_2' | 'product_image_3';
                                    const folder = assetGroup.folders[folderKey];
                                    if (Array.isArray(folder)) {
                                      const updated = folder.map((a: AssetItem) =>
                                        a.id === item.id
                                          ? { ...a, negativeFillColor: a.negativeFillColor ? undefined : '#FFFFFF' }
                                          : a
                                      );
                                      onUpdateAssetGroup({ ...assetGroup, folders: { ...assetGroup.folders, [folderKey]: updated } });
                                    }
                                  }}
                                  className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 border cursor-pointer transition-colors ${
                                    item.negativeFillColor
                                      ? 'bg-purple-50 text-purple-700 border-purple-300'
                                      : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                                  }`}
                                  title="Create negative with solid color (alternative to linking)"
                                >
                                  <span className="w-3 h-3 rounded-sm border border-gray-300" style={{
                                    background: item.negativeFillColor || '#ccc',
                                  }} />
                                  <span className="hidden sm:inline">Negativo</span>
                                </button>
                                {item.negativeFillColor && (
                                  <input
                                    type="color"
                                    value={item.negativeFillColor}
                                    onChange={(e) => {
                                      const folderKey = activeTab as 'background' | 'logo_1' | 'logo_2' | 'logo_3' | 'product_image_1' | 'product_image_2' | 'product_image_3';
                                      const folder = assetGroup.folders[folderKey];
                                      if (Array.isArray(folder)) {
                                        const updated = folder.map((a: AssetItem) =>
                                          a.id === item.id ? { ...a, negativeFillColor: e.target.value } : a
                                        );
                                        onUpdateAssetGroup({ ...assetGroup, folders: { ...assetGroup.folders, [folderKey]: updated } });
                                      }
                                    }}
                                    className="w-5 h-5 rounded cursor-pointer border border-gray-300 bg-transparent"
                                    title="Color del negativo"
                                  />
                                )}
                              </div>
                            )}

                            <button
                              onClick={() =>
                                handleRemoveItem(
                                  activeTab as
                                    | 'background'
                                    | 'logo_1'
                                    | 'logo_2'
                                    | 'product_image_1'
                                    | 'product_image_2',
                                  item.id
                                )
                              }
                              className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Focal Point Button (background only) */}
                            {activeTab === 'background' && (
                              <button
                                onClick={() =>
                                  setExpandedFocalItemId(
                                    expandedFocalItemId === item.id ? null : item.id
                                  )
                                }
                                className={`p-1.5 rounded transition-colors cursor-pointer ${
                                  expandedFocalItemId === item.id
                                    ? 'text-orange-600 bg-orange-50'
                                    : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                                }`}
                                title="Edit detected focal point"
                              >
                                <Crosshair className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Expandable Ratio Images Section (product images only) */}
                        {expandedRatioItemId === item.id &&
                          (activeTab === 'product_image_1' || activeTab === 'product_image_2' || activeTab === 'product_image_3') && (
                            <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
                              <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5">
                                <ImagePlus className="w-3 h-3 text-blue-600" />
                                Images per Ratio
                                <span className="text-[9px] text-gray-400 font-normal normal-case">
                                  (se usa la principal si no se asigna)
                                </span>
                              </div>

                              {[
                                { key: 'square' as keyof RatioImages, label: 'Square (1:1)', icon: Square, desc: 'Feed Instagram' },
                                { key: 'portrait' as keyof RatioImages, label: 'Portrait (9:16 / 4:5)', icon: Smartphone, desc: 'Stories, Reels' },
                                { key: 'landscape' as keyof RatioImages, label: 'Landscape (16:9)', icon: Monitor, desc: 'Twitter, Web' },
                              ].map((ratio) => {
                                const currentUrl = item.ratioUrls?.[ratio.key];
                                const RatioIcon = ratio.icon;
                                return (
                                  <div
                                    key={ratio.key}
                                    className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50/80 border border-gray-100"
                                  >
                                    {/* Thumbnail */}
                                    <div className="w-10 h-10 rounded-md bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                                      {currentUrl ? (
                                        <img
                                          src={currentUrl}
                                          alt={`${item.name} ${ratio.label}`}
                                          className="w-full h-full object-contain"
                                        />
                                      ) : (
                                        <RatioIcon className="w-4 h-4 text-gray-300" />
                                      )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="text-[11px] font-semibold text-gray-700 flex items-center gap-1.5">
                                        <RatioIcon className="w-3 h-3 text-gray-400" />
                                        {ratio.label}
                                      </div>
                                      <div className="text-[10px] text-gray-400">
                                        {currentUrl ? 'Imagen asignada ✓' : ratio.desc}
                                      </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 shrink-0">
                                      <label className="px-2 py-1 rounded bg-white hover:bg-blue-50 text-blue-600 border border-gray-200 hover:border-blue-300 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors">
                                        <Upload className="w-2.5 h-2.5" />
                                        <span>{currentUrl ? 'Change' : 'Subir'}</span>
                                        <input
                                          type="file"
                                          accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif,image/avif"
                                          className="hidden"
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              const dataUrl = await readFileToDataUrl(file);
                                              handleUpdateRatioImage(
                                                activeTab as 'product_image_1' | 'product_image_2' | 'product_image_3',
                                                item.id,
                                                ratio.key,
                                                dataUrl
                                              );
                                            }
                                            e.target.value = '';
                                          }}
                                        />
                                      </label>
                                      {currentUrl && (
                                        <button
                                          onClick={() =>
                                            handleUpdateRatioImage(
                                              activeTab as 'product_image_1' | 'product_image_2' | 'product_image_3',
                                              item.id,
                                              ratio.key,
                                              undefined
                                            )
                                          }
                                          className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                          title="Delete image for this ratio"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                        {/* Expandable Focal Point Editor */}
                        {expandedFocalItemId === item.id && (() => {
                          const fp = item.focalPoint || { x: 0.5, y: 0.5 };
                          const folderKey = activeTab as 'background' | 'logo_1' | 'logo_2' | 'logo_3' | 'product_image_1' | 'product_image_2' | 'product_image_3' | 'product_image_3';

                          const updateFP = (newFP: { x: number; y: number }) => {
                            const folder = assetGroup.folders[folderKey];
                            if (Array.isArray(folder)) {
                              const updated = folder.map((a: AssetItem) =>
                                a.id === item.id ? { ...a, focalPoint: newFP } : a
                              );
                              onUpdateAssetGroup({ ...assetGroup, folders: { ...assetGroup.folders, [folderKey]: updated } });
                            }
                          };

                          // Compute click → image coordinates accounting for container aspect ratio
                          const handleClickOnPreview = (e: React.MouseEvent<HTMLDivElement>) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const imgEl = e.currentTarget.querySelector('img') as HTMLImageElement;
                            if (!imgEl || !imgEl.naturalWidth) return;

                            const nw = imgEl.naturalWidth;
                            const nh = imgEl.naturalHeight;
                            const cw = rect.width;
                            const ch = rect.height;
                            const imgAspect = nw / nh;
                            const containerAspect = cw / ch;

                            let rw: number, rh: number, ox: number, oy: number;
                            if (imgAspect > containerAspect) {
                              rw = cw; rh = cw / imgAspect; ox = 0; oy = (ch - rh) / 2;
                            } else {
                              rh = ch; rw = ch * imgAspect; ox = (cw - rw) / 2; oy = 0;
                            }

                            const relX = e.clientX - rect.left - ox;
                            const relY = e.clientY - rect.top - oy;
                            if (relX < 0 || relX > rw || relY < 0 || relY > rh) return;

                            const fx = Math.max(0.02, Math.min(0.98, relX / rw));
                            const fy = Math.max(0.02, Math.min(0.98, relY / rh));
                            updateFP({ x: Math.round(fx * 100) / 100, y: Math.round(fy * 100) / 100 });
                          };

                          // Compute indicator position from image dims
                          let indicatorStyle: React.CSSProperties = { left: '50%', top: '50%' };
                          if (focalImgDims) {
                            const CONTAINER_W = 280; // must match CSS max-w
                            const MAX_H = 320;
                            const imgAspect = focalImgDims.w / focalImgDims.h;
                            // container height from aspect ratio, capped
                            const containerH = Math.min(MAX_H, CONTAINER_W / imgAspect);
                            const containerW = CONTAINER_W;
                            const containerAspect = containerW / containerH;

                            let rw: number, rh: number, ox: number, oy: number;
                            if (imgAspect > containerAspect) {
                              rw = containerW; rh = containerW / imgAspect; ox = 0; oy = (containerH - rh) / 2;
                            } else {
                              rh = containerH; rw = containerH * imgAspect; ox = (containerW - rw) / 2; oy = 0;
                            }
                            indicatorStyle = {
                              left: ox + fp.x * rw,
                              top: oy + fp.y * rh,
                            };
                          }

                          return (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5">
                                  <Crosshair className="w-3 h-3 text-orange-500" />
                                  Focal Point
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-mono font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                                    {Math.round(fp.x * 100)}%, {Math.round(fp.y * 100)}%
                                  </span>
                                  {(fp.x !== 0.5 || fp.y !== 0.5) && (
                                    <button
                                      type="button"
                                      onClick={() => updateFP({ x: 0.5, y: 0.5 })}
                                      className="text-[9px] text-orange-600 hover:text-orange-800 underline font-semibold cursor-pointer"
                                    >
                                      Reset
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Large interactive preview */}
                              <div
                                className="relative w-full max-w-[280px] bg-gray-100 rounded-lg border border-gray-300 cursor-crosshair overflow-hidden mx-auto"
                                style={{ maxHeight: 320 }}
                                onClick={handleClickOnPreview}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  const container = e.currentTarget;
                                  const onMove = (ev: MouseEvent) => {
                                    const synth = { ...ev, currentTarget: container } as unknown as React.MouseEvent<HTMLDivElement>;
                                    handleClickOnPreview(synth);
                                  };
                                  const onUp = () => {
                                    document.removeEventListener('mousemove', onMove);
                                    document.removeEventListener('mouseup', onUp);
                                  };
                                  document.addEventListener('mousemove', onMove);
                                  document.addEventListener('mouseup', onUp);
                                }}
                                title="Click or drag to place the focal point"
                              >
                                <img
                                  src={item.url}
                                  alt=""
                                  className="w-full h-full object-contain"
                                  onLoad={(e) => {
                                    const img = e.currentTarget;
                                    setFocalImgDims({ w: img.naturalWidth, h: img.naturalHeight });
                                  }}
                                />

                                {/* Crosshair lines */}
                                <div
                                  className="absolute pointer-events-none z-10"
                                  style={{ left: indicatorStyle.left, top: 0, bottom: 0, width: 1 }}
                                >
                                  <div className="w-full h-full bg-orange-400/40" />
                                </div>
                                <div
                                  className="absolute pointer-events-none z-10"
                                  style={{ top: indicatorStyle.top, left: 0, right: 0, height: 1 }}
                                >
                                  <div className="w-full h-full bg-orange-400/40" />
                                </div>

                                {/* Focal dot */}
                                <div
                                  className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 z-20"
                                  style={indicatorStyle}
                                >
                                  <div className="w-4 h-4 rounded-full border-2 border-orange-500 bg-orange-400/30 shadow-lg ring-2 ring-white/60" />
                                </div>
                              </div>

                              <p className="text-[10px] text-gray-400 mt-1.5 text-center italic">
                                Click or drag on the image to correct the subject position.
                              </p>
                            </div>
                          );
                        })()}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pairing Sub-Modal */}
      {pairingModalItem && (
        <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 max-w-md w-full space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <span className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                Associate Opposite Option
              </span>
              <button
                onClick={() => setPairingModalItem(null)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[11px] text-gray-600 leading-relaxed">
              Select the opposite version for{' '}
              <strong className="text-gray-900">"{pairingModalItem.name}"</strong> (
              {pairingModalItem.tone === 'dark' ? 'Dark Version' : 'Light Version'}). When contrast dynamization is applied, it will be automatically substituted based on the background tone.
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pt-1">
              <button
                onClick={() => {
                  handlePairOpposite(
                    activeTab as
                      | 'logo_1'
                      | 'logo_2'
                      | 'product_image_1'
                      | 'product_image_2',
                    pairingModalItem.id,
                    undefined
                  );
                  setPairingModalItem(null);
                }}
                className="w-full text-left p-2 rounded bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 text-xs cursor-pointer"
              >
                None (no opposite option)
              </button>

              {(
                assetGroup.folders[
                  activeTab as
                    | 'logo_1'
                    | 'logo_2'
                    | 'product_image_1'
                    | 'product_image_2'
                ] as AssetItem[]
              )
                .filter((candidate) => candidate.id !== pairingModalItem.id)
                .map((candidate) => (
                  <button
                    key={candidate.id}
                    onClick={() => {
                      handlePairOpposite(
                        activeTab as
                          | 'logo_1'
                          | 'logo_2'
                          | 'product_image_1'
                          | 'product_image_2',
                        pairingModalItem.id,
                        candidate.id
                      );
                      setPairingModalItem(null);
                    }}
                    className="w-full text-left p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-between text-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{candidate.name}</span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        ({candidate.tone === 'dark' ? 'Oscuro' : 'Claro'})
                      </span>
                    </div>
                    {pairingModalItem.oppositeId === candidate.id && (
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                    )}
                  </button>
                ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                onClick={() => setPairingModalItem(null)}
                className="px-3 py-1.5 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  X,
  Folder,
  Image as ImageIcon,
  Type,
  Plus,
  Trash2,
  ArrowRightLeft,
  Sun,
  Moon,
  Upload,
  Check,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import {
  AssetGroup,
  AssetItem,
  FolderType,
  TextFolderData,
  Tone,
} from '../types';
import { readMultipleImageFiles, readTextFiles } from '../utils/fileUploader';

interface AssetGroupManagerModalProps {
  isOpen: boolean;
  assetGroup: AssetGroup;
  onClose: () => void;
  onUpdateAssetGroup: (updatedGroup: AssetGroup) => void;
}

const FIXED_FOLDER_TABS: { key: FolderType; label: string; isText: boolean }[] = [
  { key: 'background_1', label: 'background_1', isText: false },
  { key: 'background_2', label: 'background_2', isText: false },
  { key: 'background_3', label: 'background_3', isText: false },
  { key: 'logo_1', label: 'logo_1', isText: false },
  { key: 'logo_2', label: 'logo_2', isText: false },
  { key: 'logo_3', label: 'logo_3', isText: false },
  { key: 'product_image_1', label: 'overlay_1', isText: false },
  { key: 'product_image_2', label: 'overlay_2', isText: false },
  { key: 'product_image_3', label: 'overlay_3', isText: false },
  { key: 'texto_1', label: 'texto_1', isText: true },
  { key: 'texto_2', label: 'texto_2', isText: true },
  { key: 'texto_3', label: 'texto_3', isText: true },
  { key: 'texto_4', label: 'texto_4', isText: true },
];

export const AssetGroupManagerModal: React.FC<AssetGroupManagerModalProps> = ({
  isOpen,
  assetGroup,
  onClose,
  onUpdateAssetGroup,
}) => {
  const [activeTab, setActiveTab] = useState<FolderType>('background_1');
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetUrl, setNewAssetUrl] = useState('');
  const [newAssetTone, setNewAssetTone] = useState<Tone>('dark');
  const [uploadTonePreference, setUploadTonePreference] = useState<Tone | 'auto'>('auto');
  const [pairingModalItem, setPairingModalItem] = useState<AssetItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  if (!isOpen) return null;

  const currentTabMeta = FIXED_FOLDER_TABS.find((t) => t.key === activeTab)!;

  // Add new image asset
  const handleAddAsset = (folderKey: 'background_1' | 'background_2' | 'background_3' | 'logo_1' | 'logo_2' | 'logo_3' | 'product_image_1' | 'product_image_2' | 'product_image_3') => {
    if (!newAssetName.trim()) return;

    const newItem: AssetItem = {
      id: `asset_${Date.now()}`,
      name: newAssetName.trim(),
      url: newAssetUrl.trim() || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="%23e2e8f0"/><text x="200" y="200" font-size="24" text-anchor="middle" fill="%23475569">Placeholder</text></svg>',
      tone: newAssetTone,
    };

    const updatedFolders = {
      ...assetGroup.folders,
      [folderKey]: [...assetGroup.folders[folderKey], newItem],
    };

    onUpdateAssetGroup({
      ...assetGroup,
      folders: updatedFolders,
    });

    setNewAssetName('');
    setNewAssetUrl('');
  };

  // Remove asset
  const handleRemoveAsset = (folderKey: 'background_1' | 'background_2' | 'background_3' | 'logo_1' | 'logo_2' | 'logo_3' | 'product_image_1' | 'product_image_2' | 'product_image_3', assetId: string) => {
    const updated = assetGroup.folders[folderKey].filter((a) => a.id !== assetId);
    onUpdateAssetGroup({
      ...assetGroup,
      folders: {
        ...assetGroup.folders,
        [folderKey]: updated,
      },
    });
  };

  // Update tone of asset (claro ↔ oscuro)
  const handleToggleTone = (folderKey: 'background_1' | 'background_2' | 'background_3' | 'logo_1' | 'logo_2' | 'logo_3' | 'product_image_1' | 'product_image_2' | 'product_image_3', assetId: string) => {
    const updated = assetGroup.folders[folderKey].map((a) => {
      if (a.id === assetId) {
        return { ...a, tone: (a.tone === 'dark' ? 'light' : 'dark') as Tone };
      }
      return a;
    });

    onUpdateAssetGroup({
      ...assetGroup,
      folders: {
        ...assetGroup.folders,
        [folderKey]: updated,
      },
    });
  };

  // Pair opposite asset (Section 6.1)
  const handlePairOpposite = (
    folderKey: 'logo_1' | 'logo_2' | 'logo_3' | 'product_image_1' | 'product_image_2' | 'product_image_3',
    primaryId: string,
    oppositeId: string | undefined
  ) => {
    const updated = assetGroup.folders[folderKey].map((a) => {
      if (a.id === primaryId) {
        return { ...a, oppositeId };
      }
      // Also reciprocally link if oppositeId is set
      if (oppositeId && a.id === oppositeId) {
        return { ...a, oppositeId: primaryId };
      }
      return a;
    });

    onUpdateAssetGroup({
      ...assetGroup,
      folders: {
        ...assetGroup.folders,
        [folderKey]: updated,
      },
    });

    setPairingModalItem(null);
  };

  // Update text file in a folder
  const handleUpdateTextFile = (folderKey: 'texto_1' | 'texto_2' | 'texto_3' | 'texto_4', fileId: string, newContent: string) => {
    const vars = newContent.split(',').map((v) => v.trim()).filter((v) => v.length > 0);
    const folder = assetGroup.folders[folderKey];
    onUpdateAssetGroup({
      ...assetGroup,
      folders: {
        ...assetGroup.folders,
        [folderKey]: {
          files: folder.files.map((f) =>
            f.id === fileId ? { ...f, content: newContent, variations: vars } : f
          ),
        },
      },
    });
  };

  // Batch Image Upload
  const handleBatchImageUpload = async (
    folderKey: 'background_1' | 'background_2' | 'background_3' | 'logo_1' | 'logo_2' | 'logo_3' | 'product_image_1' | 'product_image_2' | 'product_image_3',
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
        setUploadFeedback(`${newItems.length} images added!`);
        setTimeout(() => setUploadFeedback(null), 3500);
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      setUploadFeedback('Error processing images');
      setTimeout(() => setUploadFeedback(null), 3000);
    } finally {
      setIsUploading(false);
    }
  };

  // Text file upload (.txt)
  const handleTextFileUpload = async (
    folderKey: 'texto_1' | 'texto_2' | 'texto_3' | 'texto_4',
    files: FileList | File[] | null
  ) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const phrases = await readTextFiles(files);
      if (phrases.length > 0) {
        const folder = assetGroup.folders[folderKey];
        const newFile = {
          id: `tf_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          fileName: files[0] instanceof File ? files[0].name : 'imported.txt',
          content: phrases.join(', '),
          variations: phrases,
        };
        onUpdateAssetGroup({
          ...assetGroup,
          folders: {
            ...assetGroup.folders,
            [folderKey]: { files: [...folder.files, newFile] },
          },
        });
        setUploadFeedback(`${phrases.length} phrases imported!`);
        setTimeout(() => setUploadFeedback(null), 3500);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      id="asset-group-manager-modal"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 select-none"
    >
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden text-gray-800 text-xs">
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-gray-900">
                Asset Management: {assetGroup.name}
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                7 Fixed Folders
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Configure files per folder and link opposite versions (light ↔ dark) for contrast dynamization.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body with Left Folder Tabs and Right Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Fixed Folders Sidebar */}
          <div className="w-56 border-r border-gray-200 p-2 space-y-1 bg-gray-50 overflow-y-auto">
            <div className="px-2 py-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              Estructura Fija
            </div>
            {FIXED_FOLDER_TABS.map((tab) => {
              const isSelected = activeTab === tab.key;
              const count = tab.isText
                ? (assetGroup.folders[tab.key as 'texto_1' | 'texto_2' | 'texto_3' | 'texto_4'] as { files: any[] }).files.reduce((sum, f) => sum + f.variations.length, 0)
                : (assetGroup.folders[tab.key as keyof typeof assetGroup.folders] as AssetItem[]).length;

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {tab.isText ? (
                      <Type className="w-3.5 h-3.5 text-gray-500" />
                    ) : (
                      <Folder className="w-3.5 h-3.5 text-gray-500" />
                    )}
                    <span className="truncate font-mono">{tab.label}</span>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      count > 0 ? 'bg-gray-200 text-gray-700' : 'bg-red-50 text-red-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Folder Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {currentTabMeta?.isText ? (
              /* Text Folder Editor — multi-file */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-gray-800">
                      Carpeta: <code>{activeTab}</code>
                    </span>
                    <span className="text-[11px] text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
                      {(assetGroup.folders[activeTab as 'texto_1' | 'texto_2' | 'texto_3' | 'texto_4'] as { files: any[] }).files.length} archivos
                    </span>
                  </div>
                </div>

                {uploadFeedback && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 px-3 py-1.5 rounded text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{uploadFeedback}</span>
                  </div>
                )}

                {(assetGroup.folders[activeTab as 'texto_1' | 'texto_2' | 'texto_3' | 'texto_4'] as { files: any[] }).files.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-xs text-gray-400">
                    No hay archivos. Crea archivos desde el workspace principal.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(assetGroup.folders[activeTab as 'texto_1' | 'texto_2' | 'texto_3' | 'texto_4'] as { files: any[] }).files.map((file) => (
                      <div key={file.id} className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-blue-500" />
                          <span className="font-bold text-xs text-gray-800">{file.fileName}</span>
                          <span className="text-[10px] font-mono text-gray-400">{file.variations.length} vars</span>
                        </div>
                        <textarea
                          rows={2}
                          value={file.content}
                          onChange={(e) =>
                            handleUpdateTextFile(activeTab as 'texto_1' | 'texto_2' | 'texto_3' | 'texto_4', file.id, e.target.value)
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-gray-900 text-xs focus:border-blue-500 outline-none"
                        />
                        {file.variations.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {file.variations.map((v: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-gray-800 text-[10px]">
                                #{i + 1} {v}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Image / Logo / Product Folder Editor */
              <div className="space-y-4">
                {/* Batch Drag & Drop Upload Banner */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    if (e.dataTransfer.files) {
                      handleBatchImageUpload(activeTab as any, e.dataTransfer.files);
                    }
                  }}
                  className={`p-4 rounded-lg border-2 border-dashed transition-all flex flex-col items-center justify-center text-center gap-2 ${
                    isDragOver
                      ? 'border-blue-500 bg-blue-50/90'
                      : 'border-blue-200 bg-blue-50/30 hover:bg-blue-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    ) : (
                      <Upload className="w-4 h-4 text-blue-600" />
                    )}
                    <span>Upload multiple images at once to <code>{activeTab}</code></span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Select multiple images...</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                        multiple
                        onChange={(e) => {
                          handleBatchImageUpload(activeTab as any, e.target.files);
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                    </label>

                    <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-2 py-1 text-xs">
                      <span className="text-[11px] text-gray-500 font-medium">Tono:</span>
                      <select
                        value={uploadTonePreference}
                        onChange={(e) => setUploadTonePreference(e.target.value as Tone | 'auto')}
                        className="text-xs font-semibold text-gray-800 bg-transparent outline-none cursor-pointer"
                      >
                        <option value="auto">✨ Auto-detectar</option>
                        <option value="dark">🌙 Oscuro</option>
                        <option value="light">☀️ Claro</option>
                      </select>
                    </div>
                  </div>

                  {uploadFeedback && (
                    <div className="text-[11px] font-semibold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 mt-0.5">
                      {uploadFeedback}
                    </div>
                  )}
                </div>

                {/* Upload & Add Controls (Single manual item) */}
                <details className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 space-y-2 group">
                  <summary className="font-semibold text-gray-700 text-xs flex items-center justify-between cursor-pointer list-none">
                    <span className="flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-blue-600" />
                      <span>Or add by URL or custom name</span>
                    </span>
                    <span className="text-[10px] text-gray-400 group-open:rotate-180 transition-transform">▾</span>
                  </summary>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1.5">
                    <input
                      type="text"
                      placeholder="Asset name"
                      value={newAssetName}
                      onChange={(e) => setNewAssetName(e.target.value)}
                      className="bg-white border border-gray-300 rounded px-2.5 py-1.5 text-gray-800 outline-none focus:border-blue-500 text-xs"
                    />

                    <input
                      type="text"
                      placeholder="URL de imagen (opcional)"
                      value={newAssetUrl}
                      onChange={(e) => setNewAssetUrl(e.target.value)}
                      className="bg-white border border-gray-300 rounded px-2.5 py-1.5 text-gray-800 outline-none focus:border-blue-500 text-xs"
                    />

                    {/* Tone Definition (Claro / Oscuro) */}
                    <div className="flex items-center gap-2">
                      <select
                        value={newAssetTone}
                        onChange={(e) => setNewAssetTone(e.target.value as Tone)}
                        className="bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-800 text-xs outline-none flex-1 focus:border-blue-500"
                      >
                        <option value="dark">Tono Oscuro</option>
                        <option value="light">Tono Claro</option>
                      </select>

                      <button
                        onClick={() =>
                          handleAddAsset(
                            activeTab as
                              | 'background_1' | 'background_2' | 'background_3'
                              | 'logo_1'
                              | 'logo_2'
                              | 'product_image_1'
                              | 'product_image_2'
                          )
                        }
                        className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </details>

                {/* Items List */}
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    Files in this folder (
                    {(assetGroup.folders[activeTab as keyof typeof assetGroup.folders] as AssetItem[]).length}
                    )
                  </div>

                  {(assetGroup.folders[activeTab as keyof typeof assetGroup.folders] as AssetItem[]).map(
                    (item) => {
                      const oppositeItem = (
                        assetGroup.folders[activeTab as keyof typeof assetGroup.folders] as AssetItem[]
                      ).find((a) => a.id === item.oppositeId);

                      return (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-lg bg-white border border-gray-200 hover:border-gray-300 flex items-center justify-between gap-3 shadow-xs"
                        >
                          <div className="flex items-center gap-3">
                            {/* Preview Thumbnail */}
                            <div className="w-12 h-12 rounded bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden p-1">
                              <img
                                src={item.url}
                                alt={item.name}
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>

                            <div>
                              <div className="font-bold text-gray-800">{item.name}</div>
                              <div className="flex items-center gap-2 mt-1">
                                {/* Explicit Tone Badge */}
                                <button
                                  onClick={() =>
                                    handleToggleTone(
                                      activeTab as
                                        | 'background_1' | 'background_2' | 'background_3'
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
                                  title="Click to toggle light/dark tone"
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

                                {/* Opposite Pairing Info (Section 6.1) */}
                                {activeTab .startsWith('background') === false && (
                                  <div className="text-[10px]">
                                    {oppositeItem ? (
                                      <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                        <ArrowRightLeft className="w-3 h-3" />
                                        Contrario: <strong>{oppositeItem.name}</strong> ({oppositeItem.tone})
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">No opposite option</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Pair Opposite Button */}
                            {activeTab .startsWith('background') === false && (
                              <button
                                onClick={() => setPairingModalItem(item)}
                                className="px-2.5 py-1 rounded bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 flex items-center gap-1 text-[11px] cursor-pointer"
                              >
                                <ArrowRightLeft className="w-3 h-3 text-blue-600" />
                                <span>Vincular Contrario</span>
                              </button>
                            )}

                            {/* Delete Button */}
                            <button
                              onClick={() =>
                                handleRemoveAsset(
                                  activeTab as
                                    | 'background_1' | 'background_2' | 'background_3'
                                    | 'logo_1'
                                    | 'logo_2'
                                    | 'product_image_1'
                                    | 'product_image_2',
                                  item.id
                                )
                              }
                              className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Opposite Pairing Sub-Modal (Section 6.1) */}
        {pairingModalItem && (
          <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 max-w-md w-full space-y-3 shadow-xl">
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

              <div className="text-[11px] text-gray-600">
                Select the opposite version for{' '}
                <strong className="text-gray-900">"{pairingModalItem.name}"</strong> (
                {pairingModalItem.tone === 'dark' ? 'Dark Version' : 'Light Version'}). When contrast dynamization is applied, it will be automatically substituted based on the background tone.
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                <button
                  onClick={() =>
                    handlePairOpposite(
                      activeTab as 'logo_1' | 'logo_2' | 'logo_3' | 'product_image_1' | 'product_image_2' | 'product_image_3',
                      pairingModalItem.id,
                      undefined
                    )
                  }
                  className="w-full text-left p-2 rounded bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 text-xs cursor-pointer"
                >
                  None (no opposite option)
                </button>

                {(assetGroup.folders[activeTab as keyof typeof assetGroup.folders] as AssetItem[])
                  .filter((a) => a.id !== pairingModalItem.id)
                  .map((candidate) => (
                    <button
                      key={candidate.id}
                      onClick={() =>
                        handlePairOpposite(
                          activeTab as 'logo_1' | 'logo_2' | 'logo_3' | 'product_image_1' | 'product_image_2' | 'product_image_3',
                          pairingModalItem.id,
                          candidate.id
                        )
                      }
                      className="w-full text-left p-2 rounded bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-between text-xs cursor-pointer"
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

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setPairingModalItem(null)}
                  className="px-3 py-1.5 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-3 border-t border-gray-200 flex justify-end bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Listo y Aplicar al Template
          </button>
        </div>
      </div>
    </div>
  );
};

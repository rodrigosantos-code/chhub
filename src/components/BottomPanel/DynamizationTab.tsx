import React from 'react';
import {
  Sparkles,
  ArrowRightLeft,
  GitBranch,
  FolderSync,
  AlertTriangle,
  Info,
  CheckCircle,
  Type,
  Palette,
  Eye,
  Ban,
} from 'lucide-react';
import {
  AssetGroup,
  ConditionalRule,
  DynamizationType,
  FolderType,
  MasterTemplate,
  TemplateLayer,
  TextDynamizationSettings,
} from '../../types';
import { detectCircularDependency, getFolderItems } from '../../utils/variationCalculator';

interface DynamizationTabProps {
  template: MasterTemplate;
  assetGroup: AssetGroup;
  selectedLayerId: string | null;
  onSelectLayer: (layerId: string) => void;
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
}

const FOLDER_OPTIONS: { value: FolderType; label: string }[] = [
  { value: 'background', label: 'background' },
  { value: 'logo_1', label: 'logo_1 (Logotipo)' },
  { value: 'logo_2', label: 'logo_2 (Symbol)' },
  { value: 'logo_3', label: 'logo_3 (Logo 3)' },
  { value: 'product_image_1', label: 'product_image_1 (Overlay 1)' },
  { value: 'product_image_2', label: 'product_image_2 (Overlay 2)' },
  { value: 'product_image_3', label: 'product_image_3 (Overlay 3)' },
  { value: 'texto_1', label: 'texto_1 (Titular .txt)' },
  { value: 'texto_2', label: 'texto_2 (Subtitle .txt)' },
];

const PRESET_CONTRAST_COLORS = [
  { label: 'Blanco', value: '#FFFFFF', bg: '#FFFFFF', text: '#000000' },
  { label: 'Negro', value: '#0F172A', bg: '#0F172A', text: '#FFFFFF' },
  { label: 'Amarillo', value: '#FACC15', bg: '#FACC15', text: '#000000' },
  { label: 'Celeste', value: '#38BDF8', bg: '#38BDF8', text: '#000000' },
  { label: 'Rojo', value: '#EF4444', bg: '#EF4444', text: '#FFFFFF' },
  { label: 'Verde Lima', value: '#84CC16', bg: '#84CC16', text: '#000000' },
];

export const DynamizationTab: React.FC<DynamizationTabProps> = ({
  template,
  assetGroup,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayerDynamization,
  onUpdateTextDynamization,
}) => {
  const cycleInfo = detectCircularDependency(template.layers);
  const activeLayers = template.layers.filter((l) => l.visible);

  return (
    <div className="h-full overflow-y-auto px-4 py-3 text-xs space-y-3 bg-white text-gray-800">
      {/* Circular Dependency Alert */}
      {cycleInfo.hasCycle && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-2.5 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <div>
            <div className="font-bold text-red-900">Dependencia Circular Detectada</div>
            <div className="text-[11px] text-red-700">
              Cycles not allowed in conditions: {cycleInfo.cyclePath}. Fix the rule to calculate variations.
            </div>
          </div>
        </div>
      )}

      {/* Rules Information Banner */}
      <div className="bg-blue-50/70 border border-blue-200/80 p-3 rounded-lg text-gray-700 flex items-start gap-3 shadow-2xs">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed text-gray-700 space-y-1">
          <div className="font-semibold text-gray-900">
            CHhub Dynamization & Contrast Rules:
          </div>
          <p>
            • <strong>Contrast Dynamization (Logos & Images):</strong> The choice is always linked to the background contrast. If there is a black and a white logo, only 1 can go with each background, not both (does not multiply combinations).
          </p>
          <p>
            • <strong>Text Dynamization:</strong> They have two independent options: <strong>Content</strong> (multiplies by phrases from .txt file or static text) y <strong>Color</strong> (always by contrast, toggleable with choice of target color).
          </p>
        </div>
      </div>

      {/* Layers Dynamization Table */}
      <div className="space-y-3">
        {activeLayers.map((layer) => {
          const isSelected = layer.id === selectedLayerId;
          const otherLayers = activeLayers.filter((l) => l.id !== layer.id);
          const currentCount = getFolderItems(assetGroup, layer.folderType).count;
          const isTextLayer = layer.folderType.startsWith('texto');
          const isBgLayer = layer.folderType === 'background';

          // Text dynamization defaults
          const textSettings: TextDynamizationSettings = layer.textDynamization || {
            dynamicContent: true,
            contrastColorEnabled: true,
            contrastTextColor: '#FFFFFF',
          };

          const baseTextColor =
            layer.positionsByRatio['1:1']?.textColor || '#0F172A';

          return (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              className={`p-3.5 rounded-lg border transition-all ${
                isSelected
                  ? 'bg-blue-50/40 border-blue-400 ring-1 ring-blue-300 shadow-xs'
                  : 'bg-white border-gray-200 hover:border-gray-300 shadow-xs'
              }`}
            >
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    {isTextLayer ? (
                      <Type className="w-4 h-4 text-blue-600" />
                    ) : isBgLayer ? (
                      <Sparkles className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ArrowRightLeft className="w-4 h-4 text-purple-600" />
                    )}
                    {layer.name}
                  </span>
                  <span className="font-mono text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                    {layer.folderType} ({currentCount} {isTextLayer ? 'text variants' : 'files'})
                  </span>
                </div>

                {/* For non-text, non-bg layers: Mode selector (logos, overlays, shapes) */}
                {!isTextLayer && !isBgLayer && (
                  <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                    <button
                      onClick={() => onUpdateLayerDynamization(layer.id, 'none')}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                        layer.dynamizationType === 'none'
                          ? 'bg-gray-600 text-white font-bold shadow-xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <Ban className="w-3 h-3" />
                      None
                    </button>

                    {!layer.folderType.startsWith('form') && (
                      <button
                        onClick={() => onUpdateLayerDynamization(layer.id, 'by_folder')}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                          layer.dynamizationType === 'by_folder'
                            ? 'bg-white text-gray-900 font-bold shadow-xs'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        <FolderSync className="w-3 h-3" />
                        By Folder
                      </button>
                    )}

                    <button
                      onClick={() => onUpdateLayerDynamization(layer.id, 'by_contrast')}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                        layer.dynamizationType === 'by_contrast'
                          ? 'bg-blue-600 text-white font-bold shadow-xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                      By Contrast
                    </button>
                  </div>
                )}
              </div>

              {/* BACKGROUND LAYER DESCRIPTION */}
              {isBgLayer && (
                <div className="text-[11px] text-gray-600 bg-gray-50 p-2.5 rounded border border-gray-200 flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>
                    <strong>Base Background Layer:</strong> Defines the light or dark tone ({currentCount} backgrounds loaded). Logo and text layers configured by contrast will automatically adapt to the tone of each background.
                  </span>
                </div>
              )}

              {/* TEXT LAYERS: 2 DEDICATED OPTIONS (CONTENIDO & COLOR) */}
              {isTextLayer && (
                <div className="space-y-3 bg-gray-50/70 p-3 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Option 1: Content */}
                    <div className="bg-white p-3 rounded-md border border-gray-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                          <Type className="w-3.5 h-3.5 text-blue-600" />
                          1. Content Dynamization
                        </span>
                      </div>

                      {/* Mode selector: Por carpeta / Por archivo */}
                      <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                        <button
                          onClick={() =>
                            onUpdateTextDynamization(layer.id, {
                              dynamicContent: true,
                            })
                          }
                          className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                            textSettings.dynamicContent
                              ? 'bg-blue-600 text-white font-bold shadow-xs'
                              : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          <FolderSync className="w-3 h-3" />
                          Por carpeta
                        </button>
                        <button
                          onClick={() => {
                            const folderKey = layer.folderType as 'texto_1' | 'texto_2' | 'texto_3' | 'texto_4';
                            const f = assetGroup.folders[folderKey] as any;
                            const firstFileId = f?.files?.[0]?.id ?? '';
                            onUpdateTextDynamization(layer.id, {
                              dynamicContent: false,
                              fixedTextFileId: textSettings.fixedTextFileId ?? firstFileId,
                            });
                          }}
                          className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                            !textSettings.dynamicContent
                              ? 'bg-amber-600 text-white font-bold shadow-xs'
                              : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          <Type className="w-3 h-3" />
                          Por archivo
                        </button>
                      </div>

                      {textSettings.dynamicContent ? (
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                          Usa todas las frases de <strong className="text-gray-800">{layer.folderType}.txt</strong>. Genera <strong>{currentCount} variaciones</strong> de texto.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[11px] text-gray-500 leading-relaxed">
                            Selecciona qué archivo usar de <strong className="text-gray-800">{layer.folderType}</strong>. Solo se usarán las variaciones de ese archivo.
                          </p>
                          {/* Dropdown to pick specific file */}
                          <select
                            value={textSettings.fixedTextFileId ?? ''}
                            onChange={(e) =>
                              onUpdateTextDynamization(layer.id, {
                                fixedTextFileId: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-900 focus:border-amber-500 outline-none cursor-pointer"
                          >
                            {(() => {
                              const folderKey = layer.folderType as 'texto_1' | 'texto_2' | 'texto_3' | 'texto_4';
                              const folder = assetGroup.folders[folderKey] as any;
                              const files = folder?.files && Array.isArray(folder.files) ? folder.files : [];
                              if (files.length === 0) {
                                return <option value="">No hay archivos disponibles</option>;
                              }
                              return files.map((f: any) => (
                                <option key={f.id} value={f.id}>
                                  {f.fileName} ({f.variations?.length || 0} variaciones)
                                </option>
                              ));
                            })()}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Option 2: Color (Siempre por Contraste) */}
                    <div className="bg-white p-3 rounded-md border border-gray-200 shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5 text-blue-600" />
                          2. Color Dynamization (by Contrast)
                        </span>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={textSettings.contrastColorEnabled}
                            onChange={(e) =>
                              onUpdateTextDynamization(layer.id, {
                                contrastColorEnabled: e.target.checked,
                              })
                            }
                            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          />
                          <span className={`text-[11px] font-bold ${textSettings.contrastColorEnabled ? 'text-blue-600' : 'text-gray-400'}`}>
                            {textSettings.contrastColorEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </label>
                      </div>

                      {textSettings.contrastColorEnabled ? (
                        <div className="space-y-2 pt-1 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-gray-700">
                              Color al que cambiar por contraste:
                            </span>
                            <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                              <input
                                type="color"
                                value={textSettings.contrastTextColor || '#FFFFFF'}
                                onChange={(e) =>
                                  onUpdateTextDynamization(layer.id, {
                                    contrastTextColor: e.target.value,
                                  })
                                }
                                className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                              />
                              <input
                                type="text"
                                value={textSettings.contrastTextColor || '#FFFFFF'}
                                onChange={(e) =>
                                  onUpdateTextDynamization(layer.id, {
                                    contrastTextColor: e.target.value,
                                  })
                                }
                                className="w-16 font-mono text-[10px] text-gray-800 uppercase bg-transparent outline-none"
                              />
                            </div>
                          </div>

                          {/* Quick color swatches */}
                          <div className="flex items-center gap-1 pt-0.5">
                            <span className="text-[10px] text-gray-400 mr-1">Quick:</span>
                            {PRESET_CONTRAST_COLORS.map((preset) => (
                              <button
                                key={preset.value}
                                onClick={() =>
                                  onUpdateTextDynamization(layer.id, {
                                    contrastTextColor: preset.value,
                                  })
                                }
                                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-transform ${
                                  textSettings.contrastTextColor?.toLowerCase() === preset.value.toLowerCase()
                                    ? 'ring-2 ring-blue-500 scale-110 shadow-xs'
                                    : 'hover:scale-105 border-gray-300'
                                }`}
                                style={{ backgroundColor: preset.bg }}
                                title={preset.label}
                              />
                            ))}
                          </div>

                          {/* Live preview badge */}
                          <div className="grid grid-cols-2 gap-1.5 pt-1">
                            <div className="bg-[#F8FAFC] border border-gray-200 rounded p-1.5 text-center">
                              <span className="text-[9px] uppercase font-bold text-gray-400 block mb-0.5">En fondo claro</span>
                              <span className="font-bold text-[11px]" style={{ color: baseTextColor }}>
                                Abc ({baseTextColor})
                              </span>
                            </div>
                            <div className="bg-[#0F172A] border border-gray-800 rounded p-1.5 text-center">
                              <span className="text-[9px] uppercase font-bold text-gray-400 block mb-0.5">En fondo oscuro</span>
                              <span className="font-bold text-[11px]" style={{ color: textSettings.contrastTextColor || '#FFFFFF' }}>
                                Abc ({textSettings.contrastTextColor || '#FFFFFF'})
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-gray-400 italic">
                          The text will remain in its original base color (<span className="font-mono text-gray-600">{baseTextColor}</span>) without adapting to the background contrast.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* IMAGE / LOGO / PRODUCT LAYERS CONFIG */}
              {!isTextLayer && !isBgLayer && (
                <div className="space-y-2.5">
                  {layer.dynamizationType === 'none' && (
                    <div className="text-[11px] text-gray-600 bg-gray-50 p-2.5 rounded border border-gray-200 flex items-center gap-2">
                      <Ban className="w-3.5 h-3.5 text-gray-400" />
                      <span>
                        <strong>Static:</strong> This layer stays the same in all variations. No dynamization applied.
                      </span>
                    </div>
                  )}

                  {layer.dynamizationType === 'by_folder' && (
                    <div className="text-[11px] text-gray-600 bg-gray-50 p-2.5 rounded border border-gray-200 flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-gray-400" />
                      <span>
                        Generates a variation for each of the <strong>{currentCount}</strong> files in folder <code>{layer.folderType}</code> (multiplies combinations).
                      </span>
                    </div>
                  )}

                  {layer.dynamizationType === 'by_contrast' && (
                    <div className="text-[11px] text-blue-900 bg-blue-50/70 p-2.5 rounded-lg border border-blue-200 flex items-center gap-2">
                      <ArrowRightLeft className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        <strong>By Contrast:</strong> Automatically selects the light or dark version based on the background tone. Does not multiply variations.
                      </span>
                    </div>
                  )}

                  {/* Conditional Rule Toggle (available for both modes) */}
                  <div className="bg-gray-50/70 rounded-lg border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => {
                        if (layer.conditionalRule) {
                          // Remove conditional rule
                          onUpdateLayerDynamization(layer.id, layer.dynamizationType, undefined);
                        } else {
                          // Add conditional rule with defaults
                          const bgLayer = activeLayers.find((l) => l.folderType === 'background');
                          onUpdateLayerDynamization(layer.id, layer.dynamizationType, {
                            dependsOnLayerId: bgLayer?.id || otherLayers[0]?.id || '',
                            condition: 'resolved_tone_is_dark',
                            folderIfTrue: layer.folderType,
                            folderIfFalse: layer.folderType,
                          });
                        }
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-medium cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <GitBranch className={`w-3.5 h-3.5 ${layer.conditionalRule ? 'text-purple-600' : 'text-gray-400'}`} />
                        <span className={layer.conditionalRule ? 'text-purple-700 font-bold' : 'text-gray-500'}>
                          Condition (if / else)
                        </span>
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        layer.conditionalRule
                          ? 'bg-purple-100 text-purple-700 font-bold'
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {layer.conditionalRule ? 'Activa' : 'Inactiva'}
                      </span>
                    </button>

                    {layer.conditionalRule && (
                      <div className="px-3 pb-3 pt-1 border-t border-gray-200 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                          {/* Depends on */}
                          <div>
                            <label className="text-[10px] uppercase text-gray-500 font-semibold block mb-1">
                              If the layer:
                            </label>
                            <select
                              value={layer.conditionalRule.dependsOnLayerId || ''}
                              onChange={(e) =>
                                onUpdateLayerDynamization(layer.id, layer.dynamizationType, {
                                  ...layer.conditionalRule!,
                                  dependsOnLayerId: e.target.value,
                                })
                              }
                              className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-gray-800 outline-none focus:border-purple-500"
                            >
                              {otherLayers.map((ol) => (
                                <option key={ol.id} value={ol.id}>
                                  {ol.name} ({ol.folderType})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Condition */}
                          <div>
                            <label className="text-[10px] uppercase text-gray-500 font-semibold block mb-1">
                              Resolved to:
                            </label>
                            <select
                              value={layer.conditionalRule.condition || 'resolved_tone_is_dark'}
                              onChange={(e) =>
                                onUpdateLayerDynamization(layer.id, layer.dynamizationType, {
                                  ...layer.conditionalRule!,
                                  condition: e.target.value as 'resolved_tone_is_dark' | 'resolved_tone_is_light',
                                })
                              }
                              className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-gray-800 outline-none focus:border-purple-500"
                            >
                              <option value="resolved_tone_is_dark">Dark Version</option>
                              <option value="resolved_tone_is_light">Light Version</option>
                            </select>
                          </div>

                          {/* Branch Folders */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-green-700 font-bold w-14">ENTONCES:</span>
                              <select
                                value={layer.conditionalRule.folderIfTrue || layer.folderType}
                                onChange={(e) =>
                                  onUpdateLayerDynamization(layer.id, layer.dynamizationType, {
                                    ...layer.conditionalRule!,
                                    folderIfTrue: e.target.value as FolderType,
                                  })
                                }
                                className="flex-1 bg-white border border-gray-300 rounded px-2 py-0.5 text-gray-800 text-xs"
                              >
                                {FOLDER_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label} ({getFolderItems(assetGroup, opt.value).count})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-blue-700 font-bold w-14">SI NO:</span>
                              <select
                                value={layer.conditionalRule.folderIfFalse || layer.folderType}
                                onChange={(e) =>
                                  onUpdateLayerDynamization(layer.id, layer.dynamizationType, {
                                    ...layer.conditionalRule!,
                                    folderIfFalse: e.target.value as FolderType,
                                  })
                                }
                                className="flex-1 bg-white border border-gray-300 rounded px-2 py-0.5 text-gray-800 text-xs"
                              >
                                {FOLDER_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label} ({getFolderItems(assetGroup, opt.value).count})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

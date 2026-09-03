export type FolderType =
  | 'background'
  | 'logo_1'
  | 'logo_2'
  | 'logo_3'
  | 'product_image_1'
  | 'product_image_2'
  | 'product_image_3'
  | 'texto_1'
  | 'texto_2'
  | 'texto_3'
  | 'texto_4';

export type AspectRatioKey = '1:1' | '4:5' | '9:16' | '16:9';

export interface AspectRatioMeta {
  key: AspectRatioKey;
  label: string;
  width: number;
  height: number;
  description: string;
}

export const ASPECT_RATIOS: Record<AspectRatioKey, AspectRatioMeta> = {
  '1:1': { key: '1:1', label: '1:1 Cuadrado', width: 1080, height: 1080, description: 'Feed Instagram / Facebook' },
  '4:5': { key: '4:5', label: '4:5 Retrato', width: 1080, height: 1350, description: 'Feed Vertical Instagram' },
  '9:16': { key: '9:16', label: '9:16 Historia / Reel', width: 1080, height: 1920, description: 'Stories, Reels, TikTok' },
  '16:9': { key: '16:9', label: '16:9 Horizontal', width: 1920, height: 1080, description: 'Twitter, LinkedIn, Web' },
};

export type Tone = 'light' | 'dark';

export type AnchorPoint =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface RatioImages {
  square?: string;    // Modo Cuadrado (1:1)
  portrait?: string;  // Modo Retrato (9:16, 4:5)
  landscape?: string; // Modo Landscape (16:9)
  [key: string]: string | undefined;
}

export interface AssetItem {
  id: string;
  name: string;
  url: string;
  tone: Tone;
  previewColor?: string;
  oppositeId?: string; // ID of the opposite (light/dark) asset
  ratioUrls?: RatioImages; // Specific images per ratio (Square, Portrait, Landscape)
  focalPoint?: { x: number; y: number }; // Focal point (0-1), default center. Per-asset, not per-layer.
  negativeFillColor?: string; // If set, contrast correction renders this asset as a solid-color silhouette instead of swapping to oppositeId
}

export interface TextFolderData {
  fileName: string; // e.g. "titulares.txt"
  content: string;  // comma-separated values: "Summer sale, New stock, Last units"
  variations: string[]; // parsed variations
}

export interface AssetGroup {
  id: string;
  name: string;
  folders: {
    background: AssetItem[];
    logo_1: AssetItem[];
    logo_2: AssetItem[];
    logo_3: AssetItem[];
    product_image_1: AssetItem[];
    product_image_2: AssetItem[];
    product_image_3: AssetItem[];
    texto_1: TextFolderData;
    texto_2: TextFolderData;
    texto_3: TextFolderData;
    texto_4: TextFolderData;
  };
}

export type DynamizationType = 'by_folder' | 'by_contrast';

export interface ConditionalRule {
  dependsOnLayerId: string;
  condition: 'resolved_tone_is_dark' | 'resolved_tone_is_light';
  folderIfTrue: FolderType;
  folderIfFalse: FolderType;
}

export interface LayerRatioSettings {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  anchorPoint?: AnchorPoint; // Punto de anclaje (por defecto 'center')
  scale?: number; // Scale percentage (100 = base size)
  focalPoint?: { x: number; y: number }; // Image focal point (0-1), default center (0.5, 0.5). Affects cropping in cover mode.
  fontSize?: number; // base font size in px for 1080px width
  fontFamily?: string; // Google Font name (default: 'Inter')
  fontWeight?: 'normal' | 'medium' | 'bold' | 'black';
  lineHeight?: number; // line-height multiplier (default: 1.35)
  letterSpacing?: number; // letter spacing in px (default: 0)
  textTransform?: 'none' | 'uppercase' | 'lowercase'; // text transform
  textAlign?: 'left' | 'center' | 'right';
  textColor?: string;
  textShadow?: boolean;
  textBgColor?: string;
  opacity: number; // 0-1
  objectFit?: 'cover' | 'contain';
}

export interface TextDynamizationSettings {
  dynamicContent: boolean; // Cycles through phrases from .txt file if true; if false, static text
  contrastColorEnabled: boolean; // Activa cambio de color por contraste con el fondo
  contrastTextColor: string; // Color al que cambiar por contraste (ej. '#FFFFFF')
}

export interface TemplateLayer {
  id: string;
  name: string;
  folderType: FolderType;
  dynamizationType: DynamizationType;
  conditionalRule?: ConditionalRule;
  textDynamization?: TextDynamizationSettings;
  visible: boolean;
  positionsByRatio: Record<AspectRatioKey, LayerRatioSettings>;
}

export interface MasterTemplate {
  id: string;
  name: string;
  description?: string;
  activeAspectRatios: AspectRatioKey[]; // max 3 simultaneous
  layers: TemplateLayer[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  assetGroups: AssetGroup[];
  templates: MasterTemplate[];
}

export interface ResolvedLayerValue {
  layerId: string;
  folderUsed: FolderType;
  assetItem?: AssetItem;
  textValue?: string;
  resolvedTone?: Tone;
  contrastCorrected: boolean;
  originalAssetItem?: AssetItem;
  resolvedTextColor?: string;
  negativeFillColor?: string; // When set, renderer should colorize the asset with this fill color
}

export interface GeneratedVariation {
  index: number;
  resolvedLayers: Record<string, ResolvedLayerValue>;
  branchDescription?: string;
}

export interface VariationCalculationReport {
  baseCombinationsCount: number;
  totalVariationsCount: number;
  baseLayers: TemplateLayer[];
  conditionalLayers: TemplateLayer[];
  errors: string[];
  branchSummary: {
    description: string;
    multiplier: number;
  }[];
}

import React, { useState, useMemo } from 'react';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Link2,
  Unlink,
  Loader2,
  Image as ImageIcon,
  Type,
  Layers,
  ChevronDown,
  ChevronRight,
  Package,
  Sparkles,
  Globe,
  Monitor,
  Smartphone,
  RefreshCw,
  Download,
} from 'lucide-react';
import { Project, AssetGroup, MasterTemplate, AspectRatioKey } from '../types';
import { calculateVariationReport, generateAllVariations } from '../utils/variationCalculator';
import { exportByPlatformZip } from '../utils/canvasRenderer';

// ─── Platform Definitions ──────────────────────────────────────────────

interface PlatformRatioSpec {
  ratio: string;
  label: string;
  minWidth: number;
  minHeight: number;
  recommended: string;
  /** Maps to our app's ratio key if compatible */
  mappedAppRatio?: AspectRatioKey;
  importance: 'required' | 'recommended' | 'optional';
}

interface PlatformSpec {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  description: string;
  assetRequirements: {
    maxImages: number;
    maxHeadlines: number;
    maxDescriptions: number;
    logoRequired: boolean;
  };
  ratios: PlatformRatioSpec[];
}

/** Simple SVG icons for each platform */
const PlatformIcon: React.FC<{ platformId: string; className?: string }> = ({ platformId, className = 'w-7 h-7' }) => {
  switch (platformId) {
    case 'google':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09A6.97 6.97 0 015.48 12c0-.72.13-1.43.36-2.09V7.07H2.18A11.97 11.97 0 001 12c0 1.94.46 3.77 1.18 5.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      );
    case 'meta':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" fill="#1877F2"/>
        </svg>
      );
    case 'tiktok':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.28 6.28 0 00-.79-.05 6.28 6.28 0 00-6.28 6.28 6.28 6.28 0 006.28 6.28 6.28 6.28 0 006.28-6.28V9.4a8.16 8.16 0 004.73 1.51V7.46a4.83 4.83 0 01-.91-.77z" fill="#111"/>
        </svg>
      );
    case 'display':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <rect x="2" y="3" width="20" height="14" rx="2" stroke="#16a34a" strokeWidth="2" fill="none"/>
          <path d="M8 21h8M12 17v4" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"/>
          <rect x="5" y="6" width="6" height="4" rx="1" fill="#16a34a" opacity="0.3"/>
          <rect x="13" y="6" width="6" height="4" rx="1" fill="#16a34a" opacity="0.3"/>
          <rect x="5" y="12" width="14" height="2" rx="1" fill="#16a34a" opacity="0.3"/>
        </svg>
      );
    default:
      return <Globe className={className} />;
  }
};

const PLATFORMS: PlatformSpec[] = [
  {
    id: 'google',
    name: 'Google',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    description: 'Performance Max, Search, YouTube, Gmail, and Discover.',
    assetRequirements: {
      maxImages: 20,
      maxHeadlines: 5,
      maxDescriptions: 5,
      logoRequired: true,
    },
    ratios: [
      { ratio: '1.91:1', label: 'Landscape', minWidth: 600, minHeight: 314, recommended: '1200×628', mappedAppRatio: '1.91:1', importance: 'required' },
      { ratio: '1:1', label: 'Square', minWidth: 300, minHeight: 300, recommended: '1200×1200', mappedAppRatio: '1:1', importance: 'required' },
      { ratio: '4:5', label: 'Portrait', minWidth: 480, minHeight: 600, recommended: '960×1200', mappedAppRatio: '4:5', importance: 'recommended' },
      { ratio: '4:1', label: 'Logo Landscape', minWidth: 512, minHeight: 128, recommended: '1200×300', mappedAppRatio: '4:1', importance: 'optional' },
    ],
  },
  {
    id: 'meta',
    name: 'Meta',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    iconColor: 'text-indigo-600',
    description: 'Facebook & Instagram Feed, Stories, Reels, and Audience Network.',
    assetRequirements: {
      maxImages: 10,
      maxHeadlines: 5,
      maxDescriptions: 5,
      logoRequired: false,
    },
    ratios: [
      { ratio: '1:1', label: 'Feed Square', minWidth: 1080, minHeight: 1080, recommended: '1080×1080', mappedAppRatio: '1:1', importance: 'required' },
      { ratio: '4:5', label: 'Feed Portrait', minWidth: 1080, minHeight: 1350, recommended: '1080×1350', mappedAppRatio: '4:5', importance: 'required' },
      { ratio: '9:16', label: 'Stories / Reels', minWidth: 1080, minHeight: 1920, recommended: '1080×1920', mappedAppRatio: '9:16', importance: 'required' },
      { ratio: '16:9', label: 'Landscape', minWidth: 1200, minHeight: 675, recommended: '1920×1080', mappedAppRatio: '16:9', importance: 'optional' },
    ],
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    color: 'text-gray-900',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300',
    iconColor: 'text-gray-800',
    description: 'In-Feed Ads, TopView, and Spark Ads.',
    assetRequirements: {
      maxImages: 10,
      maxHeadlines: 1,
      maxDescriptions: 1,
      logoRequired: true,
    },
    ratios: [
      { ratio: '9:16', label: 'Vertical (Primary)', minWidth: 720, minHeight: 1280, recommended: '1080×1920', mappedAppRatio: '9:16', importance: 'required' },
      { ratio: '1:1', label: 'Square', minWidth: 720, minHeight: 720, recommended: '1080×1080', mappedAppRatio: '1:1', importance: 'recommended' },
      { ratio: '16:9', label: 'Horizontal', minWidth: 1280, minHeight: 720, recommended: '1920×1080', mappedAppRatio: '16:9', importance: 'optional' },
    ],
  },
  {
    id: 'display',
    name: 'Display',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconColor: 'text-green-600',
    description: 'Programmatic display banners across the open web.',
    assetRequirements: {
      maxImages: 15,
      maxHeadlines: 5,
      maxDescriptions: 5,
      logoRequired: true,
    },
    ratios: [
      { ratio: '1.91:1', label: 'Landscape Banner', minWidth: 1200, minHeight: 628, recommended: '1200×628', mappedAppRatio: '1.91:1', importance: 'required' },
      { ratio: '1:1', label: 'Square', minWidth: 1200, minHeight: 1200, recommended: '1200×1200', mappedAppRatio: '1:1', importance: 'required' },
      { ratio: '4:5', label: 'Portrait', minWidth: 960, minHeight: 1200, recommended: '960×1200', mappedAppRatio: '4:5', importance: 'recommended' },
      { ratio: '16:9', label: 'Widescreen', minWidth: 1920, minHeight: 1080, recommended: '1920×1080', mappedAppRatio: '16:9', importance: 'optional' },
    ],
  },
];

// ─── Component ─────────────────────────────────────────────────────────

interface PublishSectionProps {
  project: Project;
}

interface PlatformConnection {
  platformId: string;
  connected: boolean;
  accountName?: string;
  lastPublished?: string;
}

export const PublishSection: React.FC<PublishSectionProps> = ({ project }) => {
  const [connections, setConnections] = useState<Record<string, PlatformConnection>>({});
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());
  const [selectedAssetGroupIds, setSelectedAssetGroupIds] = useState<Set<string>>(new Set());
  const [publishingPlatform, setPublishingPlatform] = useState<string | null>(null);
  const [publishProgress, setPublishProgress] = useState<Record<string, { status: 'idle' | 'rendering' | 'uploading' | 'done' | 'error'; percent: number; message: string }>>({});

  const selectedTemplates = project.templates.filter((t) => selectedTemplateIds.has(t.id));

  const toggleTemplate = (id: string) => {
    setSelectedTemplateIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Combined active ratios from all selected templates
  const allActiveRatios = useMemo(() => {
    const ratios = new Set<AspectRatioKey>();
    for (const t of selectedTemplates) {
      for (const r of t.activeAspectRatios) {
        ratios.add(r);
      }
    }
    return Array.from(ratios);
  }, [selectedTemplates]);

  // Simulate connect/disconnect
  const handleToggleConnection = (platformId: string) => {
    setConnections((prev) => {
      const existing = prev[platformId];
      if (existing?.connected) {
        return { ...prev, [platformId]: { platformId, connected: false } };
      }
      return {
        ...prev,
        [platformId]: {
          platformId,
          connected: true,
          accountName: `${project.name} — Ad Account`,
        },
      };
    });
  };

  // Real publish: export ZIP with platform folders
  const handlePublish = async (platformId: string) => {
    const platform = PLATFORMS.find((p) => p.id === platformId);
    if (!platform || selectedAssetGroupIds.size === 0 || selectedTemplates.length === 0) return;

    // Build ratios-to-send for this single platform (union of all selected templates)
    const ratiosToSend = platform.ratios
      .filter((r) => r.mappedAppRatio && allActiveRatios.includes(r.mappedAppRatio))
      .map((r) => r.mappedAppRatio!);
    if (ratiosToSend.length === 0) {
      setPublishProgress((prev) => ({ ...prev, [platformId]: { status: 'done', percent: 100, message: 'No matching ratios to export' } }));
      setTimeout(() => {
        setPublishProgress((prev) => ({ ...prev, [platformId]: { status: 'idle', percent: 0, message: '' } }));
      }, 2000);
      return;
    }

    setPublishingPlatform(platformId);
    setPublishProgress((prev) => ({ ...prev, [platformId]: { status: 'rendering', percent: 0, message: 'Starting export...' } }));

    try {
      const selectedAGs = project.assetGroups.filter((ag) => selectedAssetGroupIds.has(ag.id));

      for (const tpl of selectedTemplates) {
        // Only use ratios active in THIS template
        const tplRatios = platform.ratios
          .filter((r) => r.mappedAppRatio && tpl.activeAspectRatios.includes(r.mappedAppRatio))
          .map((r) => r.mappedAppRatio!);
        if (tplRatios.length === 0) continue;

        const platformRatiosMap: Record<string, AspectRatioKey[]> = {
          [platform.name]: tplRatios,
        };

        for (const ag of selectedAGs) {
          const variations = generateAllVariations(tpl, ag);

          const zipBlob = await exportByPlatformZip(
            tpl,
            ag,
            variations,
            project.name,
            platformRatiosMap,
            (current, total, message) => {
              const percent = Math.round((current / total) * 100);
              setPublishProgress((prev) => ({ ...prev, [platformId]: { status: 'rendering', percent, message } }));
            }
          );

          // Download ZIP
          const url = URL.createObjectURL(zipBlob);
          const link = document.createElement('a');
          link.href = url;
          const safeName = project.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const safeTpl = tpl.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const safeAg = ag.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const safePlatform = platform.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
          link.download = `${safeName}_${safeTpl}_${safeAg}_${safePlatform}.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }

      setPublishProgress((prev) => ({ ...prev, [platformId]: { status: 'done', percent: 100, message: 'Exported successfully!' } }));
      setPublishingPlatform(null);

      setTimeout(() => {
        setPublishProgress((prev) => ({ ...prev, [platformId]: { status: 'idle', percent: 0, message: '' } }));
      }, 3000);
    } catch (err) {
      setPublishProgress((prev) => ({ ...prev, [platformId]: { status: 'error', percent: 0, message: (err as Error).message } }));
      setPublishingPlatform(null);
    }
  };

  // Publish All: export ZIP with all platform folders in one file
  const handlePublishAll = async () => {
    if (selectedAssetGroupIds.size === 0 || selectedTemplates.length === 0) return;

    setPublishingPlatform('_all');
    setPublishProgress((prev) => ({ ...prev, _all: { status: 'rendering', percent: 0, message: 'Starting export...' } }));

    try {
      const selectedAGs = project.assetGroups.filter((ag) => selectedAssetGroupIds.has(ag.id));

      for (const tpl of selectedTemplates) {
        // Build platform→ratios map using THIS template's active ratios
        const platformRatiosMap: Record<string, AspectRatioKey[]> = {};
        for (const platform of PLATFORMS) {
          const ratios = platform.ratios
            .filter((r) => r.mappedAppRatio && tpl.activeAspectRatios.includes(r.mappedAppRatio))
            .map((r) => r.mappedAppRatio!);
          if (ratios.length > 0) {
            platformRatiosMap[platform.name] = ratios;
          }
        }
        if (Object.keys(platformRatiosMap).length === 0) continue;

        for (const ag of selectedAGs) {
          const variations = generateAllVariations(tpl, ag);

          const zipBlob = await exportByPlatformZip(
            tpl,
            ag,
            variations,
            project.name,
            platformRatiosMap,
            (current, total, message) => {
              const percent = Math.round((current / total) * 100);
              setPublishProgress((prev) => ({ ...prev, _all: { status: 'rendering', percent, message } }));
            }
          );

          const url = URL.createObjectURL(zipBlob);
          const link = document.createElement('a');
          link.href = url;
          const safeName = project.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const safeTpl = tpl.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const safeAg = ag.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
          link.download = `${safeName}_${safeTpl}_${safeAg}_all_platforms.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }

      setPublishProgress((prev) => ({ ...prev, _all: { status: 'done', percent: 100, message: 'Exported successfully!' } }));
      setPublishingPlatform(null);

      setTimeout(() => {
        setPublishProgress((prev) => ({ ...prev, _all: { status: 'idle', percent: 0, message: '' } }));
      }, 3000);
    } catch (err) {
      setPublishProgress((prev) => ({ ...prev, _all: { status: 'error', percent: 0, message: (err as Error).message } }));
      setPublishingPlatform(null);
    }
  };

  const toggleAssetGroup = (id: string) => {
    setSelectedAssetGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Calculate ratio coverage for a platform
  const getRatioCoverage = (platform: PlatformSpec) => {
    if (selectedTemplates.length === 0) return { covered: 0, total: 0, details: [] as { spec: PlatformRatioSpec; status: 'available' | 'adaptable' | 'missing' }[] };

    const activeRatios = allActiveRatios;
    const details = platform.ratios.map((spec) => {
      if (spec.mappedAppRatio && activeRatios.includes(spec.mappedAppRatio)) {
        return { spec, status: 'available' as const };
      }
      // Check if we can adapt from a nearby ratio
      if (spec.ratio === '1.91:1' && activeRatios.includes('16:9')) {
        return { spec, status: 'adaptable' as const };
      }
      if (spec.ratio === '2:3' && (activeRatios.includes('4:5') || activeRatios.includes('9:16'))) {
        return { spec, status: 'adaptable' as const };
      }
      if (spec.ratio === '4:1' && activeRatios.includes('16:9')) {
        return { spec, status: 'adaptable' as const };
      }
      return { spec, status: 'missing' as const };
    });

    const covered = details.filter((d) => d.status === 'available').length;
    return { covered, total: platform.ratios.length, details };
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-slate-50 to-gray-100 overflow-hidden">

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 space-y-6">

          {/* Template & Asset Group Selector */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              Source Selection
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Template */}
              <div>
                <label className="text-[11px] font-semibold text-gray-600 mb-1.5 block">
                  Templates ({selectedTemplateIds.size} selected)
                </label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {project.templates.map((tpl) => {
                    const isSelected = selectedTemplateIds.has(tpl.id);
                    return (
                      <button
                        key={tpl.id}
                        onClick={() => toggleTemplate(tpl.id)}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg border text-left text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-50 border-blue-300 text-blue-800 font-semibold'
                            : 'bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <input type="checkbox" checked={isSelected} readOnly className="rounded text-blue-600 w-3.5 h-3.5 pointer-events-none" />
                        {tpl.name}
                        <span className="ml-auto text-[9px] text-gray-400">{tpl.activeAspectRatios.join(', ')}</span>
                      </button>
                    );
                  })}
                </div>
                {allActiveRatios.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    {allActiveRatios.map((r) => (
                      <span key={r} className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Asset Groups */}
              <div>
                <label className="text-[11px] font-semibold text-gray-600 mb-1.5 block">
                  Asset Groups ({selectedAssetGroupIds.size} selected)
                </label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {project.assetGroups.map((ag) => {
                    const isSelected = selectedAssetGroupIds.has(ag.id);
                    return (
                      <button
                        key={ag.id}
                        onClick={() => toggleAssetGroup(ag.id)}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg border text-left text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                            : 'bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-sm border-2 flex items-center justify-center ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                          {isSelected && <span className="text-white text-[8px] font-bold">✓</span>}
                        </div>
                        {ag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Publish All Button */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="text-sm font-bold text-gray-900">Publish All Platforms</div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  Export one ZIP with folders for each platform, containing only the ratios each one requires
                </div>
              </div>
              {publishProgress._all?.status === 'rendering' ? (
                <div className="flex items-center gap-2 min-w-[200px]">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-300"
                      style={{ width: `${publishProgress._all?.percent || 0}%` }}
                    />
                  </div>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                </div>
              ) : publishProgress._all?.status === 'done' ? (
                <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Exported!
                </div>
              ) : (
                <button
                  onClick={handlePublishAll}
                  disabled={selectedAssetGroupIds.size === 0 || selectedTemplates.length === 0 || publishingPlatform !== null}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export All Platforms
                </button>
              )}
            </div>
          </div>

          {/* Platforms Grid */}
          <div className="space-y-3">
            {PLATFORMS.map((platform) => {
              const isExpanded = expandedPlatform === platform.id;
              const connection = connections[platform.id];
              const isConnected = connection?.connected;
              const coverage = getRatioCoverage(platform);
              const progress = publishProgress[platform.id];
              const isPublishing = publishingPlatform === platform.id;

              // Calculate exactly which ratios will be sent to this platform
              const ratiosToSend = platform.ratios
                .filter((r) => r.mappedAppRatio && allActiveRatios.includes(r.mappedAppRatio))
                .map((r) => r.mappedAppRatio!);

              return (
                <div
                  key={platform.id}
                  className={`bg-white rounded-xl border transition-all duration-200 ${
                    isExpanded
                      ? `${platform.borderColor} shadow-lg ring-1 ring-opacity-30`
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  {/* Platform Header */}
                  <div className="flex items-center gap-4 px-5 py-3.5">
                    <button
                      onClick={() => setExpandedPlatform(isExpanded ? null : platform.id)}
                      className="flex-1 flex items-center gap-3 cursor-pointer text-left"
                    >
                      <PlatformIcon platformId={platform.id} className="w-7 h-7 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-bold ${platform.color}`}>{platform.name}</div>
                        <div className="text-[10px] text-gray-400 truncate">{platform.description}</div>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>

                    {/* Status indicators */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      {/* Ratios to send */}
                      {ratiosToSend.length > 0 && (
                        <div className="flex items-center gap-1">
                          {ratiosToSend.map((r) => (
                            <span key={r} className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-bold">
                              {r}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Coverage dots */}
                      <div className="flex items-center gap-1">
                        {coverage.details.map((d, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              d.status === 'available' ? 'bg-emerald-400' :
                              d.status === 'adaptable' ? 'bg-amber-400' :
                              'bg-gray-300'
                            }`}
                            title={`${d.spec.label} (${d.spec.ratio}): ${d.status}`}
                          />
                        ))}
                      </div>

                      {/* Connect/Disconnect button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleConnection(platform.id); }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                          isConnected
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                            : `${platform.bgColor} ${platform.color} border ${platform.borderColor} hover:opacity-80`
                        }`}
                      >
                        {isConnected ? (
                          <><Link2 className="w-3 h-3" /> Connected</>
                        ) : (
                          <><Unlink className="w-3 h-3" /> Connect</>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-gray-100">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-4">

                        {/* Ratio Requirements */}
                        <div className="lg:col-span-2">
                          <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2.5 flex items-center gap-1.5">
                            <Monitor className="w-3.5 h-3.5" />
                            Ratio Requirements
                          </div>
                          <div className="space-y-1.5">
                            {coverage.details.map(({ spec, status }) => (
                              <div
                                key={spec.ratio}
                                className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                                  status === 'available' ? 'bg-emerald-50/50 border-emerald-100' :
                                  status === 'adaptable' ? 'bg-amber-50/50 border-amber-100' :
                                  'bg-gray-50 border-gray-100'
                                }`}
                              >
                                <div className="shrink-0">
                                  {status === 'available' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                  {status === 'adaptable' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                                  {status === 'missing' && <XCircle className="w-4 h-4 text-gray-300" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[11px] font-semibold text-gray-800 flex items-center gap-2">
                                    {spec.label}
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                                      spec.importance === 'required' ? 'bg-red-100 text-red-600' :
                                      spec.importance === 'recommended' ? 'bg-blue-100 text-blue-600' :
                                      'bg-gray-100 text-gray-500'
                                    }`}>
                                      {spec.importance}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-gray-400 flex items-center gap-2 mt-0.5">
                                    <span>{spec.ratio}</span>
                                    <span>•</span>
                                    <span>Min: {spec.minWidth}×{spec.minHeight}</span>
                                    <span>•</span>
                                    <span>Rec: {spec.recommended}</span>
                                  </div>
                                </div>
                                <div className="text-[10px] text-right shrink-0">
                                  {status === 'available' && (
                                    <span className="text-emerald-600 font-semibold">✓ {spec.mappedAppRatio} ready</span>
                                  )}
                                  {status === 'adaptable' && (
                                    <span className="text-amber-600 font-semibold">↗ Auto-crop</span>
                                  )}
                                  {status === 'missing' && (
                                    <span className="text-gray-400 font-medium">Not available</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Asset Requirements & Publish */}
                        <div className="space-y-4">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2.5 flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5" />
                              Asset Limits
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                                <span className="text-[11px] text-gray-600 flex items-center gap-1.5">
                                  <ImageIcon className="w-3 h-3" /> Max images
                                </span>
                                <span className="text-[11px] font-bold text-gray-800">{platform.assetRequirements.maxImages}</span>
                              </div>
                              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                                <span className="text-[11px] text-gray-600 flex items-center gap-1.5">
                                  <Type className="w-3 h-3" /> Max headlines
                                </span>
                                <span className="text-[11px] font-bold text-gray-800">{platform.assetRequirements.maxHeadlines}</span>
                              </div>
                              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                                <span className="text-[11px] text-gray-600 flex items-center gap-1.5">
                                  <Type className="w-3 h-3" /> Max descriptions
                                </span>
                                <span className="text-[11px] font-bold text-gray-800">{platform.assetRequirements.maxDescriptions}</span>
                              </div>
                              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                                <span className="text-[11px] text-gray-600 flex items-center gap-1.5">
                                  <Sparkles className="w-3 h-3" /> Logo
                                </span>
                                <span className={`text-[11px] font-bold ${platform.assetRequirements.logoRequired ? 'text-red-600' : 'text-gray-400'}`}>
                                  {platform.assetRequirements.logoRequired ? 'Required' : 'Optional'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Connection info */}
                          {isConnected && connection && (
                            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                              <div className="text-[10px] text-emerald-600 font-bold mb-1">Connected Account</div>
                              <div className="text-[11px] text-emerald-800 font-medium">{connection.accountName}</div>
                              {connection.lastPublished && (
                                <div className="text-[10px] text-emerald-500 mt-1">Last published: {connection.lastPublished}</div>
                              )}
                            </div>
                          )}

                          {/* Publish button */}
                          {progress?.status === 'rendering' || progress?.status === 'uploading' ? (
                            <div className="space-y-2">
                              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-300"
                                  style={{ width: `${progress.percent}%` }}
                                />
                              </div>
                              <div className="text-[10px] text-gray-500 flex items-center gap-1.5">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                {progress.message}
                              </div>
                            </div>
                          ) : progress?.status === 'done' ? (
                            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                              <div className="text-[11px] text-emerald-700 font-bold">Published successfully!</div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handlePublish(platform.id)}
                              disabled={selectedAssetGroupIds.size === 0 || selectedTemplates.length === 0 || publishingPlatform !== null}
                              className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                            >
                              <Download className="w-3.5 h-3.5" />
                              {selectedAssetGroupIds.size === 0
                                ? 'Select asset groups'
                                : `Export ${ratiosToSend.length} ratio${ratiosToSend.length !== 1 ? 's' : ''} × ${selectedAssetGroupIds.size} group${selectedAssetGroupIds.size !== 1 ? 's' : ''}`}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 py-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-gray-500">Ratio available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-[10px] text-gray-500">Auto-crop from nearest</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
              <span className="text-[10px] text-gray-500">Not available</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

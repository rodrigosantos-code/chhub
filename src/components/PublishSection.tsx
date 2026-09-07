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
} from 'lucide-react';
import { Project, AssetGroup, MasterTemplate, AspectRatioKey } from '../types';
import { calculateVariationReport } from '../utils/variationCalculator';

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
  icon: string; // emoji
  description: string;
  assetRequirements: {
    maxImages: number;
    maxHeadlines: number;
    maxDescriptions: number;
    logoRequired: boolean;
  };
  ratios: PlatformRatioSpec[];
}

const PLATFORMS: PlatformSpec[] = [
  {
    id: 'google_pmax',
    name: 'Google Pmax',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: '🔵',
    description: 'Performance Max campaigns with automated placements across Search, Display, YouTube, Gmail, and Discover.',
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
    id: 'meta_ads',
    name: 'Meta Ads',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    icon: '🟣',
    description: 'Facebook & Instagram Feed, Stories, Reels, and Audience Network placements.',
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
    name: 'TikTok Ads',
    color: 'text-gray-900',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300',
    icon: '🎵',
    description: 'In-Feed Ads, TopView, and Spark Ads on TikTok\'s For You page.',
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
    id: 'pinterest',
    name: 'Pinterest Ads',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: '📌',
    description: 'Promoted Pins, Idea Pins, and Shopping Ads in Pinterest feeds.',
    assetRequirements: {
      maxImages: 5,
      maxHeadlines: 1,
      maxDescriptions: 1,
      logoRequired: false,
    },
    ratios: [
      { ratio: '2:3', label: 'Standard Pin', minWidth: 1000, minHeight: 1500, recommended: '1000×1500', mappedAppRatio: '2:3', importance: 'required' },
      { ratio: '1:1', label: 'Square Pin', minWidth: 1000, minHeight: 1000, recommended: '1000×1000', mappedAppRatio: '1:1', importance: 'recommended' },
      { ratio: '9:16', label: 'Idea Pin', minWidth: 1080, minHeight: 1920, recommended: '1080×1920', mappedAppRatio: '9:16', importance: 'optional' },
    ],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Ads',
    color: 'text-sky-700',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    icon: '💼',
    description: 'Sponsored Content, Message Ads, and Dynamic Ads on LinkedIn.',
    assetRequirements: {
      maxImages: 5,
      maxHeadlines: 3,
      maxDescriptions: 2,
      logoRequired: true,
    },
    ratios: [
      { ratio: '1.91:1', label: 'Landscape', minWidth: 1200, minHeight: 628, recommended: '1200×628', mappedAppRatio: '1.91:1', importance: 'required' },
      { ratio: '1:1', label: 'Square', minWidth: 1080, minHeight: 1080, recommended: '1080×1080', mappedAppRatio: '1:1', importance: 'recommended' },
      { ratio: '4:5', label: 'Portrait', minWidth: 628, minHeight: 785, recommended: '628×785', mappedAppRatio: '4:5', importance: 'optional' },
    ],
  },
  {
    id: 'dv360',
    name: 'DV360',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: '📺',
    description: 'Display & Video 360 programmatic campaigns across the open web.',
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
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(project.templates[0]?.id || '');
  const [selectedAssetGroupIds, setSelectedAssetGroupIds] = useState<Set<string>>(new Set());
  const [publishingPlatform, setPublishingPlatform] = useState<string | null>(null);
  const [publishProgress, setPublishProgress] = useState<Record<string, { status: 'idle' | 'rendering' | 'uploading' | 'done' | 'error'; percent: number; message: string }>>({});

  const selectedTemplate = project.templates.find((t) => t.id === selectedTemplateId) || project.templates[0];

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

  // Simulate publish
  const handlePublish = async (platformId: string) => {
    const platform = PLATFORMS.find((p) => p.id === platformId);
    if (!platform || selectedAssetGroupIds.size === 0 || !selectedTemplate) return;

    setPublishingPlatform(platformId);

    // Simulate render phase
    setPublishProgress((prev) => ({ ...prev, [platformId]: { status: 'rendering', percent: 0, message: 'Rendering variations...' } }));
    for (let i = 0; i <= 60; i += 15) {
      await new Promise((r) => setTimeout(r, 300));
      setPublishProgress((prev) => ({ ...prev, [platformId]: { status: 'rendering', percent: i, message: `Rendering variations... ${i}%` } }));
    }

    // Simulate upload phase
    setPublishProgress((prev) => ({ ...prev, [platformId]: { status: 'uploading', percent: 70, message: 'Uploading assets to platform...' } }));
    await new Promise((r) => setTimeout(r, 800));
    setPublishProgress((prev) => ({ ...prev, [platformId]: { status: 'uploading', percent: 85, message: 'Creating ad groups...' } }));
    await new Promise((r) => setTimeout(r, 600));
    setPublishProgress((prev) => ({ ...prev, [platformId]: { status: 'uploading', percent: 95, message: 'Finalizing campaign...' } }));
    await new Promise((r) => setTimeout(r, 400));

    // Done
    setPublishProgress((prev) => ({ ...prev, [platformId]: { status: 'done', percent: 100, message: 'Published successfully!' } }));
    setConnections((prev) => ({
      ...prev,
      [platformId]: { ...prev[platformId], lastPublished: new Date().toLocaleString() },
    }));
    setPublishingPlatform(null);

    // Clear after 3s
    setTimeout(() => {
      setPublishProgress((prev) => ({ ...prev, [platformId]: { status: 'idle', percent: 0, message: '' } }));
    }, 3000);
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
    if (!selectedTemplate) return { covered: 0, total: 0, details: [] as { spec: PlatformRatioSpec; status: 'available' | 'adaptable' | 'missing' }[] };

    const activeRatios = selectedTemplate.activeAspectRatios;
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
      {/* Header */}
      <div className="bg-white/80 backdrop-blur border-b border-gray-200 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
            <Send className="w-5 h-5 text-violet-600" />
            Publish — {project.name}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Connect platforms, map assets, and publish campaigns
          </p>
        </div>
      </div>

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
                <label className="text-[11px] font-semibold text-gray-600 mb-1.5 block">Template</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 cursor-pointer"
                >
                  {project.templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} — {tpl.layers.length} layers, {tpl.activeAspectRatios.join(', ')}
                    </option>
                  ))}
                </select>
                {selectedTemplate && (
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    {selectedTemplate.activeAspectRatios.map((r) => (
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

          {/* Platforms Grid */}
          <div className="space-y-3">
            {PLATFORMS.map((platform) => {
              const isExpanded = expandedPlatform === platform.id;
              const connection = connections[platform.id];
              const isConnected = connection?.connected;
              const coverage = getRatioCoverage(platform);
              const progress = publishProgress[platform.id];
              const isPublishing = publishingPlatform === platform.id;

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
                      <span className="text-2xl">{platform.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-bold ${platform.color}`}>{platform.name}</div>
                        <div className="text-[10px] text-gray-400 truncate">{platform.description}</div>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>

                    {/* Status indicators */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Ratio coverage */}
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
                              disabled={!isConnected || selectedAssetGroupIds.size === 0 || !selectedTemplate || isPublishing}
                              className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                            >
                              <Send className="w-3.5 h-3.5" />
                              {!isConnected
                                ? 'Connect first'
                                : selectedAssetGroupIds.size === 0
                                ? 'Select asset groups'
                                : `Publish ${selectedAssetGroupIds.size} group${selectedAssetGroupIds.size !== 1 ? 's' : ''}`}
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

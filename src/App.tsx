import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  ASPECT_RATIOS,
  AspectRatioKey,
  AssetGroup,
  ConditionalRule,
  DynamizationType,
  FolderType,
  MasterTemplate,
  Project,
  TemplateLayer,
  TextDynamizationSettings,
} from './types';
import {
  INITIAL_EMPTY_PROJECTS,
  createEmptyProject,
  createEmptyTemplate,
  createEmptyAssetGroup,
} from './data/initialData';
import { DEFAULT_PROJECT as DEMO_PROJECT } from './data/sampleData';
import { useUndoRedo } from './hooks/useUndoRedo';
import {
  calculateVariationReport,
  generateAllVariations,
} from './utils/variationCalculator';
import { Header } from './components/Header';
import { LeftPanel } from './components/LeftPanel';
import { CanvasArea } from './components/CanvasArea';
import { BottomPanel } from './components/BottomPanel/BottomPanel';
import { AssetGroupWorkspace } from './components/AssetGroupWorkspace';
import { AssetGroupManagerModal } from './components/AssetGroupManagerModal';
import { NewTemplateModal } from './components/NewTemplateModal';
import { NewAssetGroupModal } from './components/NewAssetGroupModal';
import { ProjectManagerModal } from './components/ProjectManagerModal';
import { HomeDashboard } from './components/HomeDashboard';
import { ExportSection } from './components/ExportSection';
import { TemplatesOverview } from './components/TemplatesOverview';
import { AssetsOverview } from './components/AssetsOverview';
import { fetchProjects, saveAllProjects, syncDeletedProjects } from './lib/projectsDB';

const STORAGE_PROJECTS_KEY = 'chhub_projects_v3';
const STORAGE_ACTIVE_PROJ_KEY = 'chhub_active_project_id_v3';

// Helper: migrate old project data to ensure all fields exist
function migrateProject(proj: any): Project {
  return {
    ...proj,
    assetGroups: (proj.assetGroups || []).map((ag: any) => ({
      ...ag,
      folders: {
        ...ag.folders,
        logo_3: ag.folders.logo_3 ?? [],
        product_image_3: ag.folders.product_image_3 ?? [],
        texto_3: ag.folders.texto_3 ?? { fileName: 'texto_3.txt', content: '', variations: [] },
        texto_4: ag.folders.texto_4 ?? { fileName: 'texto_4.txt', content: '', variations: [] },
      },
    })),
    templates: (proj.templates || []).map((tpl: any) => ({
      ...tpl,
      layers: (tpl.layers || []).map((l: any) => ({
        ...l,
        dynamizationType: l.dynamizationType === 'conditional' ? 'by_folder' : l.dynamizationType,
      })),
    })),
  };
}

export default function App() {
  // 1. Projects State (start from localStorage, then hydrate from Supabase)
  const initialProjects = useMemo(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROJECTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(migrateProject);
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_EMPTY_PROJECTS;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    state: projects,
    setState: setProjects,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo<Project[]>(initialProjects);

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_ACTIVE_PROJ_KEY);
      if (savedId && initialProjects.some((p: Project) => p.id === savedId)) {
        return savedId;
      }
    } catch {
      // fallback
    }
    return initialProjects[0]?.id || INITIAL_EMPTY_PROJECTS[0].id;
  });

  const [cloudStatus, setCloudStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isCloudLoaded, setIsCloudLoaded] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextCloudSaveRef = useRef(false);

  // Load from Supabase on mount — merge cloud structure with local images
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cloudProjects = await fetchProjects();
        if (cancelled) return;
        if (cloudProjects.length > 0) {
          const migrated = cloudProjects.map(migrateProject);
          // Merge: prefer local base64 images (full-res) over cloud URLs
          const localProjects = projects;
          const merged = migrated.map((cloudProj: Project) => {
            const localProj = localProjects.find((lp: Project) => lp.id === cloudProj.id);
            if (!localProj) return cloudProj; // New from cloud, use as-is
            const mergedAGs = cloudProj.assetGroups.map((cloudAg) => {
              const localAg = localProj.assetGroups.find((la) => la.id === cloudAg.id);
              if (!localAg) return cloudAg;
              const mergedFolders = { ...cloudAg.folders };
              for (const folderKey of Object.keys(mergedFolders)) {
                const cloudItems = mergedFolders[folderKey as keyof typeof mergedFolders];
                const localItems = localAg.folders[folderKey as keyof typeof localAg.folders];
                if (Array.isArray(cloudItems) && Array.isArray(localItems)) {
                  for (const cloudItem of cloudItems as any[]) {
                    const localItem = (localItems as any[]).find((li: any) => li.id === cloudItem.id);
                    if (localItem) {
                      // Prefer local base64 (full-res), else keep cloud URL
                      if (localItem.url && localItem.url.startsWith('data:')) {
                        cloudItem.url = localItem.url;
                      }
                      if (localItem.ratioUrls) {
                        if (!cloudItem.ratioUrls) cloudItem.ratioUrls = {};
                        for (const rk of Object.keys(localItem.ratioUrls)) {
                          if (localItem.ratioUrls[rk] && localItem.ratioUrls[rk].startsWith('data:')) {
                            cloudItem.ratioUrls[rk] = localItem.ratioUrls[rk];
                          }
                        }
                      }
                    }
                  }
                }
              }
              return { ...cloudAg, folders: mergedFolders };
            });
            return { ...cloudProj, assetGroups: mergedAGs };
          });
          skipNextCloudSaveRef.current = true;
          setProjects(merged);
          localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(merged));
          const ids = merged.map((p: Project) => p.id);
          if (!ids.includes(activeProjectId)) {
            setActiveProjectId(merged[0].id);
          }
        }
      } catch (err) {
        console.error('[Cloud] Failed to load projects:', err);
      } finally {
        if (!cancelled) setIsCloudLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to localStorage immediately + debounce save to Supabase
  useEffect(() => {
    // Always save to localStorage
    try {
      localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(projects));
    } catch { /* ignore */ }

    // Skip cloud save until initial load is done
    if (!isCloudLoaded) return;

    // Skip if this change came from cloud load (prevents re-uploading what we just downloaded)
    if (skipNextCloudSaveRef.current) {
      skipNextCloudSaveRef.current = false;
      return;
    }

    // Debounce cloud save (2s after last change)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        setCloudStatus('saving');
        await saveAllProjects(projects);
        await syncDeletedProjects(projects.map((p) => p.id));
        setCloudStatus('saved');
        setTimeout(() => setCloudStatus('idle'), 2000);
      } catch {
        setCloudStatus('error');
        setTimeout(() => setCloudStatus('idle'), 3000);
      }
    }, 2000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [projects, isCloudLoaded]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ACTIVE_PROJ_KEY, activeProjectId);
    } catch {
      // ignore
    }
  }, [activeProjectId]);

  // Manual save to cloud
  const handleManualSave = useCallback(async () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    try {
      setCloudStatus('saving');
      await saveAllProjects(projects);
      await syncDeletedProjects(projects.map((p) => p.id));
      setCloudStatus('saved');
      setTimeout(() => setCloudStatus('idle'), 2000);
    } catch {
      setCloudStatus('error');
      setTimeout(() => setCloudStatus('idle'), 3000);
    }
  }, [projects]);

  // Global keyboard shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (!isMeta) return;

      // Ignore if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Current Active Project
  const currentProject = useMemo(() => {
    return projects.find((p) => p.id === activeProjectId) || projects[0] || INITIAL_EMPTY_PROJECTS[0];
  }, [projects, activeProjectId]);

  // Active Mode: 'home' | 'templates' | 'asset_groups' | 'export'
  const [activeMode, setActiveMode] = useState<'home' | 'templates' | 'asset_groups' | 'export'>('home');
  const [isInTemplateEditor, setIsInTemplateEditor] = useState(false);
  const [isInAssetEditor, setIsInAssetEditor] = useState(false);
  const [bulkExportProjectId, setBulkExportProjectId] = useState<string | null>(null);

  // When switching modes, reset to overview
  const handleSetActiveMode = (mode: typeof activeMode) => {
    setActiveMode(mode);
    // Always reset to overview when clicking a tab
    setIsInTemplateEditor(false);
    setIsInAssetEditor(false);
  };

  // Resizable bottom panel
  const [bottomPanelHeight, setBottomPanelHeight] = useState(224);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartHeightRef = useRef(0);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartYRef.current = e.clientY;
    dragStartHeightRef.current = bottomPanelHeight;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, [bottomPanelHeight]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const delta = dragStartYRef.current - e.clientY;
      const newHeight = Math.min(600, Math.max(120, dragStartHeightRef.current + delta));
      setBottomPanelHeight(newHeight);
    };
    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Active Template ID & Asset Group ID within current project
  const [activeTemplateId, setActiveTemplateId] = useState<string>(
    currentProject.templates[0]?.id || ''
  );
  const [activeAssetGroupId, setActiveAssetGroupId] = useState<string>(
    currentProject.assetGroups[0]?.id || ''
  );

  // Sync activeTemplateId and activeAssetGroupId when activeProjectId changes
  useEffect(() => {
    if (!currentProject.templates.some((t) => t.id === activeTemplateId)) {
      setActiveTemplateId(currentProject.templates[0]?.id || '');
    }
    if (!currentProject.assetGroups.some((ag) => ag.id === activeAssetGroupId)) {
      setActiveAssetGroupId(currentProject.assetGroups[0]?.id || '');
    }
  }, [currentProject, activeTemplateId, activeAssetGroupId]);

  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [currentVariationIndex, setCurrentVariationIndex] = useState<number>(0);

  // Modals
  const [isAssetManagerOpen, setIsAssetManagerOpen] = useState(false);
  const [isNewTemplateOpen, setIsNewTemplateOpen] = useState(false);
  const [isNewAssetGroupOpen, setIsNewAssetGroupOpen] = useState(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);

  // Active Template & Asset Group Objects
  const activeTemplate = useMemo(() => {
    const found = currentProject.templates.find((t) => t.id === activeTemplateId);
    return found || currentProject.templates[0] || createEmptyTemplate('Template 1');
  }, [currentProject.templates, activeTemplateId]);

  const activeAssetGroup = useMemo(() => {
    const found = currentProject.assetGroups.find((ag) => ag.id === activeAssetGroupId);
    return found || currentProject.assetGroups[0] || createEmptyAssetGroup('Asset Group 1');
  }, [currentProject.assetGroups, activeAssetGroupId]);

  // Selected aspect ratio for editing
  const [selectedRatio, setSelectedRatio] = useState<AspectRatioKey>(
    activeTemplate.activeAspectRatios[0] || '1:1'
  );

  // Keep selectedRatio in sync if activeTemplate ratios change
  useEffect(() => {
    if (!activeTemplate.activeAspectRatios.includes(selectedRatio)) {
      setSelectedRatio(activeTemplate.activeAspectRatios[0] || '1:1');
    }
  }, [activeTemplate.activeAspectRatios, selectedRatio]);

  // Reset variation index if template or asset group changes
  useEffect(() => {
    setCurrentVariationIndex(0);
  }, [activeTemplateId, activeAssetGroupId]);

  // Calculate Variations and Report
  const calculationReport = useMemo(() => {
    return calculateVariationReport(activeTemplate, activeAssetGroup);
  }, [activeTemplate, activeAssetGroup]);

  const allVariations = useMemo(() => {
    if (calculationReport.errors.length > 0) return [];
    return generateAllVariations(activeTemplate, activeAssetGroup);
  }, [activeTemplate, activeAssetGroup, calculationReport.errors]);

  // Project Management Handlers
  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    const targetProj = projects.find((p) => p.id === projectId);
    if (targetProj) {
      if (targetProj.templates[0]) setActiveTemplateId(targetProj.templates[0].id);
      if (targetProj.assetGroups[0]) setActiveAssetGroupId(targetProj.assetGroups[0].id);
    }
  };

  const handleCreateProject = (name: string, description: string) => {
    const newProj = createEmptyProject(name, description);
    setProjects((prev) => [...prev, newProj]);
    setActiveProjectId(newProj.id);
    setActiveTemplateId(newProj.templates[0].id);
    setActiveAssetGroupId(newProj.assetGroups[0].id);
  };

  const handleUpdateProject = (projectId: string, name: string, description: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, name, description } : p))
    );
  };

  const handleDeleteProject = (projectId: string) => {
    if (projects.length <= 1) return;
    const remaining = projects.filter((p) => p.id !== projectId);
    setProjects(remaining);
    if (activeProjectId === projectId) {
      setActiveProjectId(remaining[0].id);
      if (remaining[0].templates[0]) setActiveTemplateId(remaining[0].templates[0].id);
      if (remaining[0].assetGroups[0]) setActiveAssetGroupId(remaining[0].assetGroups[0].id);
    }
  };

  const handleLoadDemoProject = () => {
    const demoWithNewId: Project = {
      ...DEMO_PROJECT,
      id: `proj_demo_${Date.now()}`,
      name: `${DEMO_PROJECT.name} (Ejemplo)`,
    };
    setProjects((prev) => [demoWithNewId, ...prev]);
    setActiveProjectId(demoWithNewId.id);
    setActiveTemplateId(demoWithNewId.templates[0].id);
    setActiveAssetGroupId(demoWithNewId.assetGroups[0].id);
  };

  // Helper to update active template
  const updateActiveTemplate = (updater: (prev: MasterTemplate) => MasterTemplate) => {
    setProjects((prevProjects) =>
      prevProjects.map((p) => {
        if (p.id !== currentProject.id) return p;
        return {
          ...p,
          templates: p.templates.map((t) =>
            t.id === activeTemplate.id ? updater(t) : t
          ),
        };
      })
    );
  };

  const handleRenameTemplate = (templateId: string, newName: string) => {
    setProjects((prevProjects) =>
      prevProjects.map((p) => {
        if (p.id !== currentProject.id) return p;
        return {
          ...p,
          templates: p.templates.map((t) =>
            t.id === templateId ? { ...t, name: newName } : t
          ),
        };
      })
    );
  };

  const handleRenameAssetGroup = (assetGroupId: string, newName: string) => {
    setProjects((prevProjects) =>
      prevProjects.map((p) => {
        if (p.id !== currentProject.id) return p;
        return {
          ...p,
          assetGroups: p.assetGroups.map((ag) =>
            ag.id === assetGroupId ? { ...ag, name: newName } : ag
          ),
        };
      })
    );
  };

  const handleDeleteAssetGroup = (agId: string) => {
    if (currentProject.assetGroups.length <= 1) return;
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== currentProject.id) return p;
        return { ...p, assetGroups: p.assetGroups.filter((ag) => ag.id !== agId) };
      })
    );
    if (activeAssetGroupId === agId) {
      setActiveAssetGroupId(currentProject.assetGroups.find((ag) => ag.id !== agId)?.id || '');
    }
  };

  // Toggle active aspect ratios (max 3)
  const handleToggleActiveRatio = (ratio: AspectRatioKey) => {
    updateActiveTemplate((t) => {
      const isAlreadyActive = t.activeAspectRatios.includes(ratio);
      if (isAlreadyActive) {
        if (t.activeAspectRatios.length <= 1) return t;
        return {
          ...t,
          activeAspectRatios: t.activeAspectRatios.filter((r) => r !== ratio),
        };
      } else {
        if (t.activeAspectRatios.length >= Object.keys(ASPECT_RATIOS).length) return t;
        return {
          ...t,
          activeAspectRatios: [...t.activeAspectRatios, ratio],
        };
      }
    });
  };

  // Add Layer
  const handleAddLayer = (folderType: FolderType) => {
    const layerNames: Record<FolderType, string> = {
      background: 'Background',
      logo_1: 'Logotype 1',
      logo_2: 'Logotype 2 (Isotype)',
      logo_3: 'Logotype 3',
      product_image_1: 'Overlay 1',
      product_image_2: 'Overlay 2',
      product_image_3: 'Overlay 3',
      texto_1: 'Text 1 (Headline)',
      texto_2: 'Text 2 (Subtitle)',
      texto_3: 'Text 3',
      texto_4: 'Text 4',
      form_1: 'Form 1',
      form_2: 'Form 2',
      form_3: 'Form 3',
    };

    const isText = folderType.startsWith('texto');
    const isLogo = folderType.startsWith('logo');
    const isBg = folderType === 'background';
    const isForm = folderType.startsWith('form');

    const defaultPositions: Partial<Record<AspectRatioKey, any>> = {
      '1:1': {
        x: isBg ? 0 : isForm ? 10 : 20,
        y: isBg ? 0 : isText ? 75 : isForm ? 80 : 25,
        width: isBg ? 100 : isForm ? 80 : 60,
        height: isBg ? 100 : isText ? 15 : isForm ? 12 : 50,
        anchorPoint: 'center',
        scale: isLogo ? 100 : undefined,
        opacity: 1,
        fontSize: isText ? 52 : undefined,
        fontWeight: isText ? 'bold' : undefined,
        textAlign: isText ? 'center' : undefined,
        textColor: isText ? '#0F172A' : undefined,
        objectFit: isBg ? 'cover' : 'contain',
      },
      '4:5': {
        x: isBg ? 0 : isForm ? 10 : 18,
        y: isBg ? 0 : isText ? 75 : isForm ? 82 : 25,
        width: isBg ? 100 : isForm ? 80 : 64,
        height: isBg ? 100 : isText ? 15 : isForm ? 10 : 50,
        anchorPoint: 'center',
        scale: isLogo ? 100 : undefined,
        opacity: 1,
        fontSize: isText ? 52 : undefined,
        fontWeight: isText ? 'bold' : undefined,
        textAlign: isText ? 'center' : undefined,
        textColor: isText ? '#0F172A' : undefined,
        objectFit: isBg ? 'cover' : 'contain',
      },
      '9:16': {
        x: isBg ? 0 : isForm ? 8 : 15,
        y: isBg ? 0 : isText ? 76 : isForm ? 84 : 28,
        width: isBg ? 100 : isForm ? 84 : 70,
        height: isBg ? 100 : isText ? 15 : isForm ? 8 : 44,
        anchorPoint: 'center',
        scale: isLogo ? 100 : undefined,
        opacity: 1,
        fontSize: isText ? 56 : undefined,
        fontWeight: isText ? 'bold' : undefined,
        textAlign: isText ? 'center' : undefined,
        textColor: isText ? '#0F172A' : undefined,
        objectFit: isBg ? 'cover' : 'contain',
      },
      '16:9': {
        x: isBg ? 0 : isForm ? 15 : 25,
        y: isBg ? 0 : isText ? 50 : isForm ? 80 : 15,
        width: isBg ? 100 : isForm ? 70 : 50,
        height: isBg ? 100 : isText ? 25 : isForm ? 14 : 70,
        anchorPoint: 'center',
        scale: isLogo ? 100 : undefined,
        opacity: 1,
        fontSize: isText ? 44 : undefined,
        fontWeight: isText ? 'bold' : undefined,
        textAlign: isText ? 'left' : undefined,
        textColor: isText ? '#0F172A' : undefined,
        objectFit: isBg ? 'cover' : 'contain',
      },
    };

    const newLayer: TemplateLayer = {
      id: `layer_${Date.now()}`,
      name: layerNames[folderType],
      folderType,
      dynamizationType: isForm ? 'by_contrast' : isText ? 'by_folder' : folderType.startsWith('logo') ? 'by_contrast' : 'by_folder',
      textDynamization: isText
        ? {
            dynamicContent: true,
            contrastColorEnabled: true,
            contrastTextColor: '#FFFFFF',
          }
        : undefined,
      shapeConfig: isForm
        ? {
            shapeType: 'rectangle',
            fillColor: '#FFFFFF',
            strokeColor: 'transparent',
            strokeWidth: 0,
            borderRadius: 0,
            opacity: 1,
            darkBgColor: '#FFFFFF',
            lightBgColor: '#0F172A',
          }
        : undefined,
      visible: true,
      positionsByRatio: defaultPositions,
    };

    updateActiveTemplate((t) => ({
      ...t,
      layers: isBg ? [newLayer, ...t.layers] : [...t.layers, newLayer],
    }));

    setSelectedLayerId(newLayer.id);
  };

  // Update Layer Position
  const handleUpdateLayerPosition = (
    layerId: string,
    ratio: AspectRatioKey,
    updates: Partial<TemplateLayer['positionsByRatio'][AspectRatioKey]>
  ) => {
    updateActiveTemplate((t) => ({
      ...t,
      layers: t.layers.map((l) => {
        if (l.id !== layerId) return l;
        const currentPos = l.positionsByRatio[ratio] || l.positionsByRatio['1:1'];
        return {
          ...l,
          positionsByRatio: {
            ...l.positionsByRatio,
            [ratio]: {
              ...currentPos,
              ...updates,
            },
          },
        };
      }),
    }));
  };

  // Update Layer properties (e.g. shapeConfig)
  const handleUpdateLayer = (layerId: string, updates: Partial<TemplateLayer>) => {
    updateActiveTemplate((t) => ({
      ...t,
      layers: t.layers.map((l) =>
        l.id === layerId ? { ...l, ...updates } : l
      ),
    }));
  };

  // Delete Layer
  const handleDeleteLayer = (layerId: string) => {
    updateActiveTemplate((t) => ({
      ...t,
      layers: t.layers.filter((l) => l.id !== layerId),
    }));
    if (selectedLayerId === layerId) {
      setSelectedLayerId(null);
    }
  };

  // Move Layer (Stack order / z-index)
  const handleMoveLayer = (layerId: string, direction: 'up' | 'down') => {
    updateActiveTemplate((t) => {
      const idx = t.layers.findIndex((l) => l.id === layerId);
      if (idx === -1) return t;

      const targetIdx = direction === 'up' ? idx + 1 : idx - 1;
      if (targetIdx < 0 || targetIdx >= t.layers.length) return t;

      const newLayers = [...t.layers];
      const temp = newLayers[idx];
      newLayers[idx] = newLayers[targetIdx];
      newLayers[targetIdx] = temp;

      return { ...t, layers: newLayers };
    });
  };

  // Toggle Visibility
  const handleToggleVisibility = (layerId: string) => {
    updateActiveTemplate((t) => ({
      ...t,
      layers: t.layers.map((l) =>
        l.id === layerId ? { ...l, visible: !l.visible } : l
      ),
    }));
  };

  // Update Dynamization
  const handleUpdateLayerDynamization = (
    layerId: string,
    dynamizationType: DynamizationType,
    conditionalRule?: ConditionalRule,
    textDynamization?: TextDynamizationSettings
  ) => {
    updateActiveTemplate((t) => ({
      ...t,
      layers: t.layers.map((l) => {
        if (l.id !== layerId) return l;
        return {
          ...l,
          dynamizationType,
          conditionalRule,
          textDynamization: textDynamization !== undefined ? textDynamization : l.textDynamization,
        };
      }),
    }));
  };

  // Update Text Dynamization (content & contrast color)
  const handleUpdateTextDynamization = (
    layerId: string,
    updates: Partial<TextDynamizationSettings>
  ) => {
    updateActiveTemplate((t) => ({
      ...t,
      layers: t.layers.map((l) => {
        if (l.id !== layerId) return l;
        const currentText = l.textDynamization || {
          dynamicContent: true,
          contrastColorEnabled: true,
          contrastTextColor: '#FFFFFF',
        };
        return {
          ...l,
          textDynamization: {
            ...currentText,
            ...updates,
          },
        };
      }),
    }));
  };

  // Update Asset Group
  const handleUpdateAssetGroup = (updatedGroup: AssetGroup) => {
    setProjects((prevProjects) =>
      prevProjects.map((p) => {
        if (p.id !== currentProject.id) return p;
        return {
          ...p,
          assetGroups: p.assetGroups.map((ag) =>
            ag.id === updatedGroup.id ? updatedGroup : ag
          ),
        };
      })
    );
  };

  // Create Template
  const handleCreateTemplate = (newTemplate: MasterTemplate) => {
    setProjects((prevProjects) =>
      prevProjects.map((p) => {
        if (p.id !== currentProject.id) return p;
        return {
          ...p,
          templates: [...p.templates, newTemplate],
        };
      })
    );
    setActiveTemplateId(newTemplate.id);
    setActiveMode('templates');
    setIsInTemplateEditor(true);
  };

  const handleDuplicateTemplate = (templateId: string) => {
    const source = currentProject.templates.find((t) => t.id === templateId);
    if (!source) return;
    const newId = `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const duplicate: MasterTemplate = {
      ...JSON.parse(JSON.stringify(source)),
      id: newId,
      name: `${source.name} (Copy)`,
    };
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== currentProject.id ? p : { ...p, templates: [...p.templates, duplicate] }
      )
    );
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (currentProject.templates.length <= 1) return;
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== currentProject.id) return p;
        const filtered = p.templates.filter((t) => t.id !== templateId);
        return { ...p, templates: filtered };
      })
    );
    if (activeTemplateId === templateId) {
      setActiveTemplateId(currentProject.templates.find((t) => t.id !== templateId)?.id || '');
    }
  };

  // Create Asset Group
  const handleCreateAssetGroup = (newGroup: AssetGroup) => {
    setProjects((prevProjects) =>
      prevProjects.map((p) => {
        if (p.id !== currentProject.id) return p;
        return {
          ...p,
          assetGroups: [...p.assetGroups, newGroup],
        };
      })
    );
    setActiveAssetGroupId(newGroup.id);
  };

  // Duplicate Asset Group
  const handleDuplicateAssetGroup = (sourceGroupId: string) => {
    const sourceGroup = currentProject.assetGroups.find((ag) => ag.id === sourceGroupId);
    if (!sourceGroup) return;

    const newId = `ag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const clonedGroup: AssetGroup = JSON.parse(JSON.stringify(sourceGroup));
    clonedGroup.id = newId;
    clonedGroup.name = `${sourceGroup.name} (Copia)`;

    // Regenerate unique IDs for all asset items to avoid conflicts
    const regenIds = (items: any[]) => items.map((item: any, idx: number) => ({
      ...item,
      id: `asset_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
    }));
    clonedGroup.folders.background = regenIds(clonedGroup.folders.background);
    clonedGroup.folders.logo_1 = regenIds(clonedGroup.folders.logo_1);
    clonedGroup.folders.logo_2 = regenIds(clonedGroup.folders.logo_2);
    clonedGroup.folders.product_image_1 = regenIds(clonedGroup.folders.product_image_1);
    clonedGroup.folders.product_image_2 = regenIds(clonedGroup.folders.product_image_2);

    setProjects((prevProjects) =>
      prevProjects.map((p) => {
        if (p.id !== currentProject.id) return p;
        return {
          ...p,
          assetGroups: [...p.assetGroups, clonedGroup],
        };
      })
    );
    setActiveAssetGroupId(clonedGroup.id);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F3F4F6] font-sans text-gray-900">
      {/* Top Application Header */}
      <Header
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onOpenProjectManager={() => setIsProjectManagerOpen(true)}
        onNewProject={() => setIsProjectManagerOpen(true)}
        activeTemplate={activeTemplate}
        activeAssetGroup={activeAssetGroup}
        onSelectTemplate={setActiveTemplateId}
        onSelectAssetGroup={setActiveAssetGroupId}
        onOpenAssetManager={() => setIsAssetManagerOpen(true)}
        onNewTemplate={() => setIsNewTemplateOpen(true)}
        onRenameTemplate={handleRenameTemplate}
        onRenameAssetGroup={handleRenameAssetGroup}
        onNewAssetGroup={() => setIsNewAssetGroupOpen(true)}
        totalVariationsCount={calculationReport.totalVariationsCount}
        activeMode={activeMode}
        onChangeMode={handleSetActiveMode}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onSave={handleManualSave}
        cloudStatus={cloudStatus}
      />

      {/* Workspace according to active mode */}
      {activeMode === 'home' ? (
        <HomeDashboard
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={(projId) => {
            handleSelectProject(projId);
          }}
          onOpenTemplate={(projId, tplId) => {
            handleSelectProject(projId);
            setActiveTemplateId(tplId);
            setActiveMode('templates');
            setIsInTemplateEditor(true);
          }}
          onOpenAssetGroup={(projId, agId) => {
            handleSelectProject(projId);
            setActiveAssetGroupId(agId);
            setActiveMode('asset_groups');
            setIsInAssetEditor(true);
          }}
          onNewProject={() => setIsProjectManagerOpen(true)}
          onManageBrand={(projId) => {
            handleSelectProject(projId);
            setActiveMode('templates');
            setIsInTemplateEditor(false);
          }}
          onOpenProjectManager={() => setIsProjectManagerOpen(true)}
        />
      ) : activeMode === 'templates' ? (
        isInTemplateEditor ? (
          <>
            {/* Main Workspace (Left Panel + Right Canvas Area) */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel: Modes, Objects & Aspect Ratio Controller */}
              <LeftPanel
                template={activeTemplate}
                assetGroup={activeAssetGroup}
                selectedRatio={selectedRatio}
                selectedLayerId={selectedLayerId}
                currentVariation={allVariations[currentVariationIndex] || null}
                onSelectRatio={setSelectedRatio}
                onToggleActiveRatio={handleToggleActiveRatio}
                onAddLayer={handleAddLayer}
                onUpdateLayerPosition={handleUpdateLayerPosition}
                onUpdateLayer={handleUpdateLayer}
                onDeleteLayer={handleDeleteLayer}
                onUpdateTextDynamization={handleUpdateTextDynamization}
                onUpdateAssetGroup={handleUpdateAssetGroup}
              />

              {/* Right Panel: Interactive Canvas Area */}
              <CanvasArea
                template={activeTemplate}
                assetGroup={activeAssetGroup}
                selectedRatio={selectedRatio}
                variations={allVariations}
                currentVariationIndex={currentVariationIndex}
                selectedLayerId={selectedLayerId}
                onSelectVariationIndex={setCurrentVariationIndex}
                onSelectRatio={setSelectedRatio}
                onSelectLayer={setSelectedLayerId}
                onUpdateLayerPosition={handleUpdateLayerPosition}
                onUpdateLayer={handleUpdateLayer}
              />
            </div>

            {/* Resize Handle */}
            <div
              onMouseDown={handleResizeMouseDown}
              className="h-1.5 bg-gray-100 border-t border-gray-200 cursor-row-resize flex items-center justify-center hover:bg-blue-100 active:bg-blue-200 transition-colors group z-30 flex-shrink-0"
            >
              <div className="w-10 h-0.5 rounded-full bg-gray-300 group-hover:bg-blue-400 transition-colors" />
            </div>

            {/* Bottom Panel: 3 Tabs (Layers, Dynamization, Export) */}
            <BottomPanel
              template={activeTemplate}
              assetGroup={activeAssetGroup}
              variations={allVariations}
              report={calculationReport}
              selectedLayerId={selectedLayerId}
              currentVariationIndex={currentVariationIndex}
              onSelectLayer={setSelectedLayerId}
              onToggleVisibility={handleToggleVisibility}
              onMoveLayer={handleMoveLayer}
              onDeleteLayer={handleDeleteLayer}
              onUpdateLayerDynamization={handleUpdateLayerDynamization}
              onUpdateTextDynamization={handleUpdateTextDynamization}
              onSelectVariationIndex={setCurrentVariationIndex}
              onUpdateAssetGroup={handleUpdateAssetGroup}
              projectName={currentProject.name}
              height={bottomPanelHeight}
            />
          </>
        ) : (
          <TemplatesOverview
            project={currentProject}
            onOpenTemplate={(tplId) => {
              setActiveTemplateId(tplId);
              setIsInTemplateEditor(true);
            }}
            onCreateTemplate={() => setIsNewTemplateOpen(true)}
            onDuplicateTemplate={handleDuplicateTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onRenameTemplate={handleRenameTemplate}
          />
        )
      ) : activeMode === 'asset_groups' ? (
        isInAssetEditor ? (
          <AssetGroupWorkspace
            assetGroup={activeAssetGroup}
            allAssetGroups={currentProject.assetGroups}
            onSelectAssetGroup={setActiveAssetGroupId}
            onNewAssetGroup={() => setIsNewAssetGroupOpen(true)}
            onDuplicateAssetGroup={handleDuplicateAssetGroup}
            onUpdateAssetGroup={handleUpdateAssetGroup}
            onBackToEditor={() => setIsInAssetEditor(false)}
          />
        ) : (
          <AssetsOverview
            project={currentProject}
            onOpenAssetGroup={(agId) => {
              setActiveAssetGroupId(agId);
              setIsInAssetEditor(true);
            }}
            onCreateAssetGroup={() => setIsNewAssetGroupOpen(true)}
            onDuplicateAssetGroup={handleDuplicateAssetGroup}
            onDeleteAssetGroup={handleDeleteAssetGroup}
            onRenameAssetGroup={handleRenameAssetGroup}
          />
        )
      ) : activeMode === 'export' ? (
        /* Unified Export Section (Bulk Export + Publish) */
        <ExportSection project={currentProject} />
      ) : null}

      {/* Modals */}
      <ProjectManagerModal
        isOpen={isProjectManagerOpen}
        projects={projects}
        activeProjectId={activeProjectId}
        onClose={() => setIsProjectManagerOpen(false)}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onUpdateProject={handleUpdateProject}
        onDeleteProject={handleDeleteProject}
        onLoadDemoProject={handleLoadDemoProject}
      />

      <AssetGroupManagerModal
        isOpen={isAssetManagerOpen}
        assetGroup={activeAssetGroup}
        onClose={() => setIsAssetManagerOpen(false)}
        onUpdateAssetGroup={handleUpdateAssetGroup}
      />

      <NewTemplateModal
        isOpen={isNewTemplateOpen}
        onClose={() => setIsNewTemplateOpen(false)}
        onCreateTemplate={handleCreateTemplate}
      />

      <NewAssetGroupModal
        isOpen={isNewAssetGroupOpen}
        onClose={() => setIsNewAssetGroupOpen(false)}
        onCreateAssetGroup={handleCreateAssetGroup}
      />

      {/* Cloud status */}
      {cloudStatus !== 'idle' && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg transition-all ${
          cloudStatus === 'saving' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
          cloudStatus === 'saved' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
          'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {cloudStatus === 'saving' && (
            <><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round"/></svg> Saving to cloud...</>
          )}
          {cloudStatus === 'saved' && (
            <><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg> Saved to cloud</>
          )}
          {cloudStatus === 'error' && (
            <><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg> Cloud save failed</>
          )}
        </div>
      )}
    </div>
  );
}

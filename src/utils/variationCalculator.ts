import {
  AssetGroup,
  AssetItem,
  FolderType,
  GeneratedVariation,
  MasterTemplate,
  ResolvedLayerValue,
  TemplateLayer,
  Tone,
  VariationCalculationReport,
} from '../types';

export function getFolderItems(
  assetGroup: AssetGroup,
  folderType: FolderType
): { items: AssetItem[]; count: number; textStrings?: string[] } {
  switch (folderType) {
    case 'background':
      return { items: assetGroup.folders.background, count: assetGroup.folders.background.length };
    case 'logo_1':
      return { items: assetGroup.folders.logo_1, count: assetGroup.folders.logo_1.length };
    case 'logo_2':
      return { items: assetGroup.folders.logo_2, count: assetGroup.folders.logo_2.length };
    case 'logo_3':
      return { items: assetGroup.folders.logo_3, count: assetGroup.folders.logo_3.length };
    case 'product_image_1':
      return { items: assetGroup.folders.product_image_1, count: assetGroup.folders.product_image_1.length };
    case 'product_image_2':
      return { items: assetGroup.folders.product_image_2, count: assetGroup.folders.product_image_2.length };
    case 'product_image_3':
      return { items: assetGroup.folders.product_image_3, count: assetGroup.folders.product_image_3.length };
    case 'texto_1': {
      const vars = assetGroup.folders.texto_1.variations.filter((v) => v.trim().length > 0);
      return { items: [], count: vars.length, textStrings: vars };
    }
    case 'texto_2': {
      const vars = assetGroup.folders.texto_2.variations.filter((v) => v.trim().length > 0);
      return { items: [], count: vars.length, textStrings: vars };
    }
    case 'texto_3': {
      const vars = assetGroup.folders.texto_3.variations.filter((v) => v.trim().length > 0);
      return { items: [], count: vars.length, textStrings: vars };
    }
    case 'texto_4': {
      const vars = assetGroup.folders.texto_4.variations.filter((v) => v.trim().length > 0);
      return { items: [], count: vars.length, textStrings: vars };
    }
  }
}

/**
 * Checks for circular dependencies in conditional layers.
 */
export function detectCircularDependency(layers: TemplateLayer[]): { hasCycle: boolean; cyclePath?: string } {
  const depMap = new Map<string, string>();
  for (const layer of layers) {
    if (layer.conditionalRule?.dependsOnLayerId) {
      depMap.set(layer.id, layer.conditionalRule.dependsOnLayerId);
    }
  }

  for (const startId of depMap.keys()) {
    const visited = new Set<string>();
    let curr: string | undefined = startId;
    const path: string[] = [];

    while (curr) {
      if (visited.has(curr)) {
        path.push(curr);
        const cycleStartIndex = path.indexOf(curr);
        const subPath = path.slice(cycleStartIndex).map((id) => {
          const l = layers.find((x) => x.id === id);
          return l ? l.name : id;
        });
        return { hasCycle: true, cyclePath: subPath.join(' → ') };
      }
      visited.add(curr);
      path.push(curr);
      curr = depMap.get(curr);
    }
  }

  return { hasCycle: false };
}

/**
 * Selects deterministic asset for contrast against background tone.
 * Rule: Contrast dynamization always picks ONLY 1 asset matching the background contrast.
 * If background is dark -> pick light asset.
 * If background is light -> pick dark asset.
 */
export function selectAssetForContrast(
  allFolderAssets: AssetItem[],
  backgroundTone: Tone
): { finalAsset: AssetItem; corrected: boolean; negativeFillColor?: string } | null {
  if (allFolderAssets.length === 0) return null;

  const neededTone: Tone = backgroundTone === 'dark' ? 'light' : 'dark';

  // 1. Direct match with needed tone
  const direct = allFolderAssets.find((a) => a.tone === neededTone);
  if (direct) {
    return { finalAsset: direct, corrected: true };
  }

  // 2. Check if an asset has a negativeFillColor set (alternative to pairing)
  for (const asset of allFolderAssets) {
    if (asset.negativeFillColor && asset.tone !== neededTone) {
      return { finalAsset: asset, corrected: true, negativeFillColor: asset.negativeFillColor };
    }
  }

  // 3. Check if an asset has an opposite defined
  for (const asset of allFolderAssets) {
    if (asset.oppositeId) {
      const opposite = allFolderAssets.find((a) => a.id === asset.oppositeId);
      if (opposite && opposite.tone === neededTone) {
        return { finalAsset: opposite, corrected: true };
      }
    }
  }

  // 4. Fallback to first available asset
  return { finalAsset: allFolderAssets[0], corrected: false };
}

/**
 * Evaluates contrast between background tone and asset tone for backward compatibility.
 */
export function resolveContrast(
  asset: AssetItem,
  backgroundTone: Tone,
  allFolderAssets: AssetItem[]
): { finalAsset: AssetItem; corrected: boolean; negativeFillColor?: string } {
  const res = selectAssetForContrast(allFolderAssets, backgroundTone);
  if (res) return res;
  return { finalAsset: asset, corrected: false };
}

/**
 * Helper to determine if a hex color is dark based on YIQ luminance.
 */
export function isHexColorDark(hexColor?: string): boolean {
  if (!hexColor) return true;
  let c = hexColor.trim().replace('#', '');
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  if (c.length !== 6) return true;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq < 128;
}

/**
 * Calculate variation metrics and detect errors.
 */
export function calculateVariationReport(
  template: MasterTemplate,
  assetGroup: AssetGroup
): VariationCalculationReport {
  const errors: string[] = [];
  const baseLayers: TemplateLayer[] = [];
  const conditionalLayers: TemplateLayer[] = [];

  // Check circular dependencies
  const cycleCheck = detectCircularDependency(template.layers);
  if (cycleCheck.hasCycle) {
    errors.push(`Dependencia circular detectada entre capas: ${cycleCheck.cyclePath}`);
  }

  // Separate layers by role
  for (const layer of template.layers) {
    if (!layer.visible) continue;
    if (layer.conditionalRule) {
      conditionalLayers.push(layer);
    } else {
      baseLayers.push(layer);
    }
  }

  // Verify folders: any dynamized folder must not be empty
  for (const layer of baseLayers) {
    const { count } = getFolderItems(assetGroup, layer.folderType);
    if (count === 0) {
      errors.push(`The folder '${layer.folderType}' linked to '${layer.name}' is empty (0 files).`);
    }
  }

  for (const layer of conditionalLayers) {
    if (layer.conditionalRule) {
      const { folderIfTrue, folderIfFalse } = layer.conditionalRule;
      const countTrue = getFolderItems(assetGroup, folderIfTrue).count;
      const countFalse = getFolderItems(assetGroup, folderIfFalse).count;
      if (countTrue === 0) {
        errors.push(`The positive branch '${folderIfTrue}' of the conditional layer '${layer.name}' is empty (0 files).`);
      }
      if (countFalse === 0) {
        errors.push(`The negative branch '${folderIfFalse}' of the conditional layer '${layer.name}' is empty (0 files).`);
      }
    }
  }

  if (errors.length > 0) {
    return {
      baseCombinationsCount: 0,
      totalVariationsCount: 0,
      baseLayers,
      conditionalLayers,
      errors,
      branchSummary: [],
    };
  }

  // Calculate combinations:
  // We delegate to generateAllVariations for precise counting because the
  // contrast rule (logo must be opposite tone to background) makes simple
  // multiplication inaccurate.
  const allVariations = generateAllVariations(template, assetGroup);

  const branchMap = new Map<string, number>();
  for (const v of allVariations) {
    const key = v.branchDescription || 'Variaciones resueltas';
    branchMap.set(key, (branchMap.get(key) || 0) + 1);
  }

  const branchSummary = Array.from(branchMap.entries()).map(([desc, count]) => ({
    description: desc,
    multiplier: count,
  }));

  const contrastLayersCount = baseLayers.filter((l) => l.dynamizationType === 'by_contrast').length;
  const logoLayersCount = baseLayers.filter((l) => isLogoFolder(l.folderType)).length;

  let branchDesc = '';
  if (contrastLayersCount > 0 || logoLayersCount > 0) {
    const parts: string[] = [];
    if (contrastLayersCount > 0) parts.push(`${contrastLayersCount} capa(s) por contraste`);
    if (logoLayersCount > 0) parts.push(`logos filtrados por tono opuesto al fondo`);
    branchDesc = `Variaciones base (${parts.join(', ')})`;
  } else {
    branchDesc = 'All layers are fixed or dynamized by folder';
  }

  return {
    baseCombinationsCount: allVariations.length,
    totalVariationsCount: allVariations.length,
    baseLayers,
    conditionalLayers,
    errors: [],
    branchSummary: branchSummary.length > 0 ? branchSummary : [
      { description: branchDesc, multiplier: allVariations.length },
    ],
  };
}

/**
 * Helper: checks if a folder type is a logo folder.
 */
function isLogoFolder(folderType: FolderType): boolean {
  return folderType === 'logo_1' || folderType === 'logo_2';
}

/**
 * Generates all valid variations.
 *
 * CORE CONTRAST RULE (MANDATORY):
 * Logo layers MUST always use the opposite tone relative to the background.
 *   - Dark background  → only light logos
 *   - Light background → only dark logos
 * Same-tone combinations (dark bg + dark logo, light bg + light logo) are NEVER generated.
 *
 * How it works:
 *   1. Background is iterated FIRST to establish the tone context.
 *   2. For each background, logo candidates are filtered to opposite-tone only.
 *   3. Other by_folder layers form the cartesian base normally.
 *   4. by_contrast layers pick exactly 1 opposite-tone asset per background.
 *   5. Text layers apply content dynamization and contrast color adaptation.
 *   6. Conditional layers branch dynamically (also respecting the contrast rule for logos).
 */
export function generateAllVariations(
  template: MasterTemplate,
  assetGroup: AssetGroup
): GeneratedVariation[] {
  const visibleLayers = template.layers.filter((l) => l.visible);
  if (visibleLayers.length === 0) return [];

  // Check required folders
  for (const layer of visibleLayers) {
    if (!layer.conditionalRule) {
      const { count } = getFolderItems(assetGroup, layer.folderType);
      if (count === 0) return [];
    }
  }

  // Categorize layers
  const bgLayer = visibleLayers.find(
    (l) => l.folderType === 'background' && l.dynamizationType === 'by_folder'
  );
  const contrastLayers = visibleLayers.filter((l) => l.dynamizationType === 'by_contrast' && !l.conditionalRule);
  const conditionalLayers = visibleLayers.filter((l) => l.conditionalRule != null);

  // Logo layers set to by_folder (handled per-background with tone filtering)
  const logoByFolderLayers = visibleLayers.filter(
    (l) => l.dynamizationType === 'by_folder' && isLogoFolder(l.folderType) && !l.conditionalRule
  );
  // Other independent by_folder layers (NOT background, NOT logos)
  const otherByFolderLayers = visibleLayers.filter(
    (l) =>
      l.dynamizationType === 'by_folder' &&
      !isLogoFolder(l.folderType) &&
      l.folderType !== 'background' &&
      !l.conditionalRule
  );

  type LayerCandidate = {
    layer: TemplateLayer;
    item?: AssetItem;
    text?: string;
  };

  function getCandidatesForLayer(
    layer: TemplateLayer,
    filterTone?: Tone
  ): LayerCandidate[] {
    const info = getFolderItems(assetGroup, layer.folderType);

    // Text layers
    if (layer.folderType.startsWith('texto')) {
      if (layer.textDynamization?.dynamicContent === false) {
        const singleText = info.textStrings?.[0] || 'Texto';
        return [{ layer, text: singleText }];
      }
      if (info.textStrings && info.textStrings.length > 0) {
        return info.textStrings.map((t) => ({ layer, text: t }));
      }
      return [{ layer, text: 'Texto' }];
    }

    // Image layers
    let items = info.items;
    if (filterTone !== undefined) {
      const filtered = items.filter((it) => it.tone === filterTone);
      if (filtered.length > 0) {
        items = filtered;
      }
      // Graceful degradation: if no assets match the required tone, use all
    }

    return items.map((it) => ({ layer, item: it }));
  }

  // Get background candidates
  const bgCandidates: LayerCandidate[] = bgLayer
    ? getCandidatesForLayer(bgLayer)
    : [];

  // If there's no bg layer but there are other layers, use a single dummy entry
  const hasBgLayer = bgLayer != null;
  const bgIterator: Array<{ candidate: LayerCandidate | null; bgTone: Tone }> =
    hasBgLayer
      ? bgCandidates.map((c) => ({ candidate: c, bgTone: (c.item?.tone || 'light') as Tone }))
      : [{ candidate: null, bgTone: 'light' as Tone }];

  const result: GeneratedVariation[] = [];

  // Iterate per-background to enforce contrast rule on logos
  for (const { candidate: bgCandidate, bgTone } of bgIterator) {
    const requiredLogoTone: Tone = bgTone === 'dark' ? 'light' : 'dark';

    // Build logo candidates filtered by opposite tone
    const logoLayerCandidates: LayerCandidate[][] = logoByFolderLayers.map((logoLayer) =>
      getCandidatesForLayer(logoLayer, requiredLogoTone)
    );

    // Build other layer candidates normally
    const otherLayerCandidates: LayerCandidate[][] = otherByFolderLayers.map((layer) =>
      getCandidatesForLayer(layer)
    );

    // Combine all candidate arrays: [logos..., others...]
    const allCandidateArrays = [...logoLayerCandidates, ...otherLayerCandidates];

    // Generate cartesian product for this background
    let subTuples: LayerCandidate[][] = [[]];
    for (const candidates of allCandidateArrays) {
      if (candidates.length === 0) {
        subTuples = [];
        break;
      }
      const nextTuples: LayerCandidate[][] = [];
      for (const tuple of subTuples) {
        for (const cand of candidates) {
          nextTuples.push([...tuple, cand]);
        }
      }
      subTuples = nextTuples;
    }

    if (subTuples.length === 0 && allCandidateArrays.length > 0) continue;

    // Process each sub-tuple for this background
    for (const subTuple of subTuples) {
      const resolved: Record<string, ResolvedLayerValue> = {};

      // Resolve background
      if (bgLayer && bgCandidate?.item) {
        resolved[bgLayer.id] = {
          layerId: bgLayer.id,
          folderUsed: bgLayer.folderType,
          assetItem: bgCandidate.item,
          resolvedTone: bgCandidate.item.tone,
          contrastCorrected: false,
          originalAssetItem: bgCandidate.item,
        };
      }

      // Resolve sub-tuple layers (logos + others)
      for (const c of subTuple) {
        resolved[c.layer.id] = {
          layerId: c.layer.id,
          folderUsed: c.layer.folderType,
          assetItem: c.item,
          textValue: c.text,
          resolvedTone: c.item?.tone,
          contrastCorrected: isLogoFolder(c.layer.folderType),
          originalAssetItem: c.item,
        };
      }

      // Resolve by_contrast layers
      for (const cLayer of contrastLayers) {
        const folderInfo = getFolderItems(assetGroup, cLayer.folderType);
        const res = selectAssetForContrast(folderInfo.items, bgTone);
        if (res) {
          resolved[cLayer.id] = {
            layerId: cLayer.id,
            folderUsed: cLayer.folderType,
            assetItem: res.finalAsset,
            resolvedTone: res.finalAsset.tone,
            contrastCorrected: res.corrected,
            originalAssetItem: res.finalAsset,
            negativeFillColor: res.negativeFillColor,
          };
        }
      }

      // Resolve text layer colors by contrast
      for (const layer of visibleLayers) {
        if (layer.folderType.startsWith('texto')) {
          const textRes = resolved[layer.id];
          if (textRes) {
            const defaultTextColor =
              layer.positionsByRatio['1:1']?.textColor || '#0F172A';
            const textSettings = layer.textDynamization;
            const isContrastColorActive =
              textSettings?.contrastColorEnabled ?? true;
            const targetContrastColor =
              textSettings?.contrastTextColor || '#FFFFFF';

            let finalColor = defaultTextColor;
            let wasCorrected = false;

            if (isContrastColorActive) {
              const baseIsDark = isHexColorDark(defaultTextColor);
              if (bgTone === 'dark' && baseIsDark) {
                finalColor = targetContrastColor;
                wasCorrected = true;
              } else if (bgTone === 'light' && !baseIsDark) {
                finalColor = targetContrastColor;
                wasCorrected = true;
              }
            }

            resolved[layer.id] = {
              ...textRes,
              resolvedTextColor: finalColor,
              contrastCorrected: wasCorrected,
            };
          }
        }
      }

      // Conditional layers
      if (conditionalLayers.length === 0) {
        result.push({
          index: result.length + 1,
          resolvedLayers: { ...resolved },
        });
        continue;
      }

      const orderedConditionals = [...conditionalLayers];

      function expandConditionals(
        condIndex: number,
        currentResolved: Record<string, ResolvedLayerValue>,
        branchNotes: string[]
      ) {
        if (condIndex >= orderedConditionals.length) {
          result.push({
            index: result.length + 1,
            resolvedLayers: { ...currentResolved },
            branchDescription: branchNotes.join(' & '),
          });
          return;
        }

        const condLayer = orderedConditionals[condIndex];
        const rule = condLayer.conditionalRule;

        let chosenFolder: FolderType = condLayer.folderType;
        let branchNote = '';

        if (rule) {
          const targetResolved = currentResolved[rule.dependsOnLayerId];
          const targetTone = targetResolved?.resolvedTone || 'light';
          const targetLayerName =
            template.layers.find((l) => l.id === rule.dependsOnLayerId)?.name ||
            'Capa origen';

          let isTrue = false;
          if (rule.condition === 'resolved_tone_is_dark') {
            isTrue = targetTone === 'dark';
          } else {
            isTrue = targetTone === 'light';
          }

          chosenFolder = isTrue ? rule.folderIfTrue : rule.folderIfFalse;
          branchNote = `${targetLayerName} es ${targetTone} → usa ${chosenFolder}`;
        }

        const folderInfo = getFolderItems(assetGroup, chosenFolder);
        if (folderInfo.count === 0) {
          return;
        }

        if (folderInfo.textStrings) {
          for (const textStr of folderInfo.textStrings) {
            const defaultTextColor =
              condLayer.positionsByRatio['1:1']?.textColor || '#0F172A';
            const textSettings = condLayer.textDynamization;
            const isContrastColorActive =
              textSettings?.contrastColorEnabled ?? true;
            const targetContrastColor =
              textSettings?.contrastTextColor || '#FFFFFF';

            let finalColor = defaultTextColor;
            let wasCorrected = false;
            if (isContrastColorActive) {
              const baseIsDark = isHexColorDark(defaultTextColor);
              if (bgTone === 'dark' && baseIsDark) {
                finalColor = targetContrastColor;
                wasCorrected = true;
              } else if (bgTone === 'light' && !baseIsDark) {
                finalColor = targetContrastColor;
                wasCorrected = true;
              }
            }

            const nextResolved = {
              ...currentResolved,
              [condLayer.id]: {
                layerId: condLayer.id,
                folderUsed: chosenFolder,
                textValue: textStr,
                resolvedTone: 'light' as Tone,
                contrastCorrected: wasCorrected,
                resolvedTextColor: finalColor,
              },
            };
            expandConditionals(condIndex + 1, nextResolved, [
              ...branchNotes,
              branchNote,
            ]);
          }
        } else {
          // For conditional logo layers, ALSO enforce contrast rule
          let itemsToIterate = folderInfo.items;
          if (isLogoFolder(chosenFolder)) {
            const filtered = itemsToIterate.filter(
              (it) => it.tone === requiredLogoTone
            );
            if (filtered.length > 0) itemsToIterate = filtered;
          }

          if (condLayer.dynamizationType === 'by_contrast') {
            const res = selectAssetForContrast(itemsToIterate, bgTone);
            if (res) {
              const nextResolved = {
                ...currentResolved,
                [condLayer.id]: {
                  layerId: condLayer.id,
                  folderUsed: chosenFolder,
                  assetItem: res.finalAsset,
                  resolvedTone: res.finalAsset.tone,
                  contrastCorrected: res.corrected,
                  originalAssetItem: res.finalAsset,
                  negativeFillColor: res.negativeFillColor,
                },
              };
              expandConditionals(condIndex + 1, nextResolved, [
                ...branchNotes,
                branchNote,
              ]);
            }
          } else {
            for (const assetItem of itemsToIterate) {
              const nextResolved = {
                ...currentResolved,
                [condLayer.id]: {
                  layerId: condLayer.id,
                  folderUsed: chosenFolder,
                  assetItem,
                  resolvedTone: assetItem.tone,
                  contrastCorrected: false,
                  originalAssetItem: assetItem,
                },
              };
              expandConditionals(condIndex + 1, nextResolved, [
                ...branchNotes,
                branchNote,
              ]);
            }
          }
        }
      }

      expandConditionals(0, resolved, []);
    }
  }

  return result;
}


import JSZip from 'jszip';
import {
  ASPECT_RATIOS,
  AspectRatioKey,
  AssetGroup,
  AssetItem,
  GeneratedVariation,
  MasterTemplate,
  AnchorPoint,
} from '../types';

/**
 * Maps anchor point to horizontal and vertical alignment
 */
export function getAnchorAlignment(anchor: AnchorPoint = 'center'): {
  horizontal: 'left' | 'center' | 'right';
  vertical: 'top' | 'middle' | 'bottom';
} {
  switch (anchor) {
    case 'top-left':
      return { horizontal: 'left', vertical: 'top' };
    case 'top-center':
      return { horizontal: 'center', vertical: 'top' };
    case 'top-right':
      return { horizontal: 'right', vertical: 'top' };
    case 'middle-left':
      return { horizontal: 'left', vertical: 'middle' };
    case 'center':
      return { horizontal: 'center', vertical: 'middle' };
    case 'middle-right':
      return { horizontal: 'right', vertical: 'middle' };
    case 'bottom-left':
      return { horizontal: 'left', vertical: 'bottom' };
    case 'bottom-center':
      return { horizontal: 'center', vertical: 'bottom' };
    case 'bottom-right':
      return { horizontal: 'right', vertical: 'bottom' };
    default:
      return { horizontal: 'center', vertical: 'middle' };
  }
}

/**
 * Resolves the appropriate image URL for an asset based on current aspect ratio.
 * Supports specialized modes: Square (1:1), Retrato (9:16, 4:5), and Landscape (16:9).
 * Falls back to asset.url if no specific ratio image is configured.
 */
export function getAssetUrlForRatio(asset: AssetItem, ratioKey: AspectRatioKey): string {
  if (!asset.ratioUrls) return asset.url;

  if (ratioKey === '1:1') {
    return asset.ratioUrls['1:1'] || asset.ratioUrls.square || asset.url;
  }
  if (ratioKey === '9:16' || ratioKey === '4:5') {
    return asset.ratioUrls[ratioKey] || asset.ratioUrls.portrait || asset.url;
  }
  if (ratioKey === '16:9') {
    return asset.ratioUrls['16:9'] || asset.ratioUrls.landscape || asset.url;
  }
  return asset.url;
}

/**
 * Returns clean folder name for ratio-based export
 */
export function getRatioFolderName(ratioKey: AspectRatioKey, activeRatios: AspectRatioKey[]): string {
  switch (ratioKey) {
    case '1:1':
      return 'Cuadrado';
    case '9:16':
      return activeRatios.includes('4:5') ? 'Retrato_9x16' : 'Retrato';
    case '4:5':
      return activeRatios.includes('9:16') ? 'Retrato_4x5' : 'Retrato';
    case '16:9':
      return 'Landscape';
    default:
      return String(ratioKey).replace(':', 'x');
  }
}

/**
 * Loads an image from a URL or data URL and returns an HTMLImageElement
 */
const imageCache = new Map<string, HTMLImageElement>();

export function preloadImage(url: string): Promise<HTMLImageElement> {
  if (imageCache.has(url)) {
    const cached = imageCache.get(url)!;
    if (cached.complete) return Promise.resolve(cached);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = () => {
      // Return a fallback blank or placeholder rather than hard-failing
      resolve(img);
    };
    img.src = url;
  });
}

/**
 * Renders a single variation on a canvas element for a specific aspect ratio
 */
export async function renderVariationOnCanvas(
  canvas: HTMLCanvasElement,
  variation: GeneratedVariation,
  template: MasterTemplate,
  ratioKey: AspectRatioKey,
  targetWidth?: number
) {
  const meta = ASPECT_RATIOS[ratioKey] || ASPECT_RATIOS['1:1'];
  const baseW = targetWidth || meta.width;
  const baseH = Math.round((baseW * meta.height) / meta.width);

  canvas.width = baseW;
  canvas.height = baseH;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear canvas
  ctx.clearRect(0, 0, baseW, baseH);

  // Background fallback
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, baseW, baseH);

  // Render layers in stack order
  for (const layer of template.layers) {
    if (!layer.visible) continue;

    const resolved = variation.resolvedLayers[layer.id];
    if (!resolved) continue;

    const pos = layer.positionsByRatio[ratioKey] ||
      layer.positionsByRatio['1:1'] || {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        opacity: 1,
      };

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, pos.opacity ?? 1));

    const layerX = (pos.x / 100) * baseW;
    const layerY = (pos.y / 100) * baseH;
    const layerW = (pos.width / 100) * baseW;
    const layerH = (pos.height / 100) * baseH;

    // 0. Form (Shape) Layer
    if (layer.folderType.startsWith('form') && layer.shapeConfig) {
      const shape = layer.shapeConfig;
      const fillColor = resolved.resolvedShapeColor || shape.fillColor;
      const opacity = (pos.opacity ?? 1) * (shape.opacity ?? 1);

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = fillColor;

      if (shape.strokeWidth > 0 && shape.strokeColor !== 'transparent') {
        ctx.strokeStyle = shape.strokeColor;
        ctx.lineWidth = shape.strokeWidth;
      }

      switch (shape.shapeType) {
        case 'rectangle': {
          const r = shape.borderRadius || 0;
          if (r > 0) {
            ctx.beginPath();
            ctx.roundRect(layerX, layerY, layerW, layerH, r);
            ctx.fill();
            if (shape.strokeWidth > 0) ctx.stroke();
          } else {
            ctx.fillRect(layerX, layerY, layerW, layerH);
            if (shape.strokeWidth > 0) ctx.strokeRect(layerX, layerY, layerW, layerH);
          }
          break;
        }
        case 'circle': {
          const radius = Math.min(layerW, layerH) / 2;
          const cx = layerX + layerW / 2;
          const cy = layerY + layerH / 2;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();
          if (shape.strokeWidth > 0) ctx.stroke();
          break;
        }
        case 'ellipse': {
          const cx = layerX + layerW / 2;
          const cy = layerY + layerH / 2;
          ctx.beginPath();
          ctx.ellipse(cx, cy, layerW / 2, layerH / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          if (shape.strokeWidth > 0) ctx.stroke();
          break;
        }
        case 'triangle': {
          ctx.beginPath();
          ctx.moveTo(layerX + layerW / 2, layerY);
          ctx.lineTo(layerX + layerW, layerY + layerH);
          ctx.lineTo(layerX, layerY + layerH);
          ctx.closePath();
          ctx.fill();
          if (shape.strokeWidth > 0) ctx.stroke();
          break;
        }
        case 'line': {
          ctx.beginPath();
          ctx.moveTo(layerX, layerY + layerH / 2);
          ctx.lineTo(layerX + layerW, layerY + layerH / 2);
          ctx.lineWidth = shape.strokeWidth || 2;
          ctx.strokeStyle = fillColor;
          ctx.stroke();
          break;
        }
      }

      ctx.restore();
      continue;
    }

    // 1. Text Layer
    if (layer.folderType.startsWith('texto') || resolved.textValue) {
      const text = resolved.textValue || '';
      if (text) {
        // Optional background box behind text
        if (pos.textBgColor && pos.textBgColor !== 'transparent') {
          ctx.fillStyle = pos.textBgColor;
          ctx.fillRect(layerX, layerY, layerW, layerH);
        }

        const scaleFactor = baseW / 1080;
        const fontSize = Math.max(12, Math.round((pos.fontSize || 42) * scaleFactor));
        const rawWeight = pos.fontWeight || 'bold';
        const fontWeightMap: Record<string, string> = { normal: '400', medium: '500', bold: '700', black: '900' };
        const fontWeight = fontWeightMap[rawWeight] || rawWeight;
        const fontFamily = pos.fontFamily || 'Inter';
        ctx.font = `${fontWeight} ${fontSize}px '${fontFamily}', system-ui, sans-serif`;
        ctx.fillStyle = resolved.resolvedTextColor || pos.textColor || '#111827';
        ctx.textBaseline = 'top';

        // Apply text transform
        let displayText = text;
        if (pos.textTransform === 'uppercase') displayText = text.toUpperCase();
        else if (pos.textTransform === 'lowercase') displayText = text.toLowerCase();

        const ls = (pos.letterSpacing || 0) * scaleFactor; // scale letter spacing too

        if (pos.textShadow) {
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 2;
        }

        // Helper to measure text with letter spacing
        const measureWithLS = (str: string) => {
          if (ls === 0) return ctx.measureText(str).width;
          return ctx.measureText(str).width + ls * Math.max(0, str.length - 1);
        };

        // Helper to draw text with letter spacing
        const drawTextWithLS = (str: string, tx: number, ty: number) => {
          if (ls === 0) {
            ctx.fillText(str, tx, ty);
            return;
          }
          let cx = tx;
          for (let i = 0; i < str.length; i++) {
            ctx.fillText(str[i], cx, ty);
            cx += ctx.measureText(str[i]).width + ls;
          }
        };

        // Multiline wrapping
        const words = displayText.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          if (measureWithLS(testLine) > layerW && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);

        const anchor = getAnchorAlignment(pos.anchorPoint || 'center');
        const textAlignment = pos.textAlign || anchor.horizontal;

        const lineHeightMult = pos.lineHeight ?? 1.35;
        const lineHeight = fontSize * lineHeightMult;
        const totalTextHeight = lines.length * lineHeight;
        let startY = layerY;
        if (anchor.vertical === 'middle') {
          startY = layerY + Math.max(0, (layerH - totalTextHeight) / 2);
        } else if (anchor.vertical === 'bottom') {
          startY = layerY + Math.max(0, layerH - totalTextHeight);
        } else {
          startY = layerY;
        }

        lines.forEach((line, idx) => {
          const lineWidth = measureWithLS(line);
          let lineX = layerX;
          if (textAlignment === 'center') {
            lineX = layerX + (layerW - lineWidth) / 2;
          } else if (textAlignment === 'right') {
            lineX = layerX + layerW - lineWidth;
          } else {
            lineX = layerX;
          }
          drawTextWithLS(line, lineX, startY + idx * lineHeight);
        });
      }
    }

    // 2. Image / Asset Layer (Background, Logos, Products)
    else if (resolved.assetItem) {
      const asset = resolved.assetItem;
      try {
        const effectiveUrl = getAssetUrlForRatio(asset, ratioKey);
        const img = await preloadImage(effectiveUrl);
        if (img && img.naturalWidth > 0) {
          const fit = pos.objectFit || (layer.folderType === 'background' ? 'cover' : 'contain');
          const scaleFactor = (pos.scale !== undefined ? pos.scale : 100) / 100;
          const anchor = getAnchorAlignment(pos.anchorPoint || 'center');

          if (fit === 'cover') {
            const nw = img.naturalWidth;
            const nh = img.naturalHeight;

            // Asset focal point: where the subject IS in the source image (auto-detected)
            const afx = asset.focalPoint?.x ?? 0.5;
            const afy = asset.focalPoint?.y ?? 0.5;
            // Layer focal point: where the user WANTS the subject in the composition
            const lfx = pos.focalPoint?.x ?? 0.5;
            const lfy = pos.focalPoint?.y ?? 0.5;

            // Step 1: Base cover scale (minimum to fill the layer)
            const baseScale = Math.max(layerW / nw, layerH / nh);

            // Step 2: Find the minimum scale that still covers after focal alignment.
            // We need: drawX <= layerX  AND  drawX + nw*scale >= layerX + layerW
            //   drawX = layerX + lfx*layerW - afx*nw*scale
            //   => lfx*layerW <= afx*nw*scale          => scale >= (lfx*layerW) / (afx*nw)
            //   => (1-lfx)*layerW <= (1-afx)*nw*scale  => scale >= ((1-lfx)*layerW) / ((1-afx)*nw)
            // Same for Y axis.
            const scaleConstraints = [baseScale];
            if (afx > 0.001) scaleConstraints.push((lfx * layerW) / (afx * nw));
            if (afx < 0.999) scaleConstraints.push(((1 - lfx) * layerW) / ((1 - afx) * nw));
            if (afy > 0.001) scaleConstraints.push((lfy * layerH) / (afy * nh));
            if (afy < 0.999) scaleConstraints.push(((1 - lfy) * layerH) / ((1 - afy) * nh));

            const finalScale = Math.max(...scaleConstraints);

            // Step 3: Position the image so that source focal maps to layer focal
            const drawW = nw * finalScale;
            const drawH = nh * finalScale;
            let drawX = layerX + lfx * layerW - afx * drawW;
            let drawY = layerY + lfy * layerH - afy * drawH;

            // Safety clamp (shouldn't be needed, but prevents sub-pixel gaps)
            drawX = Math.min(layerX, Math.max(layerX + layerW - drawW, drawX));
            drawY = Math.min(layerY, Math.max(layerY + layerH - drawH, drawY));

            // Clip to layer bounds so the image never bleeds past the edges
            ctx.save();
            ctx.beginPath();
            ctx.rect(layerX, layerY, layerW, layerH);
            ctx.clip();
            ctx.drawImage(img, 0, 0, nw, nh, drawX, drawY, drawW, drawH);
            ctx.restore();
          } else {
            // contain
            const imgRatio = img.naturalWidth / img.naturalHeight;
            const targetRatio = layerW / layerH;
            let baseDrawW = layerW;
            let baseDrawH = layerH;

            if (imgRatio > targetRatio) {
              baseDrawW = layerW;
              baseDrawH = layerW / imgRatio;
            } else {
              baseDrawH = layerH;
              baseDrawW = layerH * imgRatio;
            }

            // Apply scale (100% = 1.0 = base size)
            const drawW = baseDrawW * scaleFactor;
            const drawH = baseDrawH * scaleFactor;

            // Apply anchor point for placement
            let drawX = layerX;
            if (anchor.horizontal === 'center') {
              drawX = layerX + (layerW - drawW) / 2;
            } else if (anchor.horizontal === 'right') {
              drawX = layerX + layerW - drawW;
            } else {
              // left
              drawX = layerX;
            }

            let drawY = layerY;
            if (anchor.vertical === 'middle') {
              drawY = layerY + (layerH - drawH) / 2;
            } else if (anchor.vertical === 'bottom') {
              drawY = layerY + layerH - drawH;
            } else {
              // top
              drawY = layerY;
            }

            ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, drawX, drawY, drawW, drawH);

            // Apply negative fill color (solid color silhouette)
            if (resolved.negativeFillColor) {
              const offCanvas = document.createElement('canvas');
              offCanvas.width = Math.ceil(drawW);
              offCanvas.height = Math.ceil(drawH);
              const offCtx = offCanvas.getContext('2d');
              if (offCtx) {
                offCtx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, drawW, drawH);
                offCtx.globalCompositeOperation = 'source-in';
                offCtx.fillStyle = resolved.negativeFillColor;
                offCtx.fillRect(0, 0, drawW, drawH);
                // Redraw over the original
                ctx.clearRect(drawX, drawY, drawW, drawH);
                ctx.drawImage(offCanvas, drawX, drawY);
              }
            }
          }
        } else if (asset.previewColor) {
          // Color fallback block
          ctx.fillStyle = asset.previewColor;
          ctx.fillRect(layerX, layerY, layerW, layerH);
        }
      } catch (err) {
        console.warn('Could not draw asset', asset.name, err);
      }
    }

    ctx.restore();
  }
}

/**
 * Render variation to Blob
 */
export async function renderVariationToBlob(
  variation: GeneratedVariation,
  template: MasterTemplate,
  ratioKey: AspectRatioKey,
  targetWidth?: number
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  await renderVariationOnCanvas(canvas, variation, template, ratioKey, targetWidth);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to generate canvas blob'));
    }, 'image/png');
  });
}

/**
 * Export all variations into a structured ZIP file organized by ratio folders
 */
export async function exportAllVariationsZip(
  template: MasterTemplate,
  assetGroup: AssetGroup,
  variations: GeneratedVariation[],
  projectName: string,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<Blob> {
  const zip = new JSZip();
  const totalFiles = variations.length * template.activeAspectRatios.length;
  let processed = 0;

  // Sanitize names for file paths
  const safeProject = projectName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
  const safeAssetGroup = assetGroup.name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');

  // Map ratio keys to short folder/file labels
  const ratioLabel = (key: AspectRatioKey): string => {
    switch (key) {
      case '1:1': return 'square';
      case '4:5': return 'retrato_4x5';
      case '9:16': return 'retrato_9x16';
      case '16:9': return 'landscape';
      default: return String(key).replace(':', 'x');
    }
  };

  // Detect background tone for a variation
  const getBgTone = (variation: GeneratedVariation): string => {
    const bgLayer = template.layers.find((l) => l.folderType === 'background');
    if (bgLayer) {
      const resolved = variation.resolvedLayers[bgLayer.id];
      if (resolved?.resolvedTone) return resolved.resolvedTone;
    }
    return 'light';
  };

  // Root summary manifest
  const manifest = {
    exportedAt: new Date().toISOString(),
    organization: 'by_ratio',
    projectName,
    templateName: template.name,
    assetGroupName: assetGroup.name,
    namingConvention: 'proyecto_assetgroup_tone_ratio_index',
    activeAspectRatios: template.activeAspectRatios.map((r) => ({
      key: r,
      folderName: getRatioFolderName(r, template.activeAspectRatios),
      meta: ASPECT_RATIOS[r],
    })),
    totalVariations: variations.length,
    totalFiles,
    variations: variations.map((v) => ({
      index: v.index,
      bgTone: getBgTone(v),
      branchDescription: v.branchDescription,
      layers: Object.values(v.resolvedLayers).map((l) => ({
        layerId: l.layerId,
        folderUsed: l.folderUsed,
        assetName: l.assetItem?.name,
        text: l.textValue,
        resolvedTone: l.resolvedTone,
        contrastCorrected: l.contrastCorrected,
      })),
    })),
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // Export organized by RATIO folders
  for (const ratioKey of template.activeAspectRatios) {
    const meta = ASPECT_RATIOS[ratioKey];
    const folderName = getRatioFolderName(ratioKey, template.activeAspectRatios);
    const ratioFolder = zip.folder(folderName);

    for (const variation of variations) {
      onProgress?.(
        processed + 1,
        totalFiles,
        `Generando ${folderName} — Var #${variation.index} (${meta.width}x${meta.height})...`
      );

      const blob = await renderVariationToBlob(variation, template, ratioKey, meta.width);
      const tone = getBgTone(variation);
      const idx = String(variation.index).padStart(3, '0');
      const fileName = `${safeProject}_${safeAssetGroup}_${tone}_${ratioLabel(ratioKey)}_${idx}.png`;
      ratioFolder?.file(fileName, blob);
      processed++;
    }
  }

  onProgress?.(totalFiles, totalFiles, 'Packaging ZIP file...');
  const content = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    onProgress?.(totalFiles, totalFiles, `Comprimiendo (${Math.round(metadata.percent)}%)...`);
  });

  return content;
}

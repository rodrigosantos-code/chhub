/**
 * Alpha-based image analysis utilities for visual matching/comparison.
 *
 * Reads the alpha channel of PNG images, calculates centroid (weighted center)
 * and RMS radius (content size), then normalizes for visual comparison.
 */

export interface AlphaAnalysis {
  centroidX: number; // 0-1 normalized
  centroidY: number; // 0-1 normalized
  rmsRadius: number; // in pixels (original image space)
  width: number;
  height: number;
}

/**
 * Analyze the alpha channel of an image.
 * Returns the centroid (weighted average of opaque pixels) and RMS radius.
 */
export function analyzeAlpha(imageUrl: string): Promise<AlphaAnalysis> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Cannot get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const ALPHA_THRESHOLD = 40;

      let sumX = 0;
      let sumY = 0;
      let sumWeight = 0;

      // First pass: compute centroid
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;
          const alpha = data[idx + 3];
          if (alpha > ALPHA_THRESHOLD) {
            const weight = alpha / 255;
            sumX += x * weight;
            sumY += y * weight;
            sumWeight += weight;
          }
        }
      }

      if (sumWeight === 0) {
        resolve({
          centroidX: 0.5,
          centroidY: 0.5,
          rmsRadius: 0,
          width: canvas.width,
          height: canvas.height,
        });
        return;
      }

      const cx = sumX / sumWeight;
      const cy = sumY / sumWeight;

      // Second pass: compute RMS radius (dispersion)
      let sumDistSq = 0;
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;
          const alpha = data[idx + 3];
          if (alpha > ALPHA_THRESHOLD) {
            const weight = alpha / 255;
            const dx = x - cx;
            const dy = y - cy;
            sumDistSq += (dx * dx + dy * dy) * weight;
          }
        }
      }

      const rmsRadius = Math.sqrt(sumDistSq / sumWeight);

      resolve({
        centroidX: cx / canvas.width,
        centroidY: cy / canvas.height,
        rmsRadius,
        width: canvas.width,
        height: canvas.height,
      });
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

/**
 * Draw a normalized image onto a canvas.
 * Scales so its RMS radius matches targetRadius, and translates so centroid is at canvas center.
 */
export function drawNormalized(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  analysis: AlphaAnalysis,
  canvasSize: number,
  targetRadius: number
): void {
  const scale = analysis.rmsRadius > 0 ? targetRadius / analysis.rmsRadius : 1;

  const cx = analysis.centroidX * analysis.width;
  const cy = analysis.centroidY * analysis.height;

  // Center of canvas
  const canvasCx = canvasSize / 2;
  const canvasCy = canvasSize / 2;

  // Translate so centroid is at canvas center, then scale
  const drawX = canvasCx - cx * scale;
  const drawY = canvasCy - cy * scale;
  const drawW = analysis.width * scale;
  const drawH = analysis.height * scale;

  ctx.drawImage(img, drawX, drawY, drawW, drawH);
}

/**
 * Generate a normalized PNG data URL for an image.
 * The output canvas has the same dimensions as the original, but the content
 * is re-centered and scaled so its RMS radius matches targetRadius.
 */
export function normalizeImageToDataUrl(
  img: HTMLImageElement,
  analysis: AlphaAnalysis,
  targetRadius: number
): string {
  // Use the original image dimensions as output canvas
  const outW = img.naturalWidth;
  const outH = img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return img.src;

  const scale = analysis.rmsRadius > 0 ? targetRadius / analysis.rmsRadius : 1;

  const cx = analysis.centroidX * analysis.width;
  const cy = analysis.centroidY * analysis.height;

  // Center of output canvas
  const canvasCx = outW / 2;
  const canvasCy = outH / 2;

  const drawX = canvasCx - cx * scale;
  const drawY = canvasCy - cy * scale;
  const drawW = analysis.width * scale;
  const drawH = analysis.height * scale;

  ctx.drawImage(img, drawX, drawY, drawW, drawH);

  return canvas.toDataURL('image/png');
}

import { AssetItem, Tone } from '../types';
import { processImageFile } from './imageConverter';

/**
 * Calculates luminance of an image data URL, ignoring transparent pixels.
 * Returns 'light' if the image content is predominantly bright/white, or 'dark' if dark/black.
 */
export function detectImageLuminanceTone(dataUrl: string): Promise<Tone> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('dark');
          return;
        }
        ctx.drawImage(img, 0, 0, 32, 32);
        const imgData = ctx.getImageData(0, 0, 32, 32).data;
        let totalLum = 0;
        let countedPixels = 0;

        for (let i = 0; i < imgData.length; i += 4) {
          const alpha = imgData[i + 3];
          // Only evaluate non-transparent pixels (crucial for transparent logos)
          if (alpha > 30) {
            const r = imgData[i];
            const g = imgData[i + 1];
            const b = imgData[i + 2];
            const lum = (r * 299 + g * 587 + b * 114) / 1000;
            totalLum += lum;
            countedPixels++;
          }
        }

        if (countedPixels === 0) {
          resolve('dark');
          return;
        }

        const avg = totalLum / countedPixels;
        // Average luminance >= 128 indicates a light asset (e.g. white logo or light background)
        resolve(avg >= 128 ? 'light' : 'dark');
      } catch {
        resolve('dark');
      }
    };
    img.onerror = () => resolve('dark');
    img.src = dataUrl;
  });
}

/**
 * Detects the focal point (point of interest) of an image using Sobel edge density.
 * Downscales to 64x64, computes edge gradient magnitude, then returns the
 * weighted centroid of edge density as normalized (0-1) coordinates.
 */
export function detectFocalPoint(dataUrl: string): Promise<{ x: number; y: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const SIZE = 64;
        const canvas = document.createElement('canvas');
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve({ x: 0.5, y: 0.5 }); return; }

        ctx.drawImage(img, 0, 0, SIZE, SIZE);
        const data = ctx.getImageData(0, 0, SIZE, SIZE).data;

        // Convert to grayscale
        const gray: number[] = new Array(SIZE * SIZE);
        for (let i = 0; i < SIZE * SIZE; i++) {
          const r = data[i * 4];
          const g = data[i * 4 + 1];
          const b = data[i * 4 + 2];
          gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
        }

        // Sobel 3x3 - compute gradient magnitude
        const mag: number[] = new Array(SIZE * SIZE).fill(0);
        for (let y = 1; y < SIZE - 1; y++) {
          for (let x = 1; x < SIZE - 1; x++) {
            const idx = y * SIZE + x;
            // Gx kernel
            const gx =
              -gray[(y - 1) * SIZE + (x - 1)] + gray[(y - 1) * SIZE + (x + 1)]
              - 2 * gray[y * SIZE + (x - 1)] + 2 * gray[y * SIZE + (x + 1)]
              - gray[(y + 1) * SIZE + (x - 1)] + gray[(y + 1) * SIZE + (x + 1)];
            // Gy kernel
            const gy =
              -gray[(y - 1) * SIZE + (x - 1)] - 2 * gray[(y - 1) * SIZE + x] - gray[(y - 1) * SIZE + (x + 1)]
              + gray[(y + 1) * SIZE + (x - 1)] + 2 * gray[(y + 1) * SIZE + x] + gray[(y + 1) * SIZE + (x + 1)];
            mag[idx] = Math.sqrt(gx * gx + gy * gy);
          }
        }

        // Weighted centroid of edge density
        let totalWeight = 0;
        let weightedX = 0;
        let weightedY = 0;
        for (let y = 1; y < SIZE - 1; y++) {
          for (let x = 1; x < SIZE - 1; x++) {
            const w = mag[y * SIZE + x];
            totalWeight += w;
            weightedX += x * w;
            weightedY += y * w;
          }
        }

        if (totalWeight < 1) {
          resolve({ x: 0.5, y: 0.5 });
          return;
        }

        const cx = weightedX / totalWeight / SIZE;
        const cy = weightedY / totalWeight / SIZE;

        // Clamp to [0.05, 0.95] to avoid extreme edges
        resolve({
          x: Math.round(Math.max(0.05, Math.min(0.95, cx)) * 100) / 100,
          y: Math.round(Math.max(0.05, Math.min(0.95, cy)) * 100) / 100,
        });
      } catch {
        resolve({ x: 0.5, y: 0.5 });
      }
    };
    img.onerror = () => resolve({ x: 0.5, y: 0.5 });
    img.src = dataUrl;
  });
}

/**
 * Reads multiple image files simultaneously and converts them into AssetItem objects.
 * Auto-detects tone (light/dark) and focal point (subject location) for each image.
 */
export async function readMultipleImageFiles(
  files: FileList | File[],
  tonePreference: Tone | 'auto' = 'auto'
): Promise<AssetItem[]> {
  const fileArray = Array.from(files).filter((file) =>
    file.type.startsWith('image/') ||
    /\.(png|jpe?g|svg|webp|gif|avif|heic|heif|tiff?|bmp)$/i.test(file.name)
  );

  if (fileArray.length === 0) return [];

  const timestamp = Date.now();
  const results: AssetItem[] = [];

  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i];
    try {
      // Convert/compress image (HEIC→JPEG, PNG→JPEG, resize large images)
      const dataUrl = await processImageFile(file);

      // Detect tone and focal point in parallel
      const [detectedTone, focalPoint] = await Promise.all([
        tonePreference === 'auto' ? detectImageLuminanceTone(dataUrl) : Promise.resolve(tonePreference as Tone),
        detectFocalPoint(dataUrl),
      ]);

      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      results.push({
        id: `asset_${timestamp}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        name: cleanName,
        url: dataUrl,
        tone: detectedTone,
        focalPoint,
      });
    } catch (err) {
      console.error(`Error loading image file ${file.name}:`, err);
    }
  }

  return results;
}

/**
 * Reads text file content (.txt) and splits phrases by commas or newlines.
 */
export async function readTextFiles(files: FileList | File[]): Promise<string[]> {
  const fileArray = Array.from(files).filter(
    (file) => file.type.startsWith('text/') || /\.txt$/i.test(file.name)
  );
  if (fileArray.length === 0) return [];

  const variations: string[] = [];
  for (const file of fileArray) {
    try {
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.onerror = reject;
        reader.readAsText(file);
      });

      const lines = text
        .split(/[\r\n,]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      variations.push(...lines);
    } catch (err) {
      console.error(`Error loading text file ${file.name}:`, err);
    }
  }

  return variations;
}

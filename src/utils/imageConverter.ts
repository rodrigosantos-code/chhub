import heic2any from 'heic2any';

/** Max dimension (width or height) before resizing */
const MAX_DIMENSION = 2400;
/** Default JPEG quality (0-1) */
const DEFAULT_QUALITY = 0.85;

/**
 * Converts any image file to a compressed JPEG data URL.
 * - HEIC/HEIF → decoded via heic2any, then compressed via Canvas
 * - PNG/TIFF/BMP/WebP/GIF → compressed via Canvas
 * - JPEG → re-compressed if over quality threshold
 * - Large images are downscaled to MAX_DIMENSION
 *
 * @returns JPEG data URL string
 */
export async function convertImageToJpeg(
  file: File,
  options?: { quality?: number; maxDimension?: number }
): Promise<string> {
  const quality = options?.quality ?? DEFAULT_QUALITY;
  const maxDim = options?.maxDimension ?? MAX_DIMENSION;

  let blob: Blob = file;

  // 1. HEIC/HEIF conversion
  const ext = file.name.toLowerCase();
  const isHeic =
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    ext.endsWith('.heic') ||
    ext.endsWith('.heif');

  if (isHeic) {
    const result = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality,
    });
    blob = Array.isArray(result) ? result[0] : result;
  }

  // 2. Load into an Image element
  const imgUrl = URL.createObjectURL(blob);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Failed to load image'));
    el.src = imgUrl;
  });
  URL.revokeObjectURL(imgUrl);

  // 3. Calculate dimensions (downscale if needed)
  let { naturalWidth: w, naturalHeight: h } = img;
  if (w > maxDim || h > maxDim) {
    const scale = maxDim / Math.max(w, h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  // 4. Draw to canvas and export as JPEG
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.drawImage(img, 0, 0, w, h);

  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Checks if a file needs conversion (non-JPEG or oversized).
 */
export function needsConversion(file: File): boolean {
  const ext = file.name.toLowerCase();
  // Always convert HEIC
  if (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    ext.endsWith('.heic') ||
    ext.endsWith('.heif')
  ) {
    return true;
  }
  // Convert non-JPEG formats
  if (
    file.type === 'image/png' ||
    file.type === 'image/tiff' ||
    file.type === 'image/bmp' ||
    file.type === 'image/webp' ||
    file.type === 'image/gif' ||
    file.type === 'image/avif' ||
    ext.endsWith('.tiff') ||
    ext.endsWith('.tif') ||
    ext.endsWith('.bmp')
  ) {
    return true;
  }
  // Convert large JPEGs (>3MB)
  if (file.size > 3 * 1024 * 1024) {
    return true;
  }
  return false;
}

/**
 * Processes an image file: converts if needed, returns JPEG data URL.
 * If the file is already a small JPEG, reads it directly.
 */
export async function processImageFile(
  file: File,
  options?: { quality?: number; maxDimension?: number }
): Promise<string> {
  if (needsConversion(file)) {
    return convertImageToJpeg(file, options);
  }

  // Small JPEG — read as-is
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

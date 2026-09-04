import heic2any from 'heic2any';

/** Max dimension (width or height) before resizing */
const MAX_DIMENSION = 2400;
/** Default JPEG quality (0-1) */
const DEFAULT_QUALITY = 0.85;

/**
 * Checks if a file format supports transparency (alpha channel).
 * These formats must NOT be converted to JPEG, as JPEG has no alpha.
 */
function hasAlphaChannel(file: File): boolean {
  const ext = file.name.toLowerCase();
  return (
    file.type === 'image/png' ||
    file.type === 'image/svg+xml' ||
    file.type === 'image/gif' ||
    file.type === 'image/webp' ||
    ext.endsWith('.png') ||
    ext.endsWith('.svg') ||
    ext.endsWith('.gif') ||
    ext.endsWith('.webp')
  );
}

/**
 * Converts an image file to a compressed JPEG data URL.
 * Only for opaque formats (HEIC, TIFF, BMP, large JPEGs).
 */
async function convertToJpeg(
  file: File,
  options?: { quality?: number; maxDimension?: number }
): Promise<string> {
  const quality = options?.quality ?? DEFAULT_QUALITY;
  const maxDim = options?.maxDimension ?? MAX_DIMENSION;

  let blob: Blob = file;

  // HEIC/HEIF conversion
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

  // Load into Image
  const imgUrl = URL.createObjectURL(blob);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Failed to load image'));
    el.src = imgUrl;
  });
  URL.revokeObjectURL(imgUrl);

  // Downscale if needed
  let { naturalWidth: w, naturalHeight: h } = img;
  if (w > maxDim || h > maxDim) {
    const scale = maxDim / Math.max(w, h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);

  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Compresses a PNG (or other alpha-capable format) while preserving transparency.
 * Only resizes if the image exceeds MAX_DIMENSION.
 */
async function compressPng(
  file: File,
  options?: { maxDimension?: number }
): Promise<string> {
  const maxDim = options?.maxDimension ?? MAX_DIMENSION;

  const imgUrl = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Failed to load image'));
    el.src = imgUrl;
  });
  URL.revokeObjectURL(imgUrl);

  let { naturalWidth: w, naturalHeight: h } = img;

  // Only re-encode via Canvas if the image is oversized
  if (w <= maxDim && h <= maxDim) {
    // Read as-is — preserves original quality and transparency
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Downscale
  const scale = maxDim / Math.max(w, h);
  w = Math.round(w * scale);
  h = Math.round(h * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Transparent background (default for canvas)
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  // Export as PNG to preserve alpha channel
  return canvas.toDataURL('image/png');
}

/**
 * Processes an image file for upload:
 * - PNG/SVG/GIF/WebP → kept as-is (preserves transparency), only resized if too large
 * - HEIC/HEIF → converted to JPEG
 * - TIFF/BMP → converted to JPEG
 * - JPEG > 3MB → re-compressed to JPEG
 * - JPEG ≤ 3MB → kept as-is
 */
export async function processImageFile(
  file: File,
  options?: { quality?: number; maxDimension?: number }
): Promise<string> {
  const ext = file.name.toLowerCase();

  // 1. SVGs are always kept as-is (vector, no conversion needed)
  if (file.type === 'image/svg+xml' || ext.endsWith('.svg')) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 2. Formats with alpha channel → compress as PNG (preserve transparency)
  if (hasAlphaChannel(file)) {
    return compressPng(file, options);
  }

  // 3. HEIC/HEIF → convert to JPEG
  const isHeic =
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    ext.endsWith('.heic') ||
    ext.endsWith('.heif');
  if (isHeic) {
    return convertToJpeg(file, options);
  }

  // 4. TIFF/BMP → convert to JPEG
  if (
    file.type === 'image/tiff' ||
    file.type === 'image/bmp' ||
    ext.endsWith('.tiff') ||
    ext.endsWith('.tif') ||
    ext.endsWith('.bmp')
  ) {
    return convertToJpeg(file, options);
  }

  // 5. Large JPEG (>3MB) → re-compress
  if (file.size > 3 * 1024 * 1024) {
    return convertToJpeg(file, options);
  }

  // 6. Small JPEG or AVIF → read as-is
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

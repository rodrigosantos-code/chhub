/**
 * Compress a base64 data URL image to a smaller version for cloud storage.
 * Returns a compressed base64 data URL or the original if not a data URL.
 *
 * Preserves PNG format (with transparency) for PNGs.
 * Converts non-transparent images to JPEG for better compression.
 */
export function compressBase64Image(
  dataUrl: string,
  maxDimension: number = 800,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve) => {
    // Skip if not a data URL
    if (!dataUrl.startsWith('data:image')) {
      resolve(dataUrl);
      return;
    }

    // Detect if source is PNG (likely has transparency)
    const isPng = dataUrl.startsWith('data:image/png');

    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Only resize if larger than max
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height / width) * maxDimension);
          width = maxDimension;
        } else {
          width = Math.round((width / height) * maxDimension);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      // For PNG: keep transparent background
      // For others: fill white then draw
      if (!isPng) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Keep PNG for transparency, JPEG for everything else
      const compressed = isPng
        ? canvas.toDataURL('image/png')
        : canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };

    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Strip all base64 data URLs from a project clone for cloud storage.
 * Images are kept in localStorage and never sent to Supabase.
 * Returns a lightweight project object (does not mutate the original).
 */
export function stripImagesForCloud(project: any): any {
  const clone = JSON.parse(JSON.stringify(project));

  for (const ag of clone.assetGroups || []) {
    const imageFolders = [
      'background', 'logo_1', 'logo_2', 'logo_3',
      'product_image_1', 'product_image_2', 'product_image_3',
    ];

    for (const folderKey of imageFolders) {
      const items = ag.folders?.[folderKey];
      if (!Array.isArray(items)) continue;

      for (const item of items) {
        // Strip main URL if it's base64
        if (item.url && item.url.startsWith('data:')) {
          item.url = '';
        }

        // Strip ratio URLs if base64
        if (item.ratioUrls) {
          for (const ratioKey of Object.keys(item.ratioUrls)) {
            if (typeof item.ratioUrls[ratioKey] === 'string' && item.ratioUrls[ratioKey].startsWith('data:')) {
              item.ratioUrls[ratioKey] = '';
            }
          }
        }
      }
    }
  }

  return clone;
}

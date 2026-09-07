import { supabase } from './supabase';

const BUCKET_NAME = 'assets';

/**
 * Upload a base64 data URL to Supabase Storage and return the public URL.
 * If the URL is already a remote URL (not base64), returns it as-is.
 */
export async function uploadBase64ToStorage(
  dataUrl: string,
  projectId: string,
  fileName: string
): Promise<string> {
  // Skip if not a data URL
  if (!dataUrl.startsWith('data:')) return dataUrl;

  // Parse the data URL
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) return dataUrl;

  const mimeType = match[1];
  const ext = mimeType.split('/')[1] || 'png';
  const base64Data = match[2];

  // Convert base64 to Uint8Array
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Generate a deterministic path based on project + filename
  const safeName = fileName.replace(/[^a-z0-9_.-]/gi, '_');
  const path = `${projectId}/${safeName}.${ext}`;

  // Upload (upsert to overwrite if exists)
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, bytes, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    console.error(`[Storage] Error uploading ${path}:`, error.message);
    // Return original data URL as fallback
    return dataUrl;
  }

  // Get public URL
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Process all assets in a project: upload base64 images to Storage
 * and replace with permanent URLs. Returns a new project object
 * with remote URLs (does not mutate the original).
 */
export async function uploadProjectAssets(project: any): Promise<any> {
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
        // Main URL
        if (item.url && item.url.startsWith('data:')) {
          item.url = await uploadBase64ToStorage(
            item.url,
            project.id,
            `${ag.id}_${folderKey}_${item.id}`
          );
        }

        // Ratio URLs
        if (item.ratioUrls) {
          for (const [ratioKey, ratioUrl] of Object.entries(item.ratioUrls)) {
            if (typeof ratioUrl === 'string' && ratioUrl.startsWith('data:')) {
              item.ratioUrls[ratioKey] = await uploadBase64ToStorage(
                ratioUrl,
                project.id,
                `${ag.id}_${folderKey}_${item.id}_ratio_${ratioKey.replace(/[:.]/g, 'x')}`
              );
            }
          }
        }
      }
    }
  }

  return clone;
}

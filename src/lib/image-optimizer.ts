/**
 * Client-Side Canvas Image Optimizer
 * Resizes and compresses image files in the browser before upload.
 * Reduces 3-10MB mobile photos down to ~50-80KB WebP/JPEG,
 * ensuring zero storage overages on free Supabase & Vercel tiers.
 */

export interface OptimizedImageResult {
  blob: Blob;
  dataUrl: string;
  sizeKb: number;
}

export function optimizeImageFile(
  file: File,
  maxWidth = 600,
  maxHeight = 600,
  quality = 0.82
): Promise<OptimizedImageResult> {
  return new Promise((resolve, reject) => {
    // If not an image, reject
    if (!file.type.startsWith("image/")) {
      reject(new Error("Selected file is not an image"));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image into memory"));
      img.onload = () => {
        // Calculate aspect-ratio preserving dimensions
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }

        // Draw image onto canvas with smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP if supported, otherwise fallback to JPEG
        let mimeType = "image/webp";
        let dataUrl = canvas.toDataURL(mimeType, quality);

        if (!dataUrl.startsWith("data:image/webp")) {
          mimeType = "image/jpeg";
          dataUrl = canvas.toDataURL(mimeType, quality);
        }

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to create optimized image blob"));
              return;
            }
            const sizeKb = Math.round(blob.size / 1024);
            resolve({ blob, dataUrl, sizeKb });
          },
          mimeType,
          quality
        );
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

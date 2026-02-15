/**
 * Image compression utilities
 */

export interface CompressedImage {
  dataUrl: string;
  fileSize: number;
  originalSize: number;
  compressionRatio: number;
}

/**
 * Compress an image using canvas with adaptive quality
 * @param file - The image file to compress
 * @param targetSize - Target file size in bytes (default: 800KB)
 * @returns Promise<CompressedImage>
 */
export const compressImage = (
  file: File,
  targetSize: number = 800 * 1024 // 800KB target (less aggressive)
): Promise<CompressedImage> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate new dimensions based on original size
        let { width, height } = img;
        const originalSize = file.size;

        // Adaptive resolution based on file size
        let maxWidth, maxHeight, baseQuality;

        if (originalSize > 4 * 1024 * 1024) { // > 4MB
          maxWidth = 800;
          maxHeight = 800;
          baseQuality = 0.7;
        } else if (originalSize > 2 * 1024 * 1024) { // > 2MB
          maxWidth = 1000;
          maxHeight = 1000;
          baseQuality = 0.75;
        } else if (originalSize > 1 * 1024 * 1024) { // > 1MB
          maxWidth = 1200;
          maxHeight = 1200;
          baseQuality = 0.8;
        } else { // < 1MB
          maxWidth = 1400;
          maxHeight = 1400;
          baseQuality = 0.85;
        }

        // Calculate new dimensions
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;

          if (width > height) {
            width = maxWidth;
            height = maxWidth / aspectRatio;
          } else {
            height = maxHeight;
            width = maxHeight * aspectRatio;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);

        // Try different quality levels to hit target size
        const tryCompression = (quality: number): Promise<string> => {
          return new Promise((resolve) => {
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(URL.createObjectURL(blob));
                } else {
                  resolve('');
                }
              },
              'image/jpeg',
              quality
            );
          });
        };

        // Binary search for optimal quality
        const findOptimalQuality = async (): Promise<{ dataUrl: string; quality: number; }> => {
          let low = 0.1;
          let high = baseQuality;
          let bestResult = { dataUrl: '', quality: baseQuality };

          for (let i = 0; i < 5; i++) { // Max 5 iterations
            const mid = (low + high) / 2;
            const dataUrl = await tryCompression(mid);

            // Skip if dataUrl is empty
            if (!dataUrl || !dataUrl.includes(',')) {
              high = mid; // Try lower quality
              continue;
            }

            // Calculate size
            const base64Data = dataUrl.split(',')[1];
            if (!base64Data) {
              high = mid; // Try lower quality
              continue;
            }
            const blobSize = Math.round(base64Data.length * 0.75); // Approximate size

            if (blobSize <= targetSize) {
              bestResult = { dataUrl, quality: mid };
              low = mid; // Try higher quality
            } else {
              high = mid; // Try lower quality
            }
          }

          return bestResult;
        };

        findOptimalQuality().then(({ dataUrl }) => {
          // Calculate final size with safety checks
          if (!dataUrl || !dataUrl.includes(',')) {
            // Fallback to basic compression if adaptive failed
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    const resultDataUrl = reader.result as string;
                    const base64Data = resultDataUrl.split(',')[1];
                    const compressedSize = Math.round(base64Data.length * 0.75);
                    const compressionRatio = (originalSize - compressedSize) / originalSize;

                    resolve({
                      dataUrl: resultDataUrl,
                      fileSize: compressedSize,
                      originalSize,
                      compressionRatio
                    });
                  };
                  reader.onerror = () => reject(new Error('Failed to read fallback image'));
                  reader.readAsDataURL(blob);
                } else {
                  reject(new Error('Failed to compress image'));
                }
              },
              'image/jpeg',
              0.8 // Better fallback quality
            );
            return;
          }

          const base64Data = dataUrl.split(',')[1];
          if (!base64Data) {
            reject(new Error('Failed to generate compressed image data'));
            return;
          }

          const compressedSize = Math.round(base64Data.length * 0.75);
          const compressionRatio = (originalSize - compressedSize) / originalSize;

          resolve({
            dataUrl,
            fileSize: compressedSize,
            originalSize,
            compressionRatio
          });
        });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Check if image needs compression
 * @param file - The image file to check
 * @param maxSize - Maximum file size in bytes (default: 2MB)
 * @returns boolean
 */
export const needsCompression = (file: File, maxSize: number = 2 * 1024 * 1024): boolean => {
  return file.size > maxSize;
};

/**
 * Check if file is too large to process
 * @param file - The image file to check
 * @param maxAllowedSize - Maximum allowed file size in bytes (default: 5MB)
 * @returns boolean
 */
export const isFileTooLarge = (file: File, maxAllowedSize: number = 5 * 1024 * 1024): boolean => {
  return file.size > maxAllowedSize;
};

/**
 * Get file size in human readable format
 * @param bytes - File size in bytes
 * @returns string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

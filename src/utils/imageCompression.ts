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
 * Compress an image using canvas
 * @param file - The image file to compress
 * @param maxWidth - Maximum width (default: 1920)
 * @param maxHeight - Maximum height (default: 1080)
 * @param quality - JPEG quality (0-1, default: 0.8)
 * @returns Promise<CompressedImage>
 */
export const compressImage = (
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
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

        // Calculate new dimensions
        let { width, height } = img;

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

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Could not compress image'));
              return;
            }

            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              const compressedSize = blob.size;
              const originalSize = file.size;
              const compressionRatio = (originalSize - compressedSize) / originalSize;

              resolve({
                dataUrl,
                fileSize: compressedSize,
                originalSize,
                compressionRatio
              });
            };
            reader.onerror = () => reject(new Error('Failed to read compressed image'));
            reader.readAsDataURL(blob);
          },
          'image/jpeg',
          quality
        );
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
 * @param maxSize - Maximum file size in bytes (default: 5MB)
 * @returns boolean
 */
export const needsCompression = (file: File, maxSize: number = 5 * 1024 * 1024): boolean => {
  return file.size > maxSize;
};

/**
 * Check if file is too large to process
 * @param file - The image file to check
 * @param maxAllowedSize - Maximum allowed file size in bytes (default: 20MB)
 * @returns boolean
 */
export const isFileTooLarge = (file: File, maxAllowedSize: number = 20 * 1024 * 1024): boolean => {
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

import { encode } from 'blurhash';

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();

    // Only apply crossOrigin and cache buster to remote HTTP/HTTPS URLs
    const isBase64 = src.startsWith('data:');
    const isBlob = src.startsWith('blob:');

    if (!isBase64 && !isBlob) {
      img.crossOrigin = 'Anonymous';
      // Append a cache buster to force a fresh request for remote images
      const sep = src.includes('?') ? '&' : '?';
      img.src = `${src}${sep}c=${Date.now()}`;
    } else {
      // For base64 or blob URLs, use as is
      img.src = src;
    }

    img.onload = () => resolve(img);
    img.onerror = (e) => {
      console.error('Failed to load image for blurhash:', { src: src.substring(0, 50) + '...', error: e });
      reject(e);
    };
  });

const getImageData = (image: HTMLImageElement): ImageData => {
  const canvas = document.createElement('canvas');
  // Resize to small dimensions for blurhash (e.g. 32x32) as it doesn't need high res
  const width = 32;
  const aspectRatio = image.height / image.width;
  const height = Math.round(width * aspectRatio);

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.drawImage(image, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
};

export const encodeImageToBlurhash = async (imageUrl: string): Promise<string> => {
  const image = await loadImage(imageUrl);
  const imageData = getImageData(image);
  return encode(imageData.data, imageData.width, imageData.height, 4, 3);
};

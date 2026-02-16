import { encode } from 'blurhash';

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = (...args) => reject(args);
    // Append a cache buster implementation to force a fresh request
    const sep = src.includes('?') ? '&' : '?';
    img.src = `${src}${sep}c=${Date.now()}`;
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

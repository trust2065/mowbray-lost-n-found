import React, { useState, useEffect } from 'react';
import { Blurhash } from 'react-blurhash';

interface GalleryProps {
  urls: string[];
  blurhashes?: string[];
  onPhotoClick?: (index: number) => void;
}

const Gallery: React.FC<GalleryProps> = ({ urls, blurhashes, onPhotoClick }) => {
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Check if the image is already cached
    const img = new Image();
    img.src = urls[idx];
    if (img.complete) {
      setLoaded(true);
    } else {
      setLoaded(false);
    }
  }, [idx, urls]);

  if (!urls.length) return <div className="bg-slate-100 dark:bg-slate-800 w-full h-full" />;

  return (
    <div
      className="relative w-full h-full group cursor-zoom-in"
      onClick={() => onPhotoClick?.(idx)}
    >
      {(blurhashes?.[idx]) && !loaded && (
        <div className="absolute inset-0 z-10">
          <Blurhash
            hash={blurhashes[idx]}
            width="100%"
            height="100%"
            resolutionX={32}
            resolutionY={32}
            punch={1}
          />
        </div>
      )}
      <img
        src={urls[idx]}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        alt="item"
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
      />
      {urls.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 px-2 py-1 bg-black/20 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {urls.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setIdx(i); }}
              className={`w-1.5 h-1.5 rounded-full ${i === idx ? 'bg-white scale-125' : 'bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Gallery;

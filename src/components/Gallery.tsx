import React, { useState } from 'react';

interface GalleryProps {
  urls: string[];
}

const Gallery: React.FC<GalleryProps> = ({ urls }) => {
  const [idx, setIdx] = useState(0);

  if (!urls.length) return <div className="bg-slate-100 w-full h-full" />;

  return (
    <div className="relative w-full h-full group">
      <img src={urls[idx]} className="w-full h-full object-cover transition-opacity duration-300" alt="item" />
      {urls.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 px-2 py-1 bg-black/20 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
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

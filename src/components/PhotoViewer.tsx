import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface PhotoViewerProps {
  urls: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

const PhotoViewer: React.FC<PhotoViewerProps> = ({ urls, initialIndex, isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  const handlePrev = React.useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : urls.length - 1));
  }, [urls.length]);

  const handleNext = React.useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev < urls.length - 1 ? prev + 1 : 0));
  }, [urls.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  if (!isOpen) return null;

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = urls[currentIndex];
    const link = document.createElement('a');
    link.href = url;
    link.download = `photo-${currentIndex + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-100 bg-black/95 backdrop-blur-xl flex items-center justify-center transition-all duration-300 animate-in fade-in"
      onClick={onClose}
    >
      <div className="absolute top-6 right-6 flex items-center gap-4 z-10">
        <button
          onClick={handleDownload}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          title="Download"
          aria-label="Download photo"
        >
          <Download className="w-6 h-6" />
        </button>
        <button
          onClick={onClose}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          aria-label="Close viewer"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {urls.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-6 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-6 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
            aria-label="Next photo"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      <div
        className="w-full h-full p-4 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={urls[currentIndex]}
          alt={`Photo ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain shadow-2xl rounded-lg animate-in zoom-in-95 duration-300"
        />
      </div>

      {urls.length > 1 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
          {urls.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(i);
              }}
              className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? 'bg-white w-6' : 'bg-white/30 hover:bg-white/50'
                }`}
            />
          ))}
        </div>
      )}

      <div className="absolute bottom-6 left-6 text-white/50 text-sm font-medium">
        {currentIndex + 1} / {urls.length}
      </div>
    </div>
  );
};

export default PhotoViewer;
